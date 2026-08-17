'use client';

import { useState } from 'react';
import { MessageSquareText, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface AnswerPracticeProps {
  section: 'tell-me' | 'why-company' | 'technical' | 'behavioural';
  question?: string;
  company?: string;
  role?: string;
  candidateSummary?: string;
  placeholder?: string;
  compact?: boolean;
}

export default function AnswerPractice({
  section,
  question,
  company,
  role,
  candidateSummary,
  placeholder,
  compact,
}: AnswerPracticeProps) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getFeedback = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError('');
    setFeedback('');
    try {
      const res = await fetch('/api/interview-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, question, userAnswer: answer, company, role, candidateSummary }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || `Request failed (${res.status})`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream');
      const decoder = new TextDecoder();
      let partial = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partial += decoder.decode(value, { stream: true });
        const lines = partial.split('\n');
        partial = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content || '';
              if (content) setFeedback((prev) => prev + content);
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={answer}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
        placeholder={placeholder || 'Type your answer here to practice, then get instant coaching feedback...'}
        rows={compact ? 4 : 6}
        className="resize-none"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={getFeedback} disabled={loading || !answer.trim()} className="flex items-center gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />}
          {loading ? 'Reviewing...' : 'Get feedback on my answer'}
        </Button>
        {(feedback || error) && !loading && (
          <Button size="sm" variant="ghost" onClick={() => { setFeedback(''); setError(''); }} className="flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {(feedback || (loading && !feedback)) && (
        <div
          className={cn(
            'rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed whitespace-pre-wrap'
          )}
        >
          <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
            <MessageSquareText className="h-4 w-4" /> Coach feedback
          </p>
          {feedback || <span className="text-muted-foreground">Reviewing your answer...</span>}
        </div>
      )}
    </div>
  );
}
