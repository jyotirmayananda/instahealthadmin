'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ConsultationsPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/doctors');
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
        <UserCheck size={32} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900">Redirecting to Doctor Onboarding...</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Patient consultations are conducted directly by doctors in the Provider App. Admin oversees doctor credentials, verification, and onboarding.
        </p>
      </div>
      <Link
        href="/doctors"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-sm"
      >
        <span>Go to Doctor Onboarding &amp; Access</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
