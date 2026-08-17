'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Sparkles, Loader2, Upload, CheckCircle2, X, Copy, Check,
  ArrowRight, ArrowLeft, RotateCcw, User, Building2, Wrench, Users, ClipboardCheck,
  Lightbulb, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AnswerPractice from '@/components/answer-practice';
import {
  EXPERIENCE_LEVELS, STARR_STEPS, CLOSING_REMINDERS,
  type InterviewPrepPlan,
} from '@/lib/interview-types';
import { useUsage, isAtLimit } from '@/hooks/use-usage';
import { UsagePill, LimitNotice } from '@/components/usage-banner';
import { cn } from '@/lib/utils';

type Section = 'intake' | 'tell-me' | 'why-company' | 'technical' | 'behavioural' | 'closing';

const STEPS: { id: Section; label: string; icon: any }[] = [
  { id: 'intake', label: 'Setup', icon: ClipboardCheck },
  { id: 'tell-me', label: 'About You', icon: User },
  { id: 'why-company', label: 'Why Them', icon: Building2 },
  { id: 'technical', label: 'Technical', icon: Wrench },
  { id: 'behavioural', label: 'Behavioural', icon: Users },
  { id: 'closing', label: 'Final Tips', icon: CheckCircle2 },
];

function Pointers({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {(items || []).map((p, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

export default function InterviewPrepPage() {
  const [section, setSection] = useState<Section>('intake');

  // intake fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [level, setLevel] = useState<string>('');
  const [jobDescription, setJobDescription] = useState('');
  const [interviewInfo, setInterviewInfo] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumePdf, setResumePdf] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<InterviewPrepPlan | null>(null);
  const { usage, refresh } = useUsage();
  const atLimit = isAtLimit(usage, 'interviewPrep');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFileError('');
    if (f && f.type !== 'application/pdf') {
      setFileError('Please upload a PDF file.');
      return;
    }
    if (f && f.size > 10 * 1024 * 1024) {
      setFileError('PDF must be under 10 MB.');
      return;
    }
    setResumePdf(f);
  };

  const clearPdf = () => {
    setResumePdf(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const canGenerate = company.trim() && role.trim() && jobDescription.trim();

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError('');
    try {
      const body: Record<string, any> = { company, role, level, jobDescription, interviewInfo };
      if (resumePdf) {
        body.resumePdfBase64 = await fileToBase64(resumePdf);
        body.resumeFilename = resumePdf.name;
      } else if (resumeText.trim()) {
        body.resume = resumeText.trim();
      }
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      refresh();
      setPlan(data.plan as InterviewPrepPlan);
      setSection('tell-me');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlan(null);
    setSection('intake');
    setCompany(''); setRole(''); setLevel(''); setJobDescription('');
    setInterviewInfo(''); setResumeText(''); clearPdf(); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentIndex = STEPS.findIndex((s) => s.id === section);
  const goNext = () => {
    const next = STEPS[currentIndex + 1];
    if (next) { setSection(next.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const goBack = () => {
    const prev = STEPS[currentIndex - 1];
    if (prev) { setSection(prev.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const NavButtons = ({ nextLabel }: { nextLabel?: string }) => (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <Button variant="outline" onClick={goBack} disabled={currentIndex <= 1} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={handleReset} className="flex items-center gap-2 text-muted-foreground">
          <RotateCcw className="h-4 w-4" /> Start over
        </Button>
        {section !== 'closing' && (
          <Button onClick={goNext} className="flex items-center gap-2">
            {nextLabel || 'Next section'} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const cardStyle = { boxShadow: 'var(--shadow-sm)' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          Interview Prep
        </h1>
        <p className="text-muted-foreground mt-1">
          Company- and role-specific coaching, step by step — from “Tell me about yourself” to your final-day checklist.
        </p>
        <div className="mt-2">
          <UsagePill usage={usage} feature="interviewPrep" />
        </div>
      </div>

      {!plan && <LimitNotice usage={usage} feature="interviewPrep" />}

      {/* Stepper */}
      {plan && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = s.id === section;
            const done = i < currentIndex;
            return (
              <button
                key={s.id}
                onClick={() => { if (i >= 1) { setSection(s.id); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                disabled={i === 0}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                  active ? 'bg-primary text-primary-foreground'
                    : done ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {/* ---------- INTAKE ---------- */}
      {section === 'intake' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4" style={cardStyle}>
            <p className="text-sm text-muted-foreground">
              First, tell us about the interview so we can tailor everything. If your interview invitation email said anything
              about the format (e.g. “two behavioural rounds”, “a coding assessment”, “Leadership Principles”), paste it below —
              it makes the technical and behavioural questions far more accurate.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company <span className="text-destructive">*</span></Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Microsoft" />
              </div>
              <div className="space-y-2">
                <Label>Role / Position <span className="text-destructive">*</span></Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Finance Rotation Program Intern" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Experience level</Label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                      level === lvl
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Job description <span className="text-destructive">*</span></Label>
              <Textarea
                value={jobDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={7}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Interview details from your email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={interviewInfo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterviewInfo(e.target.value)}
                placeholder="Anything the recruiter told you about the interview format, rounds, or focus areas..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Resume */}
            <div className="space-y-2">
              <Label>Your resume <span className="text-muted-foreground font-normal">(optional, but makes “About you” personalized)</span></Label>
              <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              {resumePdf ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {resumePdf.name}
                  </span>
                  <button onClick={clearPdf} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 px-4 py-4 text-sm text-muted-foreground transition-colors"
                >
                  <Upload className="h-4 w-4" /> Click to attach your resume PDF
                </button>
              )}
              {fileError && <p className="text-sm text-destructive">{fileError}</p>}
              <p className="text-xs text-muted-foreground">
                — or paste your resume text below (if you already built one here, paste the same text) —
              </p>
              <Textarea
                value={resumeText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResumeText(e.target.value)}
                placeholder={resumePdf ? 'Your attached PDF will be used — remove it to paste text instead.' : 'Paste your resume text here...'}
                rows={5}
                disabled={!!resumePdf}
                className="resize-none"
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading || atLimit || !canGenerate} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Building your prep plan...' : 'Build my prep plan'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ---------- TELL ME ABOUT YOURSELF ---------- */}
      {section === 'tell-me' && plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <SectionHeader icon={User} title="“Tell me about yourself”"
            subtitle="This is almost always the first question. Aim for a tight, memorized answer that runs under a minute." />

          {plan.companyStyle && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed">
              <p className="font-semibold flex items-center gap-1.5 mb-1"><Target className="h-4 w-4 text-amber-600" /> How {company} tends to interview</p>
              {plan.companyStyle}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5 space-y-3" style={cardStyle}>
            <p className="font-semibold text-sm">How to structure it</p>
            <Pointers items={plan.tellMeAboutYourself?.pointers} />
          </div>

          {plan.tellMeAboutYourself?.sampleScript ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-2" style={cardStyle}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Your personalized script (memorize this)</p>
                <CopyButton text={plan.tellMeAboutYourself.sampleScript} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{plan.tellMeAboutYourself.sampleScript}</p>
              <p className="text-xs text-muted-foreground pt-1">Tip: read it aloud and time yourself — it should land under 60 seconds.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Add your resume on the setup step to get a fully personalized script here.
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5 space-y-3" style={cardStyle}>
            <p className="font-semibold text-sm">Practice your version</p>
            <AnswerPractice section="tell-me" company={company} role={role} candidateSummary={plan.candidateSummary}
              placeholder="Write your own 'tell me about yourself' here to get feedback..." />
          </div>

          <NavButtons />
        </motion.div>
      )}

      {/* ---------- WHY THIS COMPANY ---------- */}
      {section === 'why-company' && plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <SectionHeader icon={Building2} title={`“Why do you want to work at ${company}?”`}
            subtitle="Show genuine, specific interest — not something they could copy-paste for any company." />

          <div className="rounded-xl border border-border bg-card p-5 space-y-3" style={cardStyle}>
            <p className="font-semibold text-sm">How to nail it</p>
            <Pointers items={plan.whyCompany?.pointers} />
          </div>

          {plan.whyCompany?.sampleAnswer && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-2" style={cardStyle}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">A sample answer to adapt</p>
                <CopyButton text={plan.whyCompany.sampleAnswer} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{plan.whyCompany.sampleAnswer}</p>
              <p className="text-xs text-muted-foreground pt-1">Replace any general lines with a real, specific detail you personally care about.</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5 space-y-3" style={cardStyle}>
            <p className="font-semibold text-sm">Practice your version</p>
            <AnswerPractice section="why-company" company={company} role={role} candidateSummary={plan.candidateSummary}
              placeholder={`Write why you want to work at ${company}...`} />
          </div>

          <NavButtons />
        </motion.div>
      )}

      {/* ---------- TECHNICAL ---------- */}
      {section === 'technical' && plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <SectionHeader icon={Wrench} title="Technical questions"
            subtitle={`Tailored to a ${level || ''} ${role} role. Practice explaining your thinking out loud.`} />

          <div className="space-y-4">
            {(plan.technical || []).map((q, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3" style={cardStyle}>
                <p className="font-semibold text-sm flex gap-2">
                  <span className="text-primary">Q{i + 1}.</span> {q.question}
                </p>
                {q.pointers?.length > 0 && (
                  <div className="pl-1"><Pointers items={q.pointers} /></div>
                )}
                <AnswerPractice section="technical" question={q.question} company={company} role={role}
                  candidateSummary={plan.candidateSummary} compact />
              </div>
            ))}
          </div>

          <NavButtons />
        </motion.div>
      )}

      {/* ---------- BEHAVIOURAL ---------- */}
      {section === 'behavioural' && plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <SectionHeader icon={Users} title="Behavioural questions"
            subtitle="Answer every one of these with a real story, structured in the STARR format." />

          {/* STARR explainer */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
            <p className="font-semibold text-sm">Answer in the STARR format</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {STARR_STEPS.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-bold">{s.letter}</div>
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Behavioural-technical questions (e.g. “Tell me about a time you debugged a complex system”) use STARR too.
            </p>
          </div>

          <div className="space-y-4">
            {(plan.behavioural || []).map((q, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3" style={cardStyle}>
                <p className="font-semibold text-sm flex gap-2">
                  <span className="text-primary">Q{i + 1}.</span> {q.question}
                </p>
                {q.pointers?.length > 0 && (
                  <div className="pl-1"><Pointers items={q.pointers} /></div>
                )}
                <AnswerPractice section="behavioural" question={q.question} company={company} role={role}
                  candidateSummary={plan.candidateSummary} compact
                  placeholder="Draft your STARR answer (Situation, Task, Action, Result, Reflection)..." />
              </div>
            ))}
          </div>

          <NavButtons />
        </motion.div>
      )}

      {/* ---------- CLOSING ---------- */}
      {section === 'closing' && plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <SectionHeader icon={CheckCircle2} title="Final-day reminders"
            subtitle="Small things that make a big impression. Run through this before you log on or walk in." />

          <div className="space-y-4">
            {CLOSING_REMINDERS.map((group, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3" style={cardStyle}>
                <p className="font-semibold text-sm">{group.title}</p>
                <ul className="space-y-2">
                  {group.items.map((item, j) => (
                    <li key={j} className="flex gap-2.5 text-sm leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed">
            You’ve got a script for “about you”, a specific “why {company}” answer, technical and behavioural questions rehearsed in STARR,
            and your final checklist. Take a breath — you’re ready. Best of luck!
          </div>

          <NavButtons />
        </motion.div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" /> {title}
      </h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}