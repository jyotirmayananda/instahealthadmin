'use client';

import React from 'react';
import { CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import { ActionButton, PageHeader, StatusBadge } from '@/components/ui';

export default function FinancePage() {
  const { settlements, processPayout } = useAdmin();
  const totalGross = settlements.reduce((acc, s) => acc + s.grossAmount, 0);
  const totalCommission = settlements.reduce((acc, s) => acc + s.platformCommission, 0);
  const totalNet = settlements.reduce((acc, s) => acc + s.netPayout, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Ledger & Partner Disbursements"
        subtitle="Reconcile clinical fees, platform commission, and execute pending NEFT payouts."
        right={
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold font-mono shadow-xs">
            {settlements.filter((s) => s.status === 'pending').length} PENDING SETTLEMENTS
          </span>
        }
      />

      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-card grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Billed Volume</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            ₹{totalGross.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total across orders, visits &amp; consults</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Platform Commission</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1 tracking-tight">
            ₹{totalCommission.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Platform service margin</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Net Partner Disbursements</p>
          <p className="text-3xl font-extrabold text-teal-700 mt-1 tracking-tight">
            ₹{totalNet.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Payable to doctors &amp; fleet staff</p>
        </div>
      </div>

      <div className="space-y-4">
        {settlements.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-card hover:border-slate-300 hover:shadow-card-hover transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{item.providerName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.role} • Settlement Cycle: {item.period}
                </p>
              </div>
              <StatusBadge value={item.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Tasks Completed</span>
                <span className="font-bold text-slate-900 text-base">{item.totalVisits}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Gross Billed</span>
                <span className="font-bold text-slate-900 text-base font-mono">
                  ₹{item.grossAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Platform Share</span>
                <span className="font-bold text-emerald-600 text-base font-mono">
                  -₹{item.platformCommission.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Net Bank Transfer</span>
                <span className="font-extrabold text-teal-700 text-base font-mono">
                  ₹{item.netPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {item.status === 'pending' ? (
              <div className="flex justify-end pt-1">
                <ActionButton tone="primary" onClick={() => processPayout(item.id)}>
                  Initiate Instant NEFT Transfer (₹{item.netPayout.toLocaleString('en-IN')})
                </ActionButton>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <CheckCircle2 size={14} />
                  Transferred on {item.payoutDate}
                </span>
                <span className="font-mono text-[11px] text-slate-400">Transaction Ref: NEFT-{item.id}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
