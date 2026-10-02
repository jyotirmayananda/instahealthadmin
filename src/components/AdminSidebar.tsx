'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Layers,
  DollarSign,
  ShoppingBag,
  FileText,
  TestTube,
  Video,
  HeartPulse,
  UserRound,
  Ticket,
  X,
  UserCheck,
  Pill,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

const GROUPS = [
  {
    label: 'Command',
    items: [{ href: '/', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    label: 'Bookings & Orders',
    items: [
      { href: '/orders', label: 'Medicine Orders', icon: ShoppingBag, countKey: 'pendingOrders' as const },
      { href: '/prescriptions', label: 'Prescriptions', icon: FileText, countKey: 'pendingRx' as const },
      { href: '/labs', label: 'Lab Bookings', icon: TestTube, countKey: 'openLabs' as const },
      { href: '/nursing', label: 'Home Nursing', icon: HeartPulse, countKey: 'openNursing' as const },
    ],
  },
  {
    label: 'People & Access',
    items: [
      { href: '/doctors', label: 'Doctor Access', icon: UserCheck, countKey: 'pendingDoctors' as const },
      { href: '/patients', label: 'Patients', icon: UserRound },
      { href: '/providers', label: 'Staff KYC', icon: Users, countKey: 'pendingKyc' as const },
    ],
  },
  {
    label: 'Catalog & Ops',
    items: [
      { href: '/medicines', label: 'Medicines Inventory', icon: Pill, countKey: 'totalMedicines' as const },
      { href: '/catalog', label: 'Catalog & Rates', icon: Layers },
      { href: '/coupons', label: 'Coupons', icon: Ticket },
      { href: '/dispatch', label: 'Fleet & Dispatch', icon: MapPin, countKey: 'availableRiders' as const },
    ],
  },
  {
    label: 'Finance & Compliance',
    items: [{ href: '/finance', label: 'Payouts', icon: DollarSign, countKey: 'pendingPayouts' as const }],
  },
];

export default function AdminSidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { counts } = useAdmin();

  const nav = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center font-black text-base shadow-sm shadow-teal-500/20">
            <Activity size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900 tracking-tight">INSTAHEALTH</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 tracking-tight">
              Clinical Operations ERP
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="p-3.5 space-y-5 overflow-y-auto flex-1">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                const Icon = item.icon;
                const count = item.countKey ? counts[item.countKey] : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/70 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={isActive ? 'text-teal-600 stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'}
                      />
                      <span>{item.label}</span>
                    </span>
                    {count > 0 && (
                      <span
                        className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          isActive
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile / Operational Hub Info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center font-bold text-xs shrink-0">
            <ShieldCheck size={18} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">Central Admin</p>
            <p className="text-[10px] text-slate-400 truncate">Live Operations • Online</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {nav}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
          <div className="relative w-72 max-w-full h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
