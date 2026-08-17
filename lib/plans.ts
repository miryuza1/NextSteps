// Central definition of the app's subscription tiers and their limits.
// There is NO paywall yet — everyone is on FREE by default and all features
// are unlocked; FREE simply enforces the usage limits below. When we add
// paid tiers later, upgrading a user is just a matter of changing their
// `plan` field (or adding their email to UNLIMITED_EMAILS).

export type Plan = 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';

export type Feature = 'resumeTailor' | 'coverLetter' | 'interviewPrep' | 'tracker';

export interface PlanLimits {
  resumeTailor: number; // -1 means unlimited
  coverLetter: number;
  interviewPrep: number;
  tracker: number; // max number of applications kept in the tracker at once
}

// ---- The single source of truth for tier limits. Edit here to change them. ----
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { resumeTailor: 3, coverLetter: 3, interviewPrep: 2, tracker: 5 },
  PREMIUM: { resumeTailor: 25, coverLetter: 25, interviewPrep: 15, tracker: 100 },
  PREMIUM_PLUS: { resumeTailor: -1, coverLetter: -1, interviewPrep: -1, tracker: -1 },
};

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  PREMIUM_PLUS: 'Premium+',
};

// Accounts that should always be treated as unlimited (owner / admin / trusted
// testers), matched by email (case-insensitive). Add your own email here to give
// yourself unlimited access without touching the database.
export const UNLIMITED_EMAILS: string[] = [];

export const FEATURE_LABELS: Record<Feature, string> = {
  resumeTailor: 'resume tailors',
  coverLetter: 'cover letters',
  interviewPrep: 'interview preps',
  tracker: 'tracked applications',
};

export function normalizePlan(p?: string | null): Plan {
  const v = (p || '').toUpperCase();
  if (v === 'PREMIUM') return 'PREMIUM';
  if (v === 'PREMIUM_PLUS' || v === 'PREMIUM+') return 'PREMIUM_PLUS';
  return 'FREE';
}

export function isUnlimited(limit: number): boolean {
  return limit < 0;
}

// Resolve the effective plan for a user, honouring the unlimited-email allowlist.
export function effectivePlan(email?: string | null, plan?: string | null): Plan {
  if (email && UNLIMITED_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase())) {
    return 'PREMIUM_PLUS';
  }
  return normalizePlan(plan);
}

export function getLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}
