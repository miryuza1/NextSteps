'use client';

import Sidebar from '@/components/sidebar';
import { useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
