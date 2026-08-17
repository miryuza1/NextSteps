'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Mail,
  ClipboardList,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Award,
  XCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  recentApps: any[];
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(value / (duration / 16)));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);

  return <span className="font-mono">{display}</span>;
}

const statCards = [
  { key: 'total', label: 'Total Applications', icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'interview', label: 'Interviews', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'offer', label: 'Offers', icon: Award, color: 'text-green-500', bg: 'bg-green-500/10' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
];

const quickActions = [
  { href: '/resume-tailor', label: 'Tailor Resume', icon: FileText, desc: 'Optimize your resume for a specific job' },
  { href: '/cover-letter', label: 'Write Cover Letter', icon: Mail, desc: 'Generate a personalized cover letter' },
  { href: '/tracker', label: 'Track Applications', icon: ClipboardList, desc: 'Manage all your job applications' },
  { href: '/interview-prep', label: 'Prep for Interview', icon: MessageSquare, desc: 'Get AI-generated interview questions' },
];

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Interview: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Offer: 'bg-green-500/10 text-green-600 dark:text-green-400',
  Rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Your job search at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', s.bg)}>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={(stats as any)?.[s.key] ?? 0} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Link
                href={action.href}
                className="group block bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all hover:translate-y-[-2px]"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <action.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{action.label}</h3>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
                <ArrowRight className="h-4 w-4 mt-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Recent Applications</h2>
          <Link href="/tracker" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {(stats?.recentApps?.length ?? 0) === 0 ? (
          <div className="bg-card rounded-xl p-8 border border-border text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No applications yet. Start tracking your job search!</p>
            <Link href="/tracker">
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Add Application</button>
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Position</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentApps ?? []).map((app: any) => (
                    <tr key={app?.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{app?.company ?? ''}</td>
                      <td className="p-4 text-muted-foreground">{app?.jobTitle ?? ''}</td>
                      <td className="p-4">
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColors[app?.status] || 'bg-muted text-muted-foreground')}>
                          {app?.status ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">
                        {app?.dateApplied ? new Date(app.dateApplied).toLocaleDateString('en-US', { timeZone: 'UTC' }) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
