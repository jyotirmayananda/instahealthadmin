'use client';

import React from 'react';
import { Search, Inbox, TrendingUp } from 'lucide-react';

const TONE: Record<string, { bg: string; dot: string }> = {
  pending: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  placed: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  confirmed: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  verified: { bg: 'bg-white text-emerald-700 border-slate-200', dot: 'bg-emerald-600' },
  packed: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  shipped: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  out_for_delivery: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  delivered: { bg: 'bg-white text-emerald-700 border-slate-200', dot: 'bg-emerald-600' },
  cancelled: { bg: 'bg-white text-rose-700 border-slate-200', dot: 'bg-rose-500' },
  rejected: { bg: 'bg-white text-rose-700 border-slate-200', dot: 'bg-rose-500' },
  live: { bg: 'bg-white text-rose-700 border-slate-200', dot: 'bg-rose-500' },
  scheduled: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  completed: { bg: 'bg-white text-emerald-700 border-slate-200', dot: 'bg-emerald-600' },
  phlebotomist_assigned: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  on_the_way: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  sample_collected: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  processing_in_lab: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  report_ready: { bg: 'bg-white text-emerald-700 border-slate-200', dot: 'bg-emerald-600' },
  nurse_assigned: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  in_progress: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  in_visit: { bg: 'bg-white text-[#184575] border-slate-200', dot: 'bg-[#184575]' },
  available: { bg: 'bg-white text-emerald-700 border-slate-200', dot: 'bg-emerald-600' },
  offline: { bg: 'bg-white text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  processed: { bg: 'bg-white text-emerald-700 border-slate-200', dot: 'bg-emerald-600' },
  active: { bg: 'bg-white text-emerald-700 border-slate-200', dot: 'bg-emerald-600' },
  suspended: { bg: 'bg-white text-rose-700 border-slate-200', dot: 'bg-rose-500' },
  pending_approval: { bg: 'bg-white text-[#184575] border-[#184575]', dot: 'bg-[#184575]' },
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
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#184575]/15 focus:border-[#184575] transition"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              active === f.id
                ? 'bg-[#184575] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  active === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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
      ? 'bg-[#184575] hover:bg-[#123357] text-white shadow-xs focus:ring-2 focus:ring-[#184575]/20'
      : tone === 'good'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
      : tone === 'warn'
      ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
      : tone === 'danger'
      ? 'bg-white hover:bg-slate-50 text-rose-700 border border-rose-200'
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
    accent === 'emerald'
      ? 'text-emerald-700'
      : accent === 'sky'
      ? 'text-sky-700'
      : accent === 'amber'
      ? 'text-amber-700'
      : 'text-[#184575]';

  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center ${accentCls}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="my-2.5 flex items-center gap-2.5">
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {trend && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold whitespace-nowrap shadow-xs">
            <TrendingUp size={12} className="text-emerald-600 shrink-0" />
            <span>{trend}</span>
          </span>
        )}
      </div>
      {hint && (
        <p className="text-xs text-slate-500 font-medium">{hint}</p>
      )}
    </div>
  );
}
