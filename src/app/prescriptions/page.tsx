'use client';

import React, { useMemo, useState } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import { FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function PrescriptionsPage() {
  const { prescriptions, setPrescriptionStatus, setOrderStatus } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('pending');

  const pendingCount = prescriptions.filter((p) => p.status === 'pending').length;

  const rows = useMemo(() => {
    return prescriptions.filter((p) => {
      const q = query.toLowerCase();
      const match =
        p.id.toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        p.fileName.toLowerCase().includes(q);
      if (!match) return false;
      if (filter === 'all') return true;
      return p.status === filter;
    });
  }, [prescriptions, query, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescription Clinical Audit Queue"
        subtitle="Approve legible physician prescriptions so pharmacy dispatch can pack. Reject unreadable or invalid uploads."
        right={
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono shadow-xs">
            {pendingCount} AWAITING AUDIT
          </span>
        }
      />
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search patient, file, or Rx id…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'pending', label: 'Pending Audit', count: pendingCount },
          { id: 'verified', label: 'Verified' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'all', label: 'All' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No prescriptions in this queue." />
      ) : (
        <div className="space-y-3.5">
          {rows.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3 shadow-card hover:border-slate-300 hover:shadow-card-hover transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{p.id}</h3>
                      <StatusBadge value={p.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient: <strong className="text-slate-800">{p.patientName}</strong> • {p.phone} • Uploaded: {p.uploadedAt}
                    </p>
                  </div>
                </div>

                {p.linkedOrderId && (
                  <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Order: {p.linkedOrderId}
                  </span>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-3 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  Attachment:{' '}
                  <span className="font-semibold text-slate-900 font-mono">{p.fileName}</span>
                </div>
                <span className="text-[11px] text-teal-700 font-medium">Digital Scan • 300 DPI</span>
              </div>

              {p.status === 'pending' && (
                <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-slate-100">
                  <ActionButton
                    tone="danger"
                    onClick={() => setPrescriptionStatus(p.id, 'rejected')}
                  >
                    Reject Prescription
                  </ActionButton>
                  <ActionButton
                    tone="primary"
                    onClick={() => {
                      setPrescriptionStatus(p.id, 'verified');
                      if (p.linkedOrderId) setOrderStatus(p.linkedOrderId, 'verified');
                    }}
                  >
                    Verify & Unlock Order
                  </ActionButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
