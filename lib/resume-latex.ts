import type { ResumeData, ResumeTemplate } from './resume-types';
import { prettyLinkLabel } from './resume-render';

function texEsc(s: string): string {
  return (s || '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

const PREAMBLE_SHARED_TOP = String.raw`%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}
`;

// Canonical Jake Ryan template: non-bold small-caps section titles, plain
// right-hand dates, italic second row, 0.97\textwidth sub-tables.
const PREAMBLE_TITLE_FIRST = String.raw`${PREAMBLE_SHARED_TOP}
% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}
`;

// Classic company-first variant: bold section titles, bold right-hand dates,
// full-width tables.
const PREAMBLE_COMPANY_FIRST = String.raw`${PREAMBLE_SHARED_TOP}
% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\bfseries\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{\textwidth}[t]{@{}l@{\extracolsep{\fill}}r@{}}
      \textbf{#1} & \textbf{#2} \\
      \textit{\small#3} & {\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & \textbf{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}[leftmargin=*]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

% Same bullet symbol & size for all itemize levels
\setlist[itemize]{leftmargin=*}
\renewcommand\labelitemi{\large$\vcenter{\hbox{\large$\bullet$}}$}
\renewcommand\labelitemii{\large$\vcenter{\hbox{\large$\bullet$}}$}
%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}
`;

function joinNonEmpty(parts: (string | undefined)[], sep: string): string {
  return parts.filter((p) => p && p.trim()).join(sep);
}

export function generateLatex(data: ResumeData, template: ResumeTemplate = 'title-first'): string {
  const isTitleFirst = template === 'title-first';
  const lines: string[] = [isTitleFirst ? PREAMBLE_TITLE_FIRST : PREAMBLE_COMPANY_FIRST];

  // Header
  const contactParts: string[] = [];
  // Residential address intentionally omitted from the header to save space for links.
  if (data.phone) contactParts.push(texEsc(data.phone));
  if (data.email) contactParts.push(`\\href{mailto:${data.email}}{\\underline{${texEsc(data.email)}}}`);
  if (data.linkedin) {
    const url = data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`;
    contactParts.push(`\\href{${url}}{\\underline{${texEsc(prettyLinkLabel(data.linkedin))}}}`);
  }
  if (data.github) {
    const url = data.github.startsWith('http') ? data.github : `https://${data.github}`;
    contactParts.push(`\\href{${url}}{\\underline{${texEsc(prettyLinkLabel(data.github))}}}`);
  }
  for (const link of data.links || []) {
    if (link?.url || link?.label) {
      const url = link.url || `https://${link.label}`;
      contactParts.push(`\\href{${url}}{\\underline{${texEsc(link.label || link.url)}}}`);
    }
  }
  lines.push(`
%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${texEsc(data.name)}} \\\\ \\vspace{1pt}
    \\small ${contactParts.join(' $|$ ')}
\\end{center}
`);

  if (data.objective?.trim()) {
    lines.push(`\\section{Objective}
\\small{{${texEsc(data.objective)}}}
`);
  }

  if (data.education?.length) {
    lines.push(`%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart`);
    for (const e of data.education) {
      if (isTitleFirst) {
        lines.push(`    \\resumeSubheading
      {${texEsc(e.institution)}}{${texEsc(e.location || '')}}
      {${texEsc(e.degree)}}{${texEsc(e.dateRange)}}`);
      } else {
        const left = joinNonEmpty([e.institution, e.location], ', ');
        lines.push(`    \\resumeSubheading
      {${texEsc(left)}}{${texEsc(e.dateRange)}}
      {$\\bullet$ ${texEsc(e.degree)}}{}`);
      }
    }
    lines.push(`  \\resumeSubHeadingListEnd\n`);
  }

  const bulletBlock = (bullets: string[]) => {
    if (!bullets?.length) return '';
    const out: string[] = ['      \\resumeItemListStart'];
    for (const b of bullets) out.push(`        \\resumeItem{${texEsc(b)}}`);
    out.push('      \\resumeItemListEnd');
    return '\n' + out.join('\n');
  };

  const experienceEntry = (org: string, location: string, role: string, dateRange: string, bullets: string[]) => {
    if (isTitleFirst) {
      // Jake style: role bold + date row 1, org italic + location italic row 2
      return `    \\resumeSubheading
      {${texEsc(role || org)}}{${texEsc(dateRange)}}
      {${texEsc(role ? org : location)}}{${texEsc(role ? location : '')}}${bulletBlock(bullets)}`;
    }
    const left = joinNonEmpty([org, location], ', ');
    return `    \\resumeSubheading
      {${texEsc(left)}}{${texEsc(dateRange)}}
      {${role ? `\\textit{${texEsc(role)}}` : ''}}{}${bulletBlock(bullets)}`;
  };

  if (data.experience?.length) {
    lines.push(`%-----------EXPERIENCE-----------
\\section{Work Experience}
  \\resumeSubHeadingListStart`);
    for (const e of data.experience) {
      lines.push(experienceEntry(e.organization, e.location || '', e.role, e.dateRange, e.bullets));
    }
    lines.push(`  \\resumeSubHeadingListEnd\n`);
  }

  for (const sec of data.flexSections || []) {
    if (!sec?.entries?.length) continue;
    lines.push(`%-----------${sec.heading.toUpperCase().replace(/[^A-Z ]/g, '')}-----------
\\section{${texEsc(sec.heading)}}
  \\resumeSubHeadingListStart`);
    for (const e of sec.entries) {
      const isProject = !e.role?.trim();
      if (isProject) {
        // Project-style heading: **Title** | _techStack_  ......  dateRange
        const left = e.techStack?.trim()
          ? `\\textbf{${texEsc(e.title)}} $|$ \\emph{${texEsc(e.techStack)}}`
          : `\\textbf{${texEsc(e.title)}}`;
        lines.push(`    \\resumeProjectHeading
      {${left}}{${texEsc(e.dateRange)}}${bulletBlock(e.bullets)}`);
      } else {
        lines.push(experienceEntry(e.title, e.location || '', e.role, e.dateRange, e.bullets));
      }
    }
    lines.push(`  \\resumeSubHeadingListEnd\n`);
  }

  if (data.additionalInfo?.length) {
    lines.push(`%-----------ADDITIONAL INFO-----------
\\section{Additional Information}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{`);
    for (const i of data.additionalInfo) {
      lines.push(`     \\textbf{${texEsc(i.label)}}{: ${texEsc(i.content)}} \\\\`);
    }
    lines.push(` }}
 \\end{itemize}\n`);
  }

  lines.push(`%-------------------------------------------
\\end{document}`);

  return lines.join('\n');
}
