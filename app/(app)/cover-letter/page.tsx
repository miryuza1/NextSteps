'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles, Copy, Check, RotateCcw, Loader2, Upload, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useStreaming } from '@/hooks/use-streaming';
import { useUsage, isAtLimit } from '@/hooks/use-usage';
import { UsagePill, LimitNotice } from '@/components/usage-banner';
import { cn } from '@/lib/utils';

export default function CoverLetterPage() {
  const [name, setName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [resumePdf, setResumePdf] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { result, loading, error, stream, reset } = useStreaming();
  const { usage, refresh } = useUsage();
  const atLimit = isAtLimit(usage, 'coverLetter');

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

  const handleGenerate = async () => {
    if (!name.trim() || !jobDescription.trim()) return;
    const body: Record<string, any> = { name, jobDescription };
    if (resumePdf) {
      body.resumePdfBase64 = await fileToBase64(resumePdf);
      body.resumeFilename = resumePdf.name;
    } else if (resume.trim()) {
      body.resume = resume.trim();
    }
    await stream('/api/cover-letter', body);
    refresh();
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    reset();
    setName('');
    setJobDescription('');
    setResume('');
    clearPdf();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          Cover Letter Generator
        </h1>
        <p className="text-muted-foreground mt-1">Generate a professional, personalized cover letter in seconds</p>
        <div className="mt-2">
          <UsagePill usage={usage} feature="coverLetter" />
        </div>
      </div>

      <LimitNotice usage={usage} feature="coverLetter" />

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
            <Label className="text-base font-semibold">Your Name *</Label>
            <Input
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
            <Label className="text-base font-semibold">Job Description *</Label>
            <Textarea
              value={jobDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={8}
              className="resize-none"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
            <Label className="text-base font-semibold">Your Resume <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="cover-letter-resume-pdf"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'w-full rounded-xl border-2 border-dashed p-4 text-center transition-colors',
                resumePdf ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
              )}
            >
              {resumePdf ? (
                <span className="flex items-center justify-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-green-500" /> {resumePdf.name}
                  <span
                    role="button"
                    aria-label="Remove attached PDF"
                    onClick={(e) => { e.stopPropagation(); clearPdf(); }}
                    className="ml-1 inline-flex items-center justify-center rounded-full p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </span>
                </span>
              ) : (
                <span className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                  <Upload className="h-5 w-5" />
                  Click to attach your resume PDF
                </span>
              )}
            </button>
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            <p className="text-xs text-muted-foreground text-center">— or paste your resume text below —</p>
            <Textarea
              value={resume}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResume(e.target.value)}
              placeholder="Paste your resume for a more personalized letter..."
              rows={5}
              className="resize-none"
              disabled={!!resumePdf}
            />
            {resumePdf && (
              <p className="text-xs text-muted-foreground">Your attached PDF will be used — remove it to paste text instead.</p>
            )}
          </motion.div>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={loading || atLimit || !name.trim() || !jobDescription.trim()} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate Cover Letter'}
            </Button>
            {result && (
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" /> Start Over
              </Button>
            )}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-semibold">Generated Cover Letter</Label>
            {result && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="flex items-center gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
          </div>
          <div
            className={cn(
              'bg-card rounded-xl border border-border p-5 min-h-[460px] whitespace-pre-wrap text-sm leading-relaxed overflow-y-auto max-h-[600px]',
              !result && !loading && 'flex items-center justify-center'
            )}
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            {loading && !result ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">AI is writing your cover letter...</p>
                </div>
              </div>
            ) : result ? (
              result
            ) : (
              <p className="text-muted-foreground text-center">Your cover letter will appear here</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
