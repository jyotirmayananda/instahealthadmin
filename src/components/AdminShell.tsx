'use client';

import React, { useState } from 'react';
import { AdminProvider } from '@/lib/admin-context';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AdminProvider>
      <div className="min-h-screen bg-slate-50/70 text-slate-900 flex antialiased selection:bg-teal-100 selection:text-teal-900">
        <AdminSidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader onMenu={() => setOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </AdminProvider>
  );
}
