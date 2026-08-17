// Structured resume data model — supports both LaTeX resume templates

// 'company-first': Mir variant — bold "Company, Location" left + bold dates right, italic role below
// 'title-first':   Jake canonical — bold Title left + plain dates right, italic org left + italic location right
export type ResumeTemplate = 'company-first' | 'title-first';

export interface ResumeLink {
  label: string; // display text e.g. "linkedin.com/in/jake"
  url: string;   // full url
}

export interface EducationEntry {
  institution: string;   // "University of Washington"
  location: string;      // "Seattle, WA"
  degree: string;        // "Bachelor of Science in Economics: Data Science, Dean's List"
  dateRange: string;     // "Exp: Dec 2026" or "Aug. 2018 -- May 2021"
}

export interface ExperienceEntry {
  organization: string;  // "DH Partners Limited"
  location: string;      // "Karachi, Pakistan"
  role: string;          // "Data & Financial Analyst Intern"
  dateRange: string;     // "Aug 2025 -- Sep 2025"
  bullets: string[];
}

// Flexible section entry: leadership roles AND projects.
// Project: role empty, techStack optionally set ("Python, Flask, React").
export interface FlexEntry {
  title: string;         // org or project name
  location: string;      // location; empty for projects
  role: string;          // italic subtitle; empty for projects
  techStack: string;     // tech list for projects; empty otherwise
  dateRange: string;
  bullets: string[];
}

export interface FlexSection {
  heading: string;       // e.g. "Leadership & Academic Achievements", "Projects"
  entries: FlexEntry[];
}

export interface AdditionalInfoItem {
  label: string;         // "Honors", "Technical Skills", ...
  content: string;       // comma-separated list text
}

export interface ResumeData {
  name: string;
  location: string;
  phone: string;
  email: string;
  linkedin?: string;   // full https URL to LinkedIn profile; empty/omitted if none
  github?: string;     // full https URL to GitHub profile; empty/omitted if none
  links: ResumeLink[]; // OTHER links only (portfolio, personal website, etc.) — not LinkedIn/GitHub
  objective: string;     // one-line objective; empty string = section omitted
  education: EducationEntry[];
  experience: ExperienceEntry[];
  flexSections: FlexSection[];
  additionalInfo: AdditionalInfoItem[];
}

export const RESUME_JSON_SPEC = `{
  "name": "Full Name",
  "location": "City, State/Country",
  "phone": "phone number or empty string",
  "email": "email address or empty string",
  "linkedin": "full https URL to the LinkedIn profile, or empty string if none present",
  "github": "full https URL to the GitHub profile, or empty string if none present",
  "links": [{ "label": "display text", "url": "https://full-url" }],
  "objective": "One-line professional objective statement",
  "education": [{ "institution": "University Name", "location": "City, State", "degree": "Degree name and distinctions, INCLUDING the GPA on this same line if the resume shows one, e.g. 'Bachelor of Science in Economics, GPA: 3.8/4.0'", "dateRange": "e.g. Exp: Dec 2026 or Aug. 2018 -- May 2021" }],
  "experience": [{ "organization": "Company Name", "location": "City, Country", "role": "Job Title", "dateRange": "Mon YYYY -- Mon YYYY", "bullets": ["achievement bullet", "..."] }],
  "flexSections": [{ "heading": "Leadership & Academic Achievements OR Projects OR similar", "entries": [{ "title": "Org or Project Name", "location": "City (empty string for projects)", "role": "Role title (empty string for projects)", "techStack": "Python, Flask, React (projects only; else empty string)", "dateRange": "Mon YYYY -- Present", "bullets": ["..."] }] }],
  "additionalInfo": [{ "label": "Honors / Technical Skills / Languages / Frameworks / Interests etc.", "content": "comma-separated items" }]
}`;
