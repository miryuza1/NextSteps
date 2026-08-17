'use client';

import { useCallback, useEffect, useState } from 'react';

export interface UsageData {
  plan: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
  planLabel: string;
  limits: {
    resumeTailor: number;
    coverLetter: number;
    interviewPrep: number;
    tracker: number;
  };
  used: {
    resumeTailor: number;
    coverLetter: number;
    interviewPrep: number;
    tracker: number;
  };
}

export type UsageFeature = keyof UsageData['limits'];

export function useUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { usage, loading, refresh };
}

// Convenience helpers for feature pages.
export function isAtLimit(usage: UsageData | null, feature: UsageFeature): boolean {
  if (!usage) return false; // don't block while loading
  const limit = usage.limits[feature];
  if (limit < 0) return false; // unlimited
  return usage.used[feature] >= limit;
}

export function usageLabel(usage: UsageData | null, feature: UsageFeature): string | null {
  if (!usage) return null;
  const limit = usage.limits[feature];
  if (limit < 0) return null; // unlimited — nothing to show
  return `${Math.min(usage.used[feature], limit)} / ${limit}`;
}
