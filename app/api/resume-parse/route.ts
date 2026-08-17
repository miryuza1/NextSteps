export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RESUME_JSON_SPEC } from '@/lib/resume-types';

const SYSTEM_PROMPT = `You are an expert resume parser. You will receive a resume (as a PDF file or raw text / LaTeX source). Extract its content into structured JSON matching EXACTLY this schema:

${RESUME_JSON_SPEC}

Rules:
- Preserve all facts, names, dates, numbers EXACTLY as written. Do not invent or embellish anything.
- Keep entries in the same order as the resume (most recent first is expected).
- Put the city/state/country of each entry in its separate "location" field. Do NOT fuse locations into "institution" / "organization" / "title" strings.
- Header links (LinkedIn, GitHub, portfolio) go into "links" with a proper https:// url.
- If the resume shows a GPA, include it as part of the education "degree" field so it renders on the SAME line as the degree name (e.g. "Bachelor of Science in Economics, GPA: 3.8/4.0"). Never place the GPA on its own separate line or in additionalInfo.
- Sections like "Leadership", "Projects", "Activities", "Certifications with entries" that are not Education/Work Experience/Additional Info go into flexSections, preserving their original heading. For project-style entries with no role line, set "role" to an empty string and put the tools/technologies used (if shown, e.g. after a | separator) into "techStack".
- Trailing summary lists (Skills, Technical Skills, Honors, Interests, Languages, etc.) go into additionalInfo, one item per labelled line.
- SKILLS DISCIPLINE: additionalInfo must contain AT MOST 4 labelled lines, each fitting roughly one printed line (~110 characters of content). If the resume lists a bloated or repetitive skills section, CONSOLIDATE it: merge overlapping categories (e.g. Languages / Frameworks / Developer Tools / Libraries), keep the strongest and most marketable skills, and drop filler (e.g. "Microsoft Word", duplicated variants). A resume is judged by experience, not by an exhaustive skills dump.
- If the resume has no objective/summary line, write a concise professional one-line objective based on the resume content.
- Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pdfBase64, filename, resumeText } = body ?? {};

    if (!pdfBase64 && !resumeText) {
      return NextResponse.json({ error: 'Provide a resume PDF or resume text' }, { status: 400 });
    }

    let userContent: any;
    if (pdfBase64) {
      userContent = [
        {
          type: 'file',
          file: {
            filename: filename || 'resume.pdf',
            file_data: `data:application/pdf;base64,${pdfBase64}`,
          },
        },
        { type: 'text', text: 'Parse this resume into the structured JSON schema.' },
      ];
    } else {
      userContent = `Parse this resume into the structured JSON schema. Resume content (may be plain text or LaTeX source):\n\n${resumeText}`;
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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      console.error('LLM parse failed:', response.status, await response.text().catch(() => ''));
      return NextResponse.json({ error: 'Failed to analyze the resume. Please try again.' }, { status: 502 });
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Could not understand the resume structure. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ resume: parsed });
  } catch (error) {
    console.error('Resume parse error:', error);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
