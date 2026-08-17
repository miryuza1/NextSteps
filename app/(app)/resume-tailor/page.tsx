'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Sparkles, Copy, Check, RotateCcw, Loader2, Upload, Download,
  AlertTriangle, CheckCircle2, Wand2, Eye, Pencil, Code2, Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResumePreview from '@/components/resume-preview';
import ResumeEditor from '@/components/resume-editor';
import { generateLatex } from '@/lib/resume-latex';
import type { ResumeData, ResumeTemplate } from '@/lib/resume-types';
import { useUsage, isAtLimit } from '@/hooks/use-usage';
import { UsagePill, LimitNotice } from '@/components/usage-banner';
import { cn } from '@/lib/utils';

type Step = 'input' | 'details' | 'result';

interface SparseEntry {
  key: string;
  entryTitle: string;
  role: string;
  section: string;
  details: string;
}

// Flags experience/leadership/project entries that are barely described
function findSparseEntries(resume: ResumeData): SparseEntry[] {
  const sparse: SparseEntry[] = [];
  const isSparse = (bullets: string[] | undefined) => {
    const text = (bullets || []).join(' ').trim();
    return (bullets || []).length < 2 || text.length < 100;
  };
  (resume.experience || []).forEach((e, i) => {
    if (isSparse(e.bullets)) {
      sparse.push({ key: `exp-${i}`, entryTitle: e.organization, role: e.role, section: 'Work Experience', details: '' });
    }
  });
  (resume.flexSections || []).forEach((sec, si) => {
    (sec.entries || []).forEach((e, i) => {
      if (isSparse(e.bullets)) {
        sparse.push({ key: `flex-${si}-${i}`, entryTitle: e.title, role: e.role, section: sec.heading, details: '' });
      }
    });
  });
  return sparse;
}

