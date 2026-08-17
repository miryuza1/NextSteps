// Structured data model for the Interview Prep wizard

export interface QAItem {
  question: string;
  pointers: string[];
}

export interface TellMeAboutYourself {
  pointers: string[];
  sampleScript: string;
}

export interface WhyCompany {
  pointers: string[];
  sampleAnswer: string;
}

export interface InterviewPrepPlan {
  companyStyle: string;
  candidateSummary: string;
  tellMeAboutYourself: TellMeAboutYourself;
  whyCompany: WhyCompany;
  technical: QAItem[];
  behavioural: QAItem[];
}

export const EXPERIENCE_LEVELS = [
  'Internship',
  'Entry-level / New Grad',
  'Mid-level',
  'Senior',
  'Other',
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

// JSON schema the LLM must return
export const INTERVIEW_PREP_JSON_SPEC = `{
  "companyStyle": "2-4 sentences on what THIS specific company tends to emphasize in its interviews. Be concrete: e.g. Amazon centers almost everything on its Leadership Principles (bar-raiser, STAR stories mapped to principles); Microsoft mixes behavioral and role-specific technical questions; Google leans on structured problem-solving. If interview email info was provided, tailor this to it. If genuinely unsure of a company's style, say so and give the safe general mix rather than inventing specifics.",
  "candidateSummary": "A compact 2-3 sentence factual summary of the candidate built ONLY from their resume (name, what they study or do, and their few most relevant experiences). No invented facts. Empty string if no resume was provided.",
  "tellMeAboutYourself": {
    "pointers": ["4-6 short pointers telling the candidate how to structure this answer IN THIS ORDER: (1) who you are + what you study/do + one line describing the kind of work/efforts you've been making; (2) briefly your past professional experiences over the years; (3) on-campus / club / relevant job experience that builds skills for this role; (4) a light line about spare-time interests; (5) close by connecting to what you want to do or hone at THIS company"],
    "sampleScript": "A personalized, natural, first-person script that reads in UNDER ONE MINUTE (150-190 words). Build it ONLY from the candidate's real resume facts, following the structure above, and end with what they want to do or develop at this specific company. If no resume was provided, return an empty string."
  },
  "whyCompany": {
    "pointers": ["4-6 pointers, including: pick something NICHE and specific the company does and show it genuinely matters to you (even a personal-values angle); go deeper into the actual ROLE, referencing what the company or its people say about it (e.g. rotations across different sectors every few weeks, strong mentorship, access to a broad network); mention doing homework like reading a company report or speaking to people in the program"],
    "sampleAnswer": "A personalized 150-220 word draft answer to 'Why do you want to work/intern here?'. Use real, verifiable specifics about the company and role where you are confident; if you are not sure of a specific company fact, keep that part general rather than inventing a project, statistic, or program name."
  },
  "technical": [{ "question": "A technical question specific to THIS role and level", "pointers": ["1-3 concise pointers on what a strong answer covers or how to approach it"] }],
  "behavioural": [{ "question": "A substantial behavioural question", "pointers": ["1-3 pointers on what kind of STARR story fits and what to emphasize"] }]
}`;

// Static reference content (given by the user; no AI needed)

export const STARR_STEPS: { letter: string; label: string; desc: string }[] = [
  { letter: 'S', label: 'Situation', desc: 'The problem or context at hand — set the scene briefly.' },
  { letter: 'T', label: 'Task', desc: 'What specifically needed to be solved or accomplished.' },
  { letter: 'A', label: 'Action', desc: 'What YOU did — the steps you took to work toward the solution.' },
  { letter: 'R', label: 'Result', desc: 'The outcome — what got fixed, and anything that improved as a result (use numbers where you can).' },
  { letter: 'R', label: 'Reflection', desc: 'What you learned — e.g. team management or a specific way of thinking critically.' },
];

export const BEHAVIOURAL_EXAMPLES: string[] = [
  'Which skills would you say are critical for working within a team?',
  'Has there ever been a time when you chose not to act in line with your organization’s policy?',
  'Can you give an example of how you’d appease a customer who’s disappointed with a service or product?',
  'Has there been a time that you gave negative feedback to an employee or teammate?',
  'Have you ever had to persuade or encourage your co-workers to approach a task differently?',
  'Have you ever worked within a team and found that a co-worker was struggling with a task? What did you do?',
  'Can you describe a situation where you made an error on a project? What steps did you take to correct it?',
  'Can you give an example of how you had to readdress a complicated problem after receiving important new information about it?',
];

export interface ReminderGroup {
  title: string;
  items: string[];
}

export const CLOSING_REMINDERS: ReminderGroup[] = [
  {
    title: 'Presentation & Setup',
    items: [
      'Dress formally — typically a suit and a button-down shirt (a tie is not necessary).',
      'Be well-groomed and clearly attentive to personal hygiene.',
      'For a virtual interview, make sure the room is clean, tidy, and quiet with no interruptions.',
    ],
  },
  {
    title: 'Staying Calm & Composed',
    items: [
      'It is completely okay to pause and ask for a moment to think when you get a question — just keep it to about 10–15 seconds, not longer.',
      'Breathe, slow down, and speak deliberately. A composed, structured answer beats a rushed one.',
      'Keep a pen and a physical notebook or paper handy to jot down questions the interviewer asks.',
    ],
  },
  {
    title: 'Your Questions for the Interviewer (last ~5 minutes)',
    items: [
      'Always have questions ready — ask about the role itself or about the interviewer and their experience.',
      'Listen to their answer and ask a genuine follow-up question based on it — it shows you were paying attention.',
      'Avoid questions you could have answered with a quick search; make them thoughtful and specific.',
    ],
  },
];
