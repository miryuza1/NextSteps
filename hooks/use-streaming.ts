'use client';

import { useState, useCallback } from 'react';

export function useStreaming() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stream = useCallback(async (url: string, body: Record<string, any>) => {
    setResult('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let partialRead = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content || '';
              if (content) {
                buffer += content;
                setResult((prev) => prev + content);
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming error:', err);
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult('');
    setError('');
    setLoading(false);
  }, []);

  return { result, loading, error, stream, reset };
}
