'use client';

import { Sparkles } from 'lucide-react';
import { UsageData, UsageFeature, isAtLimit, usageLabel } from '@/hooks/use-usage';

const FEATURE_NOUNS: Record<UsageFeature, string> = {
  resumeTailor: 'resume tailors',
  coverLetter: 'cover letters',
  interviewPrep: 'interview preps',
  tracker: 'tracked applications',
};

// Small pill showing e.g. "2 / 3 cover letters used · Free plan".
export function UsagePill({ usage, feature }: { usage: UsageData | null; feature: UsageFeature }) {
  const label = usageLabel(usage, feature);
  if (!label) return null;
  const atLimit = isAtLimit(usage, feature);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        atLimit
          ? 'border-amber-300 bg-amber-50 text-amber-700'
          : 'border-blue-200 bg-blue-50 text-blue-700'
      }`}
    >
      <Sparkles className="h-3 w-3" />
      {label} {FEATURE_NOUNS[feature]} used · {usage?.planLabel} plan
    </span>
  );
}

// Friendly notice shown when the user has hit the limit for a feature.
export function LimitNotice({ usage, feature }: { usage: UsageData | null; feature: UsageFeature }) {
  if (!isAtLimit(usage, feature)) return null;
  const limit = usage!.limits[feature];
  const isTracker = feature === 'tracker';
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {isTracker ? (
        <>
          Your <span className="font-semibold">{usage!.planLabel}</span> plan can track up to{' '}
          <span className="font-semibold">{limit}</span> applications at once. Delete one to add
          another — higher tiers are coming soon.
        </>
      ) : (
        <>
          You&apos;ve used all <span className="font-semibold">{limit}</span>{' '}
          {FEATURE_NOUNS[feature]} included in your{' '}
          <span className="font-semibold">{usage!.planLabel}</span> plan. Higher tiers are coming
          soon!
        </>
      )}
    </div>
  );
}
