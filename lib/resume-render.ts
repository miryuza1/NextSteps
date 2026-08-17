import type { ResumeData, ResumeTemplate } from './resume-types';

// US Letter at 96dpi
export const PAGE_WIDTH_PX = 816;
export const PAGE_HEIGHT_PX = 1056;

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const joinNonEmpty = (parts: string[], sep: string) => parts.filter(Boolean).join(sep);

// Turn a full URL into a clean display label, e.g.
// "https://www.linkedin.com/in/jake/" -> "linkedin.com/in/jake"
export function prettyLinkLabel(url: string): string {
  return (url || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

// CSS replicating the Jake's Resume LaTeX template (letterpaper, 11pt, ~0.5in margins,
// small-caps section headings with title rule, tabular* subheadings).
// .tpl-title-first = Jake canonical: non-bold section headings, plain dates, italic 2nd rows.
// .tpl-company-first = Mir variant: bold headings, bold first row incl. dates.
export const RESUME_CSS = `
@font-face {
  font-family: 'Latin Modern';
  font-style: normal;
  font-weight: normal;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/npm/latex.css@1.10.0/fonts/LM-regular.woff2') format('woff2');
}
@font-face {
  font-family: 'Latin Modern';
  font-style: italic;
  font-weight: normal;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/npm/latex.css@1.10.0/fonts/LM-italic.woff2') format('woff2');
}
@font-face {
  font-family: 'Latin Modern';
  font-style: normal;
  font-weight: bold;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/npm/latex.css@1.10.0/fonts/LM-bold.woff2') format('woff2');
}
@font-face {
  font-family: 'Latin Modern';
  font-style: italic;
  font-weight: bold;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/npm/latex.css@1.10.0/fonts/LM-bold-italic.woff2') format('woff2');
}
.resume-page * { margin: 0; padding: 0; box-sizing: border-box; }
.resume-page {
  font-family: 'Latin Modern', 'Computer Modern', Georgia, 'Times New Roman', serif;
  font-size: 11pt;
  color: #000;
  background: #fff;
  width: 816px;
  min-height: 1056px;
  padding: 34px 48px 30px 48px;
  line-height: 1.25;
  text-align: left;
}
.resume-page a { color: #000; text-decoration: underline; }
.r-header { text-align: center; margin-bottom: 8px; }
.r-name { font-size: 24pt; font-weight: bold; font-variant: small-caps; letter-spacing: 0.5px; line-height: 1.1; }
.r-contact { font-size: 9.5pt; margin-top: 3px; }
.r-contact .sep { padding: 0 5px; }
.r-section { margin-top: 9px; }
.r-section-title {
  font-size: 12.5pt; font-variant: small-caps;
  border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 5px;
}
.tpl-company-first .r-section-title { font-weight: bold; }
.tpl-title-first .r-section-title { font-weight: normal; }
.r-objective { font-size: 9.5pt; }
.r-entry { margin-top: 4px; }
.r-entry:first-of-type { margin-top: 1px; }
.r-row { display: flex; justify-content: space-between; align-items: baseline; }
.r-row .left { font-weight: bold; font-size: 10.5pt; }
.r-row .right { font-size: 10.5pt; white-space: nowrap; padding-left: 12px; }
.tpl-company-first .r-row .right { font-weight: bold; }
.tpl-title-first .r-row .right { font-weight: normal; }
.r-row2 { display: flex; justify-content: space-between; align-items: baseline; font-size: 9.5pt; }
.r-row2 .left, .r-row2 .right { font-style: italic; }
.r-row2 .right { white-space: nowrap; padding-left: 12px; }
.r-sub { font-size: 9.5pt; }
.r-sub .role { font-style: italic; }
.r-row .left .tech { font-weight: normal; font-style: italic; font-size: 9.5pt; }
.r-bullets { list-style: none; margin: 2px 0 0 0; padding-left: 18px; }
.r-bullets li { font-size: 9.5pt; position: relative; padding-left: 12px; margin-bottom: 1px; }
.r-bullets li::before { content: '\\2022'; position: absolute; left: 0; }
.r-addl { padding-left: 14px; }
.r-addl-item { font-size: 9.5pt; margin-bottom: 1px; }
.r-addl-item .lbl { font-weight: bold; }
`;

interface EntryView {
  titleLeft: string;      // bold left of row 1 (html allowed — pre-escaped)
  rightRow1: string;
  row2Left?: string;      // italic row 2
  row2Right?: string;
  subRole?: string;       // company-first: italic role line
  bullets: string[];
}

function renderEntry(v: EntryView): string {
  return `
  <div class="r-entry">
    <div class="r-row"><span class="left">${v.titleLeft}</span><span class="right">${esc(v.rightRow1)}</span></div>
    ${v.row2Left || v.row2Right ? `<div class="r-row2"><span class="left">${esc(v.row2Left || '')}</span><span class="right">${esc(v.row2Right || '')}</span></div>` : ''}
    ${v.subRole ? `<div class="r-sub"><span class="role">${esc(v.subRole)}</span></div>` : ''}
    ${v.bullets?.length ? `<ul class="r-bullets">${v.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  </div>`;
}

export function renderResumeBody(data: ResumeData, template: ResumeTemplate = 'title-first'): string {
  const titleFirst = template === 'title-first';

  const contactParts: string[] = [];
  // Residential address intentionally omitted from the header to save space for links.
  if (data.phone) contactParts.push(esc(data.phone));
  if (data.email) contactParts.push(`<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>`);
  if (data.linkedin) {
    const url = data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`;
    contactParts.push(`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(prettyLinkLabel(data.linkedin))}</a>`);
  }
  if (data.github) {
    const url = data.github.startsWith('http') ? data.github : `https://${data.github}`;
    contactParts.push(`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(prettyLinkLabel(data.github))}</a>`);
  }
  for (const link of data.links || []) {
    if (link?.url || link?.label) {
      const url = link.url || `https://${link.label}`;
      contactParts.push(`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(link.label || link.url)}</a>`);
    }
  }

  const sections: string[] = [];

  if (data.objective?.trim()) {
    sections.push(`
<div class="r-section">
  <div class="r-section-title">Objective</div>
  <div class="r-objective">${esc(data.objective)}</div>
</div>`);
  }

  if (data.education?.length) {
    const entries = data.education.map((e) =>
      titleFirst
        ? renderEntry({ titleLeft: esc(e.institution), rightRow1: e.location, row2Left: e.degree, row2Right: e.dateRange, bullets: [] })
        : renderEntry({ titleLeft: esc(joinNonEmpty([e.institution, e.location], ', ')), rightRow1: e.dateRange, subRole: undefined, bullets: [], row2Left: undefined, row2Right: undefined }) +
          (e.degree ? `<div class="r-sub degree">&bull;&nbsp; ${esc(e.degree)}</div>` : '')
    ).join('');
    sections.push(`
<div class="r-section">
  <div class="r-section-title">Education</div>${entries}
</div>`);
  }

  if (data.experience?.length) {
    const entries = data.experience.map((e) =>
      titleFirst
        ? renderEntry({ titleLeft: esc(e.role || e.organization), rightRow1: e.dateRange, row2Left: e.role ? e.organization : '', row2Right: e.location, bullets: e.bullets })
        : renderEntry({ titleLeft: esc(joinNonEmpty([e.organization, e.location], ', ')), rightRow1: e.dateRange, subRole: e.role, bullets: e.bullets })
    ).join('');
    sections.push(`
<div class="r-section">
  <div class="r-section-title">Work Experience</div>${entries}
</div>`);
  }

  for (const sec of data.flexSections || []) {
    if (!sec?.entries?.length) continue;
    const entries = sec.entries.map((e) => {
      const isProject = !e.role;
      if (isProject) {
        const titleLeft = e.techStack
          ? `${esc(e.title)} <span class="tech">| ${esc(e.techStack)}</span>`
          : esc(e.title);
        return renderEntry({ titleLeft, rightRow1: e.dateRange, bullets: e.bullets });
      }
      return titleFirst
        ? renderEntry({ titleLeft: esc(e.role), rightRow1: e.dateRange, row2Left: e.title, row2Right: e.location, bullets: e.bullets })
        : renderEntry({ titleLeft: esc(joinNonEmpty([e.title, e.location], ', ')), rightRow1: e.dateRange, subRole: e.role, bullets: e.bullets });
    }).join('');
    sections.push(`
<div class="r-section">
  <div class="r-section-title">${esc(sec.heading)}</div>${entries}
</div>`);
  }

  if (data.additionalInfo?.length) {
    const items = data.additionalInfo
      .map((i) => `<div class="r-addl-item"><span class="lbl">${esc(i.label)}</span>: ${esc(i.content)}</div>`)
      .join('');
    sections.push(`
<div class="r-section">
  <div class="r-section-title">Additional Information</div>
  <div class="r-addl">${items}</div>
</div>`);
  }

  return `
<div class="resume-page tpl-${template}">
  <div class="r-header">
    <div class="r-name">${esc(data.name)}</div>
    <div class="r-contact">${contactParts.join('<span class="sep">|</span>')}</div>
  </div>
  ${sections.join('\n')}
</div>`;
}

export function renderResumeHtmlDocument(data: ResumeData, template: ResumeTemplate = 'title-first'): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${RESUME_CSS}
html, body { margin: 0; padding: 0; }
</style>
</head>
<body>${renderResumeBody(data, template)}</body>
</html>`;
}
