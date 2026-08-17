'use client';

import { useEffect, useRef, useState } from 'react';
import type { ResumeData, ResumeTemplate } from '@/lib/resume-types';
import { renderResumeBody, RESUME_CSS, PAGE_WIDTH_PX, PAGE_HEIGHT_PX } from '@/lib/resume-render';

interface ResumePreviewProps {
  data: ResumeData;
  template?: ResumeTemplate;
  onOverflowChange?: (overflow: boolean, contentHeight: number) => void;
}

export default function ResumePreview({ data, template = 'title-first', onOverflowChange }: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const bodyHtml = renderResumeBody(data, template);

  // Fit scale to container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / PAGE_WIDTH_PX));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure content height vs one page (after fonts/layout settle)
  useEffect(() => {
    const measure = () => {
      const page = pageWrapRef.current?.querySelector('.resume-page') as HTMLElement | null;
      if (!page) return;
      const h = page.scrollHeight;
      onOverflowChange?.(h > PAGE_HEIGHT_PX + 2, h);
    };
    const t = setTimeout(measure, 150);
    let t2: ReturnType<typeof setTimeout> | null = null;
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => {
        t2 = setTimeout(measure, 50);
      });
    }
    return () => {
      clearTimeout(t);
      if (t2) clearTimeout(t2);
    };
  }, [bodyHtml, onOverflowChange]);

  return (
    <div ref={containerRef} className="w-full">
      <style dangerouslySetInnerHTML={{ __html: RESUME_CSS }} />
      <div
        style={{
          width: PAGE_WIDTH_PX * scale,
          height: PAGE_HEIGHT_PX * scale,
          overflow: 'hidden',
          margin: '0 auto',
          position: 'relative',
        }}
        className="rounded-md border border-border shadow-lg bg-white"
      >
        <div
          ref={pageWrapRef}
          style={{
            width: PAGE_WIDTH_PX,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
        {/* one-page boundary indicator */}
      </div>
    </div>
  );
}
