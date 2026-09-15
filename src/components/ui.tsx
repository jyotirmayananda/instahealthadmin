'use client';

import React from 'react';
import { Search, Inbox, TrendingUp } from 'lucide-react';

const TONE: Record<string, { bg: string; dot: string }> = {
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  placed: { bg: 'bg-sky-50 text-sky-700 border-sky-200/80', dot: 'bg-sky-500' },
  confirmed: { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
  verified: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  packed: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', dot: 'bg-indigo-500' },
  shipped: { bg: 'bg-violet-50 text-violet-700 border-violet-200/80', dot: 'bg-violet-500' },
  out_for_delivery: { bg: 'bg-orange-50 text-orange-700 border-orange-200/80', dot: 'bg-orange-500' },
  delivered: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
  rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
  live: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
  scheduled: { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
  completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  phlebotomist_assigned: { bg: 'bg-teal-50 text-teal-700 border-teal-200/80', dot: 'bg-teal-500' },
  on_the_way: { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  sample_collected: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', dot: 'bg-indigo-500' },
  processing_in_lab: { bg: 'bg-purple-50 text-purple-700 border-purple-200/80', dot: 'bg-purple-500' },
  report_ready: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  nurse_assigned: { bg: 'bg-teal-50 text-teal-700 border-teal-200/80', dot: 'bg-teal-500' },
  in_progress: { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
  in_visit: { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
  available: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  offline: { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  processed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  active: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  suspended: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
  pending_approval: { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
};

export function StatusBadge({ value }: { value: string }) {
  const tone = TONE[value] ?? { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shadow-xs ${tone.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`} />
      <span>{value.replaceAll('_', ' ')}</span>
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">{subtitle}</p>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function FilterBar({
  query,
  onQuery,
  filters,
  active,
  onFilter,
  placeholder,
}: {
  query: string;
  onQuery: (v: string) => void;
  filters: { id: string; label: string; count?: number }[];
  active: string;
  onFilter: (id: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              active === f.id
                ? 'bg-white text-teal-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  active === f.id ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  tone = 'neutral',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'primary';
  disabled?: boolean;
}) {
  const cls =
    tone === 'primary'
      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs focus:ring-2 focus:ring-teal-500/20'
      : tone === 'good'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
      : tone === 'warn'
      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
      : tone === 'danger'
      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${cls}`}
    >
      {children}
    </button>
  );
}

export function EmptyNote({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-card flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Inbox size={24} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{text}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        No active items matching your current criteria or operational filter.
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  accent?: 'teal' | 'emerald' | 'sky' | 'amber' | 'indigo';
  trend?: string;
}) {
  const accentCls =
    accent === 'teal'
      ? 'bg-teal-50 text-teal-600'
      : accent === 'emerald'
      ? 'bg-emerald-50 text-emerald-600'
      : accent === 'sky'
      ? 'bg-sky-50 text-sky-600'
      : accent === 'amber'
      ? 'bg-amber-50 text-amber-600'
      : 'bg-indigo-50 text-indigo-600';

  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accentCls}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {trend && (
            <span className="inline-flex items-center text-emerald-600 font-semibold gap-0.5">
              <TrendingUp size={12} />
              {trend}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </div>
    </div>
  );
}
