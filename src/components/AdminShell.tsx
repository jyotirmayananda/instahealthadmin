'use client';

import React, { useState } from 'react';
import { AdminProvider } from '@/lib/admin-context';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AdminProvider>
      <div className="min-h-screen bg-[#e8f3fb] text-slate-900 flex antialiased selection:bg-[#184575] selection:text-white relative">
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#184575]/15" />
          <div className="absolute top-32 -left-16 h-44 w-44 rounded-full bg-[#235e9e]/10" />
          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#16a34a]/10" />
          <div className="absolute top-0 left-0 right-0 h-72 rounded-b-[56px] bg-[#d5e8f7] lg:left-64" />
        </div>
        <div className="relative z-10 flex flex-1 min-w-0">
        <AdminSidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader onMenu={() => setOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">{children}</main>
        </div>
        </div>
      </div>
    </AdminProvider>
  );
}
