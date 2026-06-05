import React from 'react';
import { Sidebar } from './sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0A0A0F] text-[#D1D5DB] overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 bg-purple-900/5 pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
