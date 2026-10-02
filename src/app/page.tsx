'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  FileText,
  TestTube,
  Video,
  HeartPulse,
  Users,
  UserRound,
  Layers,
  Ticket,
  MapPin,
  DollarSign,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Bike,
  Navigation,
  AlertTriangle,
  Pill,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import { StatusBadge, KpiCard } from '@/components/ui';

const MODULES = [
  { href: '/doctors', label: 'Doctor Access & KYC', icon: UserCheck, key: 'pendingDoctors' as const, color: 'text-teal-600' },
  { href: '/orders', label: 'Medicine Orders & GPS', icon: ShoppingBag, key: 'pendingOrders' as const, color: 'text-sky-600' },
  { href: '/dispatch', label: 'Fleet & Dispatch Desk', icon: MapPin, key: 'availableRiders' as const, color: 'text-indigo-600' },
  { href: '/prescriptions', label: 'Prescriptions Audit', icon: FileText, key: 'pendingRx' as const, color: 'text-amber-600' },
  { href: '/labs', label: 'Lab Test Bookings', icon: TestTube, key: 'openLabs' as const, color: 'text-emerald-600' },
  { href: '/nursing', label: 'Home Nursing Care', icon: HeartPulse, key: 'openNursing' as const, color: 'text-rose-600' },
  { href: '/patients', label: 'Patient Directory', icon: UserRound, key: 'activePatients' as const, color: 'text-teal-600' },
  { href: '/providers', label: 'Staff Registration', icon: Users, key: 'pendingKyc' as const, color: 'text-purple-600' },
  { href: '/medicines', label: 'Medicine Inventory', icon: Pill, key: 'totalMedicines' as const, color: 'text-cyan-600' },
  { href: '/catalog', label: 'Catalog & Tariffs', icon: Layers, color: 'text-blue-600' },
  { href: '/coupons', label: 'Promotions & Codes', icon: Ticket, color: 'text-amber-600' },
  { href: '/finance', label: 'Payout Settlements', icon: DollarSign, key: 'pendingPayouts' as const, color: 'text-emerald-600' },
];

interface InboxItem {
  id: string;
  href: string;
  title: string;
  detail: string;
  status: any;
  tag: string;
}

export default function AdminOverviewPage() {
  const { counts, orders, labs, nursing, consults, doctors, providers, riders } = useAdmin();

  const inbox: InboxItem[] = useMemo(() => {
    const raw: InboxItem[] = [
      ...doctors.filter((d) => d.status === 'pending_approval').map((d) => ({
        id: `doc-${d.id}`,
        href: '/doctors',
        title: `Doctor Access Credential Audit: ${d.name}`,
        detail: `${d.specialty} • Council Reg: ${d.councilRegNo}`,
        status: 'pending_approval' as const,
        tag: 'Doctor Onboarding',
      })),
      ...providers.filter((p) => p.status === 'pending').map((p) => ({
        id: `prov-${p.id}`,
        href: '/providers',
        title: `Nurse & Staff KYC Verification: ${p.name}`,
        detail: `${p.role} • Reg: ${p.councilRegNo}`,
        status: 'pending' as const,
        tag: 'Nursing Staff KYC',
      })),
      ...riders.filter((r) => r.status === 'pending_approval').map((r) => ({
        id: `rider-${r.id}`,
        href: '/dispatch',
        title: `Delivery Partner Sign-Up: ${r.name}`,
        detail: `${r.vehicleType} (${r.vehicleNumber}) • Zone: ${r.currentZone}`,
        status: 'pending_approval' as const,
        tag: 'Rider Onboarding',
      })),
      ...orders.filter((o) => !['delivered', 'cancelled'].includes(o.status) && !o.deliveryBoyId).map((o) => ({
        id: `assign-order-${o.id}`,
        href: '/orders',
        title: `Assign Delivery Rider: ${o.id}`,
        detail: `${o.patientName} • ${o.address}`,
        status: o.status,
        tag: 'Order Dispatch',
      })),
      ...orders.filter((o) => o.status === 'out_for_delivery' && Boolean(o.deliveryBoyId)).map((o) => ({
        id: `transit-order-${o.id}`,
        href: '/orders',
        title: `Live Delivery In-Transit: ${o.id}`,
        detail: `Partner: ${o.deliveryBoyName} • ETA: ${o.etaMinutes || 6}m`,
        status: o.status,
        tag: 'Live GPS Active',
      })),
      ...labs.filter((l) => l.status === 'confirmed').map((l) => ({
        id: `lab-${l.id}`,
        href: '/labs',
        title: `Unassigned Lab Sample: ${l.id}`,
        detail: `${l.patientName} • ${l.tests}`,
        status: l.status,
        tag: 'Diagnostics',
      })),
      ...nursing.filter((n) => n.status === 'confirmed').map((n) => ({
        id: `nursing-${n.id}`,
        href: '/nursing',
        title: `Home Nursing Visit Wait: ${n.id}`,
        detail: `${n.patientName} • ${n.procedures}`,
        status: n.status,
        tag: 'Home Care',
      })),
    ];

    const seen = new Set<string>();
    return raw.filter((item) => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        return true;
      }
      return false;
    });
  }, [doctors, providers, riders, orders, labs, nursing, consults]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          InstaHealth Central Command
        </h1>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Doctors Authorized"
          value={counts.activeDoctors}
          hint={`${counts.pendingDoctors} pending credential review`}
          icon={UserCheck}
          accent="teal"
          trend="+12% MoM"
        />
        <KpiCard
          label="Open Medicine Orders"
          value={counts.pendingOrders}
          hint={`${counts.unassignedOrders} awaiting courier dispatch`}
          icon={ShoppingBag}
          accent="sky"
          trend="+18% today"
        />
        <KpiCard
          label="Live In-Transit Deliveries"
          value={counts.deliveringOrders}
          hint="Active GPS tracking & telemetry"
          icon={Bike}
          accent="emerald"
        />
        <KpiCard
          label="Available Fleet"
          value={counts.availableRiders}
          hint="Ready for instant 15-min dispatch"
          icon={MapPin}
          accent="indigo"
        />
      </div>

      {/* Modules Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Operational Control Modules
          </h2>
          <span className="text-xs text-slate-400 font-medium">13 Active Desks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const count = m.key ? counts[m.key] : undefined;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-teal-500/50 hover:shadow-card-hover transition-all flex items-center justify-between gap-3 shadow-card"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${m.color}`}>
                    <Icon size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition truncate">
                    {m.label}
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2.5">
                  {count !== undefined && (
                    <span className="text-base font-extrabold text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60 font-mono">
                      {count}
                    </span>
                  )}
                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Real-Time Action Inbox */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Real-Time Clinical Action Inbox
              </h3>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              High-priority clinical approvals, rider assignments, and delivery tracking.
            </p>
          </div>

          <span className="self-start sm:self-auto text-xs text-teal-800 font-mono font-bold bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80 shadow-xs">
            {inbox.length} TASKS NEED ATTENTION
          </span>
        </div>

        {inbox.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Inbox is completely clear. All live operational queues are assigned.
          </div>
        ) : (
          <div className="space-y-2">
            {inbox.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group block bg-slate-50/60 hover:bg-teal-50/30 p-3.5 rounded-2xl border border-slate-200/70 hover:border-teal-300 transition shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                    <StatusBadge value={item.status} />
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-600 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
