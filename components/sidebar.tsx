'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Mail,
  ClipboardList,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUsage } from '@/hooks/use-usage';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resume-tailor', label: 'Resume Tailor', icon: FileText },
  { href: '/cover-letter', label: 'Cover Letter', icon: Mail },
  { href: '/tracker', label: 'Application Tracker', icon: ClipboardList },
  { href: '/interview-prep', label: 'Interview Prep', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { usage } = useUsage();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border border-border"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-card border-r border-border flex flex-col transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center gap-2 p-4 border-b border-border', collapsed && 'justify-center')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && <span className="font-display font-bold text-lg tracking-tight">NextSteps</span>}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto md:hidden p-1 rounded hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-2">
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between px-2')}>
            <ThemeToggle />
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded hover:bg-accent text-muted-foreground"
              aria-label="Toggle sidebar"
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </button>
          </div>
          {!collapsed && session?.user && (
            <div className="px-2 py-1 space-y-1">
              <p className="text-xs text-muted-foreground truncate">{session.user?.email ?? ''}</p>
              {usage?.planLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                  <Sparkles className="h-3 w-3" />
                  {usage.planLabel} plan
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
