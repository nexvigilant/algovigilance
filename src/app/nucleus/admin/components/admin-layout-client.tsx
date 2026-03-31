'use client';

import { AdminNav } from './admin-nav';

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Gold top border — admin identity */}
      <div className="h-1 bg-gradient-to-r from-amber-500/60 via-amber-500 to-amber-500/60" />

      {/* Admin badge bar */}
      <div className="flex items-center px-4 py-1 bg-nex-dark/80 border-b border-amber-500/20">
        <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-500 uppercase">
          Admin
        </span>
      </div>

      {/* Horizontal Navigation Bar */}
      <AdminNav />

      {/* Main Content Area */}
      <main className="min-w-0">
        <div className="container mx-auto px-4 py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
