// Server-side helpers for reading and enforcing per-user usage limits.
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Feature,
  Plan,
  PlanLimits,
  effectivePlan,
  getLimits,
  isUnlimited,
} from '@/lib/plans';

// Which User column stores the cumulative count for each AI feature.
// (tracker is not counted cumulatively — it is limited by the current number
//  of JobApplication rows the user has.)
const COUNT_FIELD: Record<Exclude<Feature, 'tracker'>, 'resumeTailorCount' | 'coverLetterCount' | 'interviewPrepCount'> = {
  resumeTailor: 'resumeTailorCount',
  coverLetter: 'coverLetterCount',
  interviewPrep: 'interviewPrepCount',
};

export interface UsageSnapshot {
  plan: Plan;
  limits: PlanLimits;
  used: Record<Feature, number>;
}

type SessionUser = { id: string; email?: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  if (!id) return null;
  return { id, email: session?.user?.email };
}

export async function getUsageSnapshotForUser(userId: string): Promise<UsageSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      plan: true,
      resumeTailorCount: true,
      coverLetterCount: true,
      interviewPrepCount: true,
    },
  });
  if (!user) return null;

  const trackerCount = await prisma.jobApplication.count({ where: { userId } });
  const plan = effectivePlan(user.email, user.plan);

  return {
    plan,
    limits: getLimits(plan),
    used: {
      resumeTailor: user.resumeTailorCount,
      coverLetter: user.coverLetterCount,
      interviewPrep: user.interviewPrepCount,
      tracker: trackerCount,
    },
  };
}

export interface LimitCheck {
  ok: boolean;
  plan: Plan;
  limit: number;
  used: number;
}

// Checks whether the user can perform one more of `feature` WITHOUT consuming it.
export async function checkLimit(userId: string, feature: Feature): Promise<LimitCheck> {
  const snapshot = await getUsageSnapshotForUser(userId);
  if (!snapshot) return { ok: false, plan: 'FREE', limit: 0, used: 0 };
  const limit = snapshot.limits[feature];
  const used = snapshot.used[feature];
  return { ok: isUnlimited(limit) || used < limit, plan: snapshot.plan, limit, used };
}

// Atomically increments the cumulative counter for an AI feature after a
// successful generation. Not used for the tracker.
export async function incrementUsage(userId: string, feature: Exclude<Feature, 'tracker'>): Promise<void> {
  const field = COUNT_FIELD[feature];
  await prisma.user.update({
    where: { id: userId },
    data: { [field]: { increment: 1 } },
  });
}