export default function ResumeTailorPage() {
  const [step, setStep] = useState<Step>('input');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null);
  const [sparseEntries, setSparseEntries] = useState<SparseEntry[]>([]);
  const [needsLinkedin, setNeedsLinkedin] = useState(false);
  const [linkedinInput, setLinkedinInput] = useState('');
  const [linkedinSkipped, setLinkedinSkipped] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [condensing, setCondensing] = useState(false);
  const [template, setTemplate] = useState<ResumeTemplate>('title-first');
  const autoFitAttempts = useRef(0);

  const [latexOverride, setLatexOverride] = useState<string | null>(null);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { usage, refresh } = useUsage();
  const atLimit = isAtLimit(usage, 'resumeTailor');

  const latexCode = useMemo(
    () => (latexOverride !== null ? latexOverride : resumeData ? generateLatex(resumeData, template) : ''),
    [latexOverride, resumeData, template]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setError('');
    if (f && f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (f && f.size > 10 * 1024 * 1024) {
      setError('PDF must be under 10 MB.');
      return;
    }
    setPdfFile(f);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const postJson = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  };

  const handleGenerate = async () => {
    if (!pdfFile && !resumeText.trim()) return;
    setError('');
    setLoading(true);
    autoFitAttempts.current = 0;
    setLatexOverride(null);
    try {
      // Step 1: parse
      setLoadingMsg('Reading and recognizing your resume...');
      const parseBody: any = {};
      if (pdfFile) {
        parseBody.pdfBase64 = await fileToBase64(pdfFile);
        parseBody.filename = pdfFile.name;
      } else {
        parseBody.resumeText = resumeText;
      }
      const parseRes = await postJson('/api/resume-parse', parseBody);
      setParsedResume(parseRes.resume);

      // Step 2: figure out what we still need from the user before tailoring:
      //  - experiences that are barely described
      //  - a LinkedIn URL, if none was detected on the resume
      const sparse = findSparseEntries(parseRes.resume);
      const linkedinMissing = !parseRes.resume.linkedin?.trim();
      setSparseEntries(sparse);
      setNeedsLinkedin(linkedinMissing);
      setLinkedinInput('');
      setLinkedinSkipped(false);
      if (sparse.length > 0 || linkedinMissing) {
        setStep('details');
        setLoading(false);
        setLoadingMsg('');
        return;
      }

      await runTailor(parseRes.resume, []);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const runTailor = async (baseResume: ResumeData, extraDetails: { entryTitle: string; details: string }[]) => {
    setLoading(true);
    setError('');
    try {
      setLoadingMsg(jobDescription.trim() ? 'Tailoring your resume to the job description...' : 'Optimizing your resume...');
      const tailorRes = await postJson('/api/resume-tailor', {
        resumeData: baseResume,
        jobDescription,
        extraDetails,
      });
      setResumeData(tailorRes.resume);
      setStep('result');
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const applyLinkedin = (base: ResumeData): ResumeData =>
    needsLinkedin && linkedinInput.trim() ? { ...base, linkedin: linkedinInput.trim() } : base;

  const detailsContinueDisabled = loading || (needsLinkedin && !linkedinInput.trim() && !linkedinSkipped);

  const handleDetailsSubmit = async () => {
    if (!parsedResume) return;
    const extraDetails = sparseEntries
      .filter((s) => s.details.trim())
      .map((s) => ({ entryTitle: `${s.entryTitle}${s.role ? ` (${s.role})` : ''}`, details: s.details.trim() }));
    await runTailor(applyLinkedin(parsedResume), extraDetails);
  };

  const handleCondense = useCallback(async (auto: boolean) => {
    if (!resumeData) return;
    setCondensing(true);
    setError('');
    try {
      const res = await postJson('/api/resume-tailor', { resumeData, mode: 'condense' });
      setResumeData(res.resume);
      setLatexOverride(null);
    } catch (err: any) {
      if (!auto) setError(err?.message || 'Failed to condense. Please try again.');
    } finally {
      setCondensing(false);
    }
  }, [resumeData]);

  // Auto-fit: if content overflows one page right after generation, condense automatically (max 2 passes)
  const handleOverflowChange = useCallback((isOverflow: boolean) => {
    setOverflow(isOverflow);
  }, []);

  useEffect(() => {
    if (step === 'result' && overflow && !condensing && !loading && autoFitAttempts.current < 2) {
      autoFitAttempts.current += 1;
      handleCondense(true);
    }
  }, [overflow, step, condensing, loading, handleCondense]);

  // Generates one PDF and returns { base64, pageCount }
  const generatePdfOnce = async (data: ResumeData): Promise<{ base64: string; pageCount: number }> => {
    const createRes = await postJson('/api/generate-pdf', { resumeData: data, template });
    const requestId = createRes.request_id;
    if (!requestId) throw new Error('Failed to start PDF generation');

    const started = Date.now();
    while (Date.now() - started < 5 * 60 * 1000) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await postJson('/api/generate-pdf/status', { request_id: requestId });
      if (statusRes.status === 'SUCCESS' && statusRes.pdf_base64) {
        return { base64: statusRes.pdf_base64, pageCount: statusRes.page_count ?? 1 };
      }
      if (statusRes.status === 'FAILED') {
        throw new Error(statusRes.error || 'PDF generation failed');
      }
    }
    throw new Error('PDF generation timed out. Please try again.');
  };

  const handleDownloadPdf = async () => {
    if (!resumeData) return;
    setDownloading(true);
    setError('');
    try {
      let data = resumeData;
      let pdf = await generatePdfOnce(data);

      // Safety net: never deliver a cut-off resume. If the real PDF has more
      // than one page, auto-condense and regenerate (up to 2 passes).
      let passes = 0;
      while (pdf.pageCount > 1 && passes < 2) {
        passes += 1;
        setLoadingMsg('');
        setCondensing(true);
        try {
          const res = await postJson('/api/resume-tailor', { resumeData: data, mode: 'condense' });
          data = res.resume;
          setResumeData(data);
          setLatexOverride(null);
        } finally {
          setCondensing(false);
        }
        pdf = await generatePdfOnce(data);
      }

      if (pdf.pageCount > 1) {
        setError('The resume still runs past one page even after condensing — please trim some content in the editor, then download again.');
        return;
      }

      const blob = new Blob(
        [Uint8Array.from(atob(pdf.base64), (c) => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (data.name || 'resume').replace(/[^a-zA-Z0-9]+/g, '_');
      a.download = `${safeName}_Tailored_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLatex = async () => {
    await navigator.clipboard.writeText(latexCode);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleReset = () => {
    setStep('input');
    setResumeData(null);
    setParsedResume(null);
    setSparseEntries([]);
    setNeedsLinkedin(false);
    setLinkedinInput('');
    setLinkedinSkipped(false);
    setPdfFile(null);
    setResumeText('');
    setJobDescription('');
    setError('');
    setOverflow(false);
    setLatexOverride(null);
    autoFitAttempts.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Resume Tailor
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload your resume and get a professionally formatted, ATS-optimized one-page resume — paste a job description to tailor it to a specific role, or leave it blank for a general polish
        </p>
        <div className="mt-2">
          <UsagePill usage={usage} feature="resumeTailor" />
        </div>
      </div>

      {step === 'input' && <LimitNotice usage={usage} feature="resumeTailor" />}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {step === 'input' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Your Resume (PDF)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-pdf-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                  pdfFile ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                {pdfFile ? (
                  <span className="flex items-center justify-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 text-green-500" /> {pdfFile.name}
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    Click to upload your resume PDF
                  </span>
                )}
              </button>
              <p className="text-xs text-muted-foreground text-center">— or paste your resume text / LaTeX code below —</p>
              <Textarea
                value={resumeText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResumeText(e.target.value)}
                placeholder="Paste your resume as plain text or LaTeX source (optional if you uploaded a PDF)..."
                rows={6}
                className="resize-none font-mono text-xs"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Job Description <span className="text-sm font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={jobDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here — or leave blank for a general optimization of your resume..."
                rows={14}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || atLimit || (!pdfFile && !resumeText.trim())}
              className="w-full flex items-center gap-2"
              size="lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? loadingMsg || 'Working...' : jobDescription.trim() ? 'Tailor My Resume' : 'Optimize My Resume'}
            </Button>
            {loading && (
              <p className="text-xs text-muted-foreground text-center">
                This can take up to a minute — the AI is reading your resume and {jobDescription.trim() ? 'rewriting it for the job.' : 'polishing it for you.'}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {step === 'details' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-5">
          {needsLinkedin && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-primary" /> Add your LinkedIn
              </h2>
              <p className="text-sm text-muted-foreground">
                We didn't find a LinkedIn link on your resume. Recruiters almost always look for one, so add it here and it'll appear in the
                contact line under your name. If you genuinely don't have a profile, you can continue without it.
              </p>
              <input
                type="url"
                value={linkedinInput}
                onChange={(e) => { setLinkedinInput(e.target.value); setLinkedinSkipped(false); }}
                placeholder="linkedin.com/in/yourname"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {!linkedinInput.trim() && (
                <button
                  type="button"
                  onClick={() => setLinkedinSkipped(true)}
                  className={cn(
                    'text-xs underline underline-offset-2 transition-colors',
                    linkedinSkipped ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {linkedinSkipped ? "Okay — I'll continue without a LinkedIn" : "I don't have a LinkedIn profile"}
                </button>
              )}
            </div>
          )}

          {sparseEntries.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" /> Tell us more about what you did
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Some of your experiences are listed but barely described — and that's exactly what recruiters and ATS systems look at.
                For each one below, describe in your own words what you actually did: tasks, tools you used, numbers, results, who you worked with.
                Don't worry about wording — the AI will turn your rough notes into polished, professional bullet points.
              </p>
            </div>
          )}

          {sparseEntries.map((entry, i) => (
            <div key={entry.key} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div>
                <span className="font-semibold text-sm">{entry.entryTitle}</span>
                {entry.role && <span className="text-sm text-muted-foreground italic"> — {entry.role}</span>}
                <span className="block text-xs text-muted-foreground">{entry.section}</span>
              </div>
              <Textarea
                rows={4}
                placeholder="e.g. I helped the team analyze sales data in Excel, built weekly reports for my manager, handled customer emails, trained 2 new interns..."
                value={entry.details}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSparseEntries((prev) => prev.map((s, idx) => (idx === i ? { ...s, details: e.target.value } : s)))
                }
              />
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDetailsSubmit} disabled={detailsContinueDisabled} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? loadingMsg || 'Working...' : sparseEntries.length > 0 ? 'Continue with These Details' : 'Continue'}
            </Button>
            {sparseEntries.length > 0 && (
              <Button variant="outline" onClick={() => parsedResume && runTailor(applyLinkedin(parsedResume), [])} disabled={detailsContinueDisabled}>
                Skip — use my resume as is
              </Button>
            )}
            <Button variant="ghost" onClick={handleReset} disabled={loading} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Start Over
            </Button>
          </div>
        </motion.div>
      )}

      {step === 'result' && resumeData && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => { setTemplate('title-first'); setLatexOverride(null); }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  template === 'title-first' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Modern (Title first)
              </button>
              <button
                type="button"
                onClick={() => { setTemplate('company-first'); setLatexOverride(null); }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  template === 'company-first' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Classic (Company first)
              </button>
            </div>
            <Button onClick={handleDownloadPdf} disabled={downloading} className="flex items-center gap-2">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? (condensing ? 'Fitting to one page...' : 'Generating PDF...') : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={() => handleCondense(false)} disabled={condensing} className="flex items-center gap-2">
              {condensing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {condensing ? 'Condensing...' : 'AI Condense to Fit'}
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Start Over
            </Button>
            <div className="ml-auto">
              {condensing ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fitting to one page...
                </span>
              ) : overflow ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> Content overflows one page — use AI Condense or trim in the editor
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Fits on one page
                </span>
              )}
            </div>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview" className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Preview</TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</TabsTrigger>
              <TabsTrigger value="latex" className="flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5" /> LaTeX Code</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <ResumePreview data={resumeData} template={template} onOverflowChange={handleOverflowChange} />
            </TabsContent>

            <TabsContent value="edit" className="mt-4">
              <div className="grid xl:grid-cols-2 gap-6">
                <div className="max-h-[75vh] overflow-y-auto pr-1">
                  <ResumeEditor
                    data={resumeData}
                    onChange={(d) => {
                      setResumeData(d);
                      setLatexOverride(null);
                      autoFitAttempts.current = 2; // manual edits: don't auto-condense
                    }}
                  />
                </div>
                <div className="hidden xl:block sticky top-4 self-start">
                  <ResumePreview data={resumeData} template={template} onOverflowChange={handleOverflowChange} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="latex" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Copy this into Overleaf to compile the true LaTeX version. It uses the same template as the preview.
                </p>
                <div className="flex gap-2">
                  {latexOverride !== null && (
                    <Button variant="ghost" size="sm" onClick={() => setLatexOverride(null)}>
                      Reset to generated
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleCopyLatex} className="flex items-center gap-1.5">
                    {copiedLatex ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedLatex ? 'Copied!' : 'Copy LaTeX'}
                  </Button>
                </div>
              </div>
              <Textarea
                value={latexCode}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLatexOverride(e.target.value)}
                rows={28}
                className="font-mono text-xs"
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}
