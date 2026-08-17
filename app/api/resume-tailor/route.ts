export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RESUME_JSON_SPEC } from '@/lib/resume-types';
import { checkLimit, incrementUsage } from '@/lib/usage';
import { PLAN_LABELS } from '@/lib/plans';

const TAILOR_PROMPT = `You are an expert resume writer and ATS optimization specialist. You will receive a resume as structured JSON plus a target job description. Rewrite the WRITING of the resume to be perfectly tailored to the job description, returning JSON in EXACTLY the same schema:

${RESUME_JSON_SPEC}

Rules:
- Rewrite the objective (one line) to target this specific role and company.
- Rewrite experience/leadership/project bullets to weave in keywords, skills and terminology from the job description naturally and densely, while keeping every sentence grammatical and meaningful. Never keyword-stuff into nonsense.
- SKILLS DISCIPLINE: additionalInfo must NEVER grow — same or fewer lines, same or shorter content. Reorder each line so skills the job asks for come first, then keep only a short tail of the strongest remaining skills. Drop skills irrelevant to this job rather than listing everything. Never add skills the person does not have. Experience bullets are where tailoring effort goes; the skills section stays lean (max 4 labelled lines, each about one printed line).
- NEVER invent, fabricate, or exaggerate facts: keep all names, companies, institutions, locations, dates, metrics, and numbers exactly as given. You may only rephrase the wording around them.
- Keep contact details (name, location, phone, email, linkedin, github, links) EXACTLY unchanged.
- Keep the same section headings and the same number of entries. Bullets per entry should stay the same count or fewer.
- Keep bullets concise (one line to at most two lines each) so the resume fits on ONE page.
- If the user provides EXTRA DETAILS about specific experiences (raw, informal descriptions of what they did), transform them into 2-4 strong, professional, ATS-optimized bullets for that entry using action verbs and the job description's keywords. Use ONLY facts, numbers and tools the user actually mentioned — never invent metrics or accomplishments they did not state.
- Respond with raw JSON only. No code blocks or commentary.`;

const GENERAL_PROMPT = `You are an expert resume writer and ATS optimization specialist. You will receive a resume as structured JSON. There is NO specific job description — perform a GENERAL optimization of the resume's writing, returning JSON in EXACTLY the same schema:

${RESUME_JSON_SPEC}

Rules:
- Polish the objective into one strong, professional line that reflects the person's actual field and experience (do not invent a target company or role).
- Rewrite experience/leadership/project bullets to be strong, professional, and ATS-friendly: start with varied action verbs, lead with impact and results, keep every sentence grammatical and meaningful. Never keyword-stuff.
- SKILLS DISCIPLINE: additionalInfo must NEVER grow — same or fewer lines, same or shorter content. Order each line so the strongest, most marketable skills come first. Never add skills the person does not have. Keep the skills section lean (max 4 labelled lines, each about one printed line).
- NEVER invent, fabricate, or exaggerate facts: keep all names, companies, institutions, locations, dates, metrics, and numbers exactly as given. You may only rephrase the wording around them.
- Keep contact details (name, location, phone, email, linkedin, github, links) EXACTLY unchanged.
- Keep the same section headings and the same number of entries. Bullets per entry should stay the same count or fewer.
- Keep bullets concise (one line to at most two lines each) so the resume fits on ONE page.
- If the user provides EXTRA DETAILS about specific experiences (raw, informal descriptions of what they did), transform them into 2-4 strong, professional, ATS-optimized bullets for that entry using action verbs. Use ONLY facts, numbers and tools the user actually mentioned — never invent metrics or accomplishments they did not state.
- Respond with raw JSON only. No code blocks or commentary.`;

const CONDENSE_PROMPT = `You are an expert resume editor. You will receive a resume as structured JSON that currently OVERFLOWS one page. Shorten the writing so it fits on a single page, returning JSON in EXACTLY the same schema:

${RESUME_JSON_SPEC}

Rules:
- CUT IN THIS PRIORITY ORDER: (1) FIRST shrink additionalInfo — trim skills/interests/honors lines aggressively, merge categories, drop weaker items; the whole additionalInfo section must end up at most 3 short labelled lines. (2) THEN tighten the objective to one short line. (3) ONLY THEN tighten experience/leadership/project bullets — trim the longest bullets and least impactful wording. Work experience content is the most valuable part of the resume; sacrifice skills and interests before touching it.
- Aim to cut roughly 20-25% of total text overall.
- Keep the writing professional, grammatical, and keyword-rich — do not strip important keywords.
- You may merge or drop ONLY the weakest bullet in an entry if strictly necessary, never a whole entry or section.
- NEVER change facts: names, companies, institutions, locations, dates, metrics, numbers, and contact details stay exactly as given.
- Keep section headings and entry counts unchanged.
- Respond with raw JSON only. No code blocks or commentary.`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { resumeData, jobDescription, mode, extraDetails } = body ?? {};

    if (!resumeData) {
      return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
    }
    const isCondense = mode === 'condense';
    const hasJobDescription = typeof jobDescription === 'string' && jobDescription.trim().length > 0;

    const userId = (session.user as any).id;
    // Condense passes are a free follow-up step of a tailor — only full
    // tailor/optimize runs count against the plan limit.
    if (!isCondense) {
      const chk = await checkLimit(userId, 'resumeTailor');
      if (!chk.ok) {
        return NextResponse.json(
          {
            error: `You've used all ${chk.limit} resume tailors included in your ${PLAN_LABELS[chk.plan]} plan.`,
            limitReached: true,
            feature: 'resumeTailor',
            plan: chk.plan,
            limit: chk.limit,
          },
          { status: 403 }
        );
      }
    }

    let userContent: string;
    if (isCondense) {
      userContent = `Condense this resume so it fits on one page:\n\n${JSON.stringify(resumeData)}`;
    } else {
      userContent = hasJobDescription
        ? `Here is my resume as structured JSON:\n\n${JSON.stringify(resumeData)}\n\nHere is the job description I'm applying for:\n\n${jobDescription}\n\nTailor my resume to this job.`
        : `Here is my resume as structured JSON:\n\n${JSON.stringify(resumeData)}\n\nI don't have a specific job description — please optimize my resume in general.`;
      if (Array.isArray(extraDetails) && extraDetails.length > 0) {
        const detailsText = extraDetails
          .filter((d: any) => d?.details?.trim())
          .map((d: any) => `• ${d.entryTitle}: ${d.details}`)
          .join('\n');
        if (detailsText) {
          userContent += `\n\nEXTRA DETAILS I provided about my experiences (turn these into strong professional bullets for the matching entries):\n${detailsText}`;
        }
      }
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: isCondense ? CONDENSE_PROMPT : hasJobDescription ? TAILOR_PROMPT : GENERAL_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      console.error('LLM tailor failed:', response.status, await response.text().catch(() => ''));
      return NextResponse.json({ error: 'AI request failed. Please try again.' }, { status: 502 });
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'AI returned an invalid result. Please try again.' }, { status: 502 });
    }

    if (!isCondense) {
      // Successful tailor — count it against the user's plan.
      await incrementUsage(userId, 'resumeTailor');
    }

    return NextResponse.json({ resume: parsed });
  } catch (error) {
    console.error('Resume tailor error:', error);
    return NextResponse.json({ error: 'Failed to tailor resume' }, { status: 500 });
  }
}
