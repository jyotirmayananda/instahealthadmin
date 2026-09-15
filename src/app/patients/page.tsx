'use client';

import React, { useMemo, useState } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import { UserRound, Phone, Mail, MapPin } from 'lucide-react';

export default function PatientsPage() {
  const { patients, setPatientStatus } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    return patients.filter((p) => {
      const q = query.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q);
      if (!match) return false;
      if (filter === 'all') return true;
      return p.status === filter;
    });
  }, [patients, query, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Healthcare Directory"
        subtitle="Complete EHR patient directory. Review patient activity, spend history, and govern account security."
        right={
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono shadow-xs">
            {patients.filter((p) => p.status === 'active').length} ACTIVE ACCOUNTS
          </span>
        }
      />
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search name, phone, or email…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active', count: patients.filter((p) => p.status === 'active').length },
          { id: 'suspended', label: 'Suspended' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No patients match this search." />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
              <tr>
                <th className="px-5 py-3.5 font-bold">Patient Details</th>
                <th className="px-5 py-3.5 font-bold">City / Cluster</th>
                <th className="px-5 py-3.5 font-bold">Orders</th>
                <th className="px-5 py-3.5 font-bold">Total Spent</th>
                <th className="px-5 py-3.5 font-bold">Last Activity</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{p.phone}</p>
                        <p className="text-slate-400 text-[11px]">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-medium">{p.city}</td>
                  <td className="px-5 py-4 text-slate-900 font-bold">{p.orders}</td>
                  <td className="px-5 py-4 text-slate-900 font-bold font-mono">
                    ₹{p.spent.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{p.lastActive}</td>
                  <td className="px-5 py-4">
                    <StatusBadge value={p.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {p.status === 'active' ? (
                      <ActionButton tone="danger" onClick={() => setPatientStatus(p.id, 'suspended')}>
                        Suspend
                      </ActionButton>
                    ) : (
                      <ActionButton tone="good" onClick={() => setPatientStatus(p.id, 'active')}>
                        Reactivate
                      </ActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
