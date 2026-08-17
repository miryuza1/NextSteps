'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUsage, isAtLimit } from '@/hooks/use-usage';
import { UsagePill, LimitNotice } from '@/components/usage-banner';

interface Application {
  id: string;
  company: string;
  jobTitle: string;
  status: string;
  dateApplied: string;
  jobUrl: string | null;
  notes: string | null;
}

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
const statusColors: Record<string, string> = {
  Applied: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Interview: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Offer: 'bg-green-500/10 text-green-600 dark:text-green-400',
  Rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const emptyForm = { company: '', jobTitle: '', status: 'Applied', dateApplied: '', jobUrl: '', notes: '' };

export default function TrackerPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [saveError, setSaveError] = useState('');
  const { usage, refresh } = useUsage();
  const atLimit = isAtLimit(usage, 'tracker');

  const fetchApps = () => {
    fetch('/api/applications')
      .then((r) => r.json())
      .then((d) => setApps(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, []);

  const openNew = () => {
    setSaveError('');
    setEditing(null);
    setForm({ ...emptyForm, dateApplied: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (app: Application) => {
    setSaveError('');
    setEditing(app);
    setForm({
      company: app.company,
      jobTitle: app.jobTitle,
      status: app.status,
      dateApplied: app.dateApplied ? new Date(app.dateApplied).toISOString().split('T')[0] : '',
      jobUrl: app.jobUrl || '',
      notes: app.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.company || !form.jobTitle) return;
    setSaving(true);
    setSaveError('');
    try {
      const url = editing ? `/api/applications/${editing.id}` : '/api/applications';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        fetchApps();
        refresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveError(errData?.error || 'Could not save the application. Please try again.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    fetchApps();
    refresh();
  };

  const filtered = (apps ?? []).filter((a: Application) => {
    const matchesSearch = (a?.company ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (a?.jobTitle ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || a?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Application Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Keep track of every job application in one place</p>
          <div className="mt-2">
            <UsagePill usage={usage} feature="tracker" />
          </div>
        </div>
        <Button onClick={openNew} disabled={atLimit} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Application
        </Button>
      </div>

      <LimitNotice usage={usage} feature="tracker" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company or title..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {['All', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{search || filterStatus !== 'All' ? 'No applications match your filters' : 'No applications yet. Add your first one!'}</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Position</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date Applied</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Notes</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app: Application, i: number) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        {app.company}
                        {app.jobUrl && (
                          <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{app.jobTitle}</td>
                    <td className="p-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColors[app.status] || 'bg-muted text-muted-foreground')}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-xs">
                      {app.dateApplied ? new Date(app.dateApplied).toLocaleDateString('en-US', { timeZone: 'UTC' }) : ''}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs max-w-[200px] truncate">{app.notes || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(app)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(app.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border w-full max-w-lg p-6 space-y-4"
              style={{ boxShadow: 'var(--shadow-lg)' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">{editing ? 'Edit Application' : 'New Application'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-accent"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>Company *</Label>
                  <Input value={form.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, company: e.target.value })} placeholder="Google" />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label>Job Title *</Label>
                  <Input value={form.jobTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Software Engineer" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date Applied</Label>
                  <Input type="date" value={form.dateApplied} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, dateApplied: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Job URL</Label>
                  <Input value={form.jobUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, jobUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this application..." rows={3} />
                </div>
              </div>
              {saveError && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{saveError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !form.company || !form.jobTitle}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
