'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { ResumeData, ExperienceEntry, EducationEntry, FlexEntry } from '@/lib/resume-types';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export default function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  const set = (patch: Partial<ResumeData>) => onChange({ ...data, ...patch });

  const updateArr = <T,>(arr: T[], i: number, patch: Partial<T>): T[] =>
    arr.map((item, idx) => (idx === i ? { ...item, ...patch } : item));

  return (
    <div className="space-y-4">
      <SectionCard title="Header">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name</Label>
            <Input value={data.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input value={data.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input value={data.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@email.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">LinkedIn</Label>
            <Input value={data.linkedin || ''} onChange={(e) => set({ linkedin: e.target.value })} placeholder="linkedin.com/in/yourname" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">GitHub</Label>
            <Input value={data.github || ''} onChange={(e) => set({ github: e.target.value })} placeholder="github.com/yourname" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Any contact field you fill in appears in the line under your name. Leave a field blank to omit it.</p>
        <div className="space-y-2">
          <Label className="text-xs">Other links (portfolio, personal website, etc.)</Label>
          {(data.links || []).map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Display text" value={link.label} onChange={(e) => set({ links: updateArr(data.links, i, { label: e.target.value }) })} />
              <Input placeholder="https://..." value={link.url} onChange={(e) => set({ links: updateArr(data.links, i, { url: e.target.value }) })} />
              <Button variant="ghost" size="icon" onClick={() => set({ links: data.links.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ links: [...(data.links || []), { label: '', url: '' }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Objective">
        <Textarea rows={2} value={data.objective} onChange={(e) => set({ objective: e.target.value })} />
        <p className="text-xs text-muted-foreground">Optional — clear this field to remove the Objective section from your resume entirely.</p>
      </SectionCard>

      <SectionCard title="Education">
        {(data.education || []).map((ed, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="flex gap-2">
              <Input placeholder="Institution" value={ed.institution} onChange={(e) => set({ education: updateArr(data.education, i, { institution: e.target.value }) })} />
              <Input placeholder="City, State" className="max-w-[180px]" value={ed.location || ''} onChange={(e) => set({ education: updateArr(data.education, i, { location: e.target.value }) })} />
              <Input placeholder="Exp: Dec 2026" className="max-w-[160px]" value={ed.dateRange} onChange={(e) => set({ education: updateArr(data.education, i, { dateRange: e.target.value }) })} />
              <Button variant="ghost" size="icon" onClick={() => set({ education: data.education.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Input placeholder="Degree, GPA, distinctions (e.g. Bachelor of Science in Economics, GPA: 3.8/4.0)" value={ed.degree} onChange={(e) => set({ education: updateArr(data.education, i, { degree: e.target.value }) })} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => set({ education: [...(data.education || []), { institution: '', dateRange: '', degree: '' } as EducationEntry] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Education
        </Button>
      </SectionCard>

      <SectionCard title="Work Experience">
        {(data.experience || []).map((ex, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="flex gap-2">
              <Input placeholder="Company" value={ex.organization} onChange={(e) => set({ experience: updateArr(data.experience, i, { organization: e.target.value }) })} />
              <Input placeholder="City, Country" className="max-w-[180px]" value={ex.location || ''} onChange={(e) => set({ experience: updateArr(data.experience, i, { location: e.target.value }) })} />
              <Input placeholder="Aug 2025 -- Sep 2025" className="max-w-[180px]" value={ex.dateRange} onChange={(e) => set({ experience: updateArr(data.experience, i, { dateRange: e.target.value }) })} />
              <Button variant="ghost" size="icon" onClick={() => set({ experience: data.experience.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Input placeholder="Role / Job Title" value={ex.role} onChange={(e) => set({ experience: updateArr(data.experience, i, { role: e.target.value }) })} />
            <BulletsEditor bullets={ex.bullets || []} onChange={(bullets) => set({ experience: updateArr(data.experience, i, { bullets }) })} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => set({ experience: [...(data.experience || []), { organization: '', dateRange: '', role: '', bullets: [''] } as ExperienceEntry] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Experience
        </Button>
      </SectionCard>

      {(data.flexSections || []).map((sec, si) => (
        <SectionCard key={si} title={sec.heading || 'Custom Section'}>
          <div className="space-y-1">
            <Label className="text-xs">Section Heading</Label>
            <Input value={sec.heading} onChange={(e) => set({ flexSections: updateArr(data.flexSections, si, { heading: e.target.value }) })} />
          </div>
          {(sec.entries || []).map((en, i) => (
            <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Organization / Project Name" value={en.title} onChange={(e) => set({ flexSections: updateArr(data.flexSections, si, { entries: updateArr(sec.entries, i, { title: e.target.value }) }) })} />
                <Input placeholder="Jan 2024 -- Present" className="max-w-[180px]" value={en.dateRange} onChange={(e) => set({ flexSections: updateArr(data.flexSections, si, { entries: updateArr(sec.entries, i, { dateRange: e.target.value }) }) })} />
                <Button variant="ghost" size="icon" onClick={() => set({ flexSections: updateArr(data.flexSections, si, { entries: sec.entries.filter((_, idx) => idx !== i) }) })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Role (leave empty for projects)" value={en.role} onChange={(e) => set({ flexSections: updateArr(data.flexSections, si, { entries: updateArr(sec.entries, i, { role: e.target.value }) }) })} />
                <Input placeholder="City, State" className="max-w-[180px]" value={en.location || ''} onChange={(e) => set({ flexSections: updateArr(data.flexSections, si, { entries: updateArr(sec.entries, i, { location: e.target.value }) }) })} />
              </div>
              <Input placeholder="Tech stack for projects (e.g. Python, Flask, React)" value={en.techStack || ''} onChange={(e) => set({ flexSections: updateArr(data.flexSections, si, { entries: updateArr(sec.entries, i, { techStack: e.target.value }) }) })} />
              <BulletsEditor bullets={en.bullets || []} onChange={(bullets) => set({ flexSections: updateArr(data.flexSections, si, { entries: updateArr(sec.entries, i, { bullets }) }) })} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ flexSections: updateArr(data.flexSections, si, { entries: [...(sec.entries || []), { title: '', dateRange: '', role: '', bullets: [''] } as FlexEntry] }) })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Entry
          </Button>
        </SectionCard>
      ))}

      <SectionCard title="Additional Information">
        {(data.additionalInfo || []).map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Input placeholder="Label (e.g. Technical Skills)" className="max-w-[200px]" value={item.label} onChange={(e) => set({ additionalInfo: updateArr(data.additionalInfo, i, { label: e.target.value }) })} />
            <Textarea rows={2} placeholder="Comma-separated items" value={item.content} onChange={(e) => set({ additionalInfo: updateArr(data.additionalInfo, i, { content: e.target.value }) })} />
            <Button variant="ghost" size="icon" onClick={() => set({ additionalInfo: data.additionalInfo.filter((_, idx) => idx !== i) })}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => set({ additionalInfo: [...(data.additionalInfo || []), { label: '', content: '' }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
        </Button>
      </SectionCard>
    </div>
  );
}

function BulletsEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Bullet Points</Label>
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Textarea
            rows={2}
            value={b}
            onChange={(e) => onChange(bullets.map((x, idx) => (idx === i ? e.target.value : x)))}
          />
          <Button variant="ghost" size="icon" onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...bullets, ''])}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Bullet
      </Button>
    </div>
  );
}
