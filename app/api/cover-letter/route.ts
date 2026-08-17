export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkLimit, incrementUsage } from '@/lib/usage';
import { PLAN_LABELS } from '@/lib/plans';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const userId = (session.user as any).id;

  const chk = await checkLimit(userId, 'coverLetter');
  if (!chk.ok) {
    return new Response(
      JSON.stringify({
        error: `You've used all ${chk.limit} cover letters included in your ${PLAN_LABELS[chk.plan]} plan.`,
        limitReached: true,
        feature: 'coverLetter',
        plan: chk.plan,
        limit: chk.limit,
      }),
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, jobDescription, resume, resumePdfBase64, resumeFilename } = body ?? {};

  if (!name || !jobDescription) {
    return new Response(JSON.stringify({ error: 'Name and job description are required' }), { status: 400 });
  }

  const promptText = resume
    ? `My name is ${name}.\n\nHere is my resume:\n${resume}\n\nHere is the job description:\n${jobDescription}\n\nPlease write a professional, personalized cover letter for this position.`
    : `My name is ${name}.\n\nHere is the job description:\n${jobDescription}\n\n${resumePdfBase64 ? 'My resume is attached as a PDF. ' : ''}Please write a professional, personalized cover letter for this position.`;

  // If a resume PDF was attached, send it to the model alongside the text prompt
  const userContent: any = resumePdfBase64
    ? [
        {
          type: 'file',
          file: {
            filename: resumeFilename || 'resume.pdf',
            file_data: `data:application/pdf;base64,${resumePdfBase64}`,
          },
        },
        { type: 'text', text: promptText },
      ]
    : promptText;

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert cover letter writer. Write a compelling, professional cover letter that:

STRUCTURE (follow this order; the whole letter must read as one smooth, connected narrative — never a list of disjointed statements):

1. OPENING PARAGRAPH — build up to the hook, do NOT lead with a bare stat line. Open the FIRST paragraph by naming the exact role the candidate is applying for and expressing specific enthusiasm for it, then EARN attention by weaving in ONE standout, concrete achievement (or a sharp, role-relevant framing) as a natural part of that paragraph. The hook should feel motivated by the sentence before it, so the reader glides from "why this role" into "here's proof I can do it." Never drop a jarring one-line boast as the opener, and never begin with "I am excited to apply..." or a dry "A 6 kW calculation, a 3-member team, and an award..." enumeration. Aim for a confident, flowing paragraph a hiring manager wants to keep reading.

2. BODY (1-2 paragraphs) — do not rehash the whole resume. Pick the 1-2 most important requirements from the job description and PROVE them with specific, quantified examples from the resume (GPA, team size, percentages, dollar amounts, timelines, power/output figures, page counts, model counts, etc.). Use real numbers, and explicitly tie each example back to what the job asks for. Concrete results beat adjectives.

3. Show genuine, specific enthusiasm for THIS role and company (reference what the role actually involves), never generic flattery.

4. CLOSING PARAGRAPH (call to action must be the LAST line): briefly restate the value the candidate brings, and if you include a thank-you place it BEFORE the call to action so the letter ENDS on the request. The final sentence before the sign-off must explicitly ask for an interview or conversation (e.g. "I would welcome the opportunity to discuss ... in an interview."). Do NOT end on "Thank you for your time and consideration."

5. FLOW: each paragraph should transition smoothly into the next; the letter must feel cohesive and deliberately built, not a stack of separate claims. Maintain a professional yet personable tone throughout. Start with a "Dear Hiring Manager," greeting and end with "Sincerely," followed by the candidate's name.

LENGTH LIMIT (STRICT): The letter body must be between 250 and 380 words TOTAL so it comfortably fits on one page with strong readability. Aim for 3-4 tight paragraphs. Never exceed 380 words. Every sentence must earn its place — cut filler and generic praise.

NEVER invent facts, employers, metrics, or qualifications the candidate did not provide. Only use numbers and achievements that actually appear in the resume or job description; never fabricate a statistic to sound impressive.

Return ONLY the cover letter text (greeting through sign-off). Do not include any preamble or commentary.`,
        },
        { role: 'user', content: userContent },
      ],
      stream: true,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'LLM API request failed' }), { status: 502 });
  }

  // Generation succeeded — count it against the user's plan.
  await incrementUsage(userId, 'coverLetter');

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      try {
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          const chunk = decoder.decode(value);
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
