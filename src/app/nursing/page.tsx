'use client';

import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  AlertCircle,
  MapPin,
  Calendar,
  HeartPulse,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminNursing } from '@/lib/types';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import AssignStaffModal from '@/components/AssignStaffModal';

export default function NursingPage() {
  const { nursing, setNursingStatus } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('open');

  // Modal for assigning home nurse
  const [assigningNursing, setAssigningNursing] = useState<AdminNursing | null>(null);

  const rows = useMemo(() => {
    return nursing.filter((n) => {
      const q = query.toLowerCase();
      const match =
        n.id.toLowerCase().includes(q) ||
        n.patientName.toLowerCase().includes(q) ||
        n.procedures.toLowerCase().includes(q) ||
        (n.nurse && n.nurse.toLowerCase().includes(q));
      if (!match) return false;
      if (filter === 'open') return !['completed', 'cancelled'].includes(n.status);
      if (filter === 'all') return true;
      if (filter === 'confirmed') return n.status === 'confirmed';
      return n.status === filter;
    });
  }, [nursing, query, filter]);

  const unassignedCount = nursing.filter((n) => n.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home Nursing & Clinical Visits Desk"
        subtitle="Assign certified nurses to patient visits and manage cancellations. Clinical care, consumables tally, and final bill amount are generated at the doorstep by the nurse in the Medco Provider App."
        right={
          <div className="flex items-center gap-2">
            {unassignedCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs">
                <AlertCircle size={13} className="text-amber-600" />
                {unassignedCount} UNASSIGNED
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold font-mono shadow-xs">
              {nursing.filter((n) => !['completed', 'cancelled'].includes(n.status)).length} OPEN VISITS
            </span>
          </div>
        }
      />

      {/* Governance & Doorstep Billing Notice Banner */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <HeartPulse size={16} />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block sm:inline mr-2">
              Doorstep Billing &amp; Dispatch Governance:
            </span>
            <span className="text-slate-600">
              Admin is authorized to assign nurses and cancel visits only. Procedure execution, consumables tallying, final bill amount generation, and payment collection are conducted at the doorstep by the nurse in the Medco Provider App.
            </span>
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:inline-block">
          Doorstep Billed
        </span>
      </div>

      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search visit, patient, procedure, or nurse…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'open', label: 'Open' },
          { id: 'confirmed', label: 'Unassigned', count: unassignedCount },
          { id: 'nurse_assigned', label: 'Nurse Assigned' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No nursing visits match this filter." />
      ) : (
        <div className="space-y-4">
          {rows.map((n) => {
            const isUnassigned = n.status === 'confirmed';
            const isComplete = n.status === 'completed' || n.status === 'cancelled';

            return (
              <div
                key={n.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 hover:border-slate-300 hover:shadow-card-hover transition shadow-card"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">{n.id}</h3>
                      <StatusBadge value={n.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Patient: <strong className="text-slate-800">{n.patientName}</strong> • {n.phone}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    {n.status === 'completed' ? (
                      <>
                        <p className="text-lg font-extrabold text-slate-900">₹{n.billed}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 sm:justify-end">
                          <CheckCircle2 size={11} /> Generated &amp; Paid at Doorstep
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                          <span>Doorstep Billing</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Amount generated during visit by nurse
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Procedures & Slot */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-3.5 text-xs text-slate-700 space-y-2">
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <HeartPulse size={13} className="text-rose-600" />
                    <span>{n.procedures}</span>
                  </p>
                  <div className="flex items-center gap-4 text-slate-500 text-[11px] flex-wrap">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin size={12} className="text-rose-600" />
                      <span>{n.zone}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Calendar size={12} className="text-sky-600" />
                      <span>{n.slot}</span>
                    </span>
                  </div>
                </div>

                {/* Staff Assignment Bar - Admin can Assign / Reassign */}
                <div className="p-3 rounded-2xl bg-rose-50/30 border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {n.nurse ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {n.nurse.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Assigned Nurse: {n.nurse}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Clinical Home Care Specialist
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>No nurse assigned yet for this home clinical visit.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {!isComplete && (
                      <button
                        onClick={() => setAssigningNursing(n)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs ${
                          isUnassigned
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <UserCheck size={14} />
                        <span>{isUnassigned ? 'Assign Nurse' : 'Reassign Nurse'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Transitions - Admin can ONLY cancel visit; Nurse handles visit execution & billing */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    {n.status === 'confirmed' && (
                      <div className="flex items-center gap-2 text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="font-semibold">Awaiting Nurse Assignment by Admin</span>
                      </div>
                    )}
                    {n.status === 'nurse_assigned' && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span className="font-semibold">{n.nurse} Assigned • Awaiting departure in Nurse App</span>
                      </div>
                    )}
                    {n.status === 'on_the_way' && (
                      <div className="flex items-center gap-2 text-sky-700">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                        <span className="font-semibold">Nurse On The Way to Patient Doorstep</span>
                      </div>
                    )}
                    {n.status === 'in_progress' && (
                      <div className="flex items-center gap-2 text-rose-700">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                        </span>
                        <span className="font-semibold">Clinical Procedure &amp; Vitals In Progress at Doorstep</span>
                      </div>
                    )}
                    {n.status === 'completed' && (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-semibold">Visit Completed • Bill Generated &amp; Paid at Doorstep</span>
                      </div>
                    )}
                    {n.status === 'cancelled' && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <XCircle size={14} className="text-slate-400 shrink-0" />
                        <span className="font-semibold">Visit Cancelled</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {!isComplete && (
                      <ActionButton tone="danger" onClick={() => setNursingStatus(n.id, 'cancelled')}>
                        Cancel Visit
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Choose Whom to Assign Modal */}
      {assigningNursing && (
        <AssignStaffModal
          taskType="nursing"
          taskId={assigningNursing.id}
          patientName={assigningNursing.patientName}
          taskDescription={assigningNursing.procedures}
          zone={assigningNursing.zone}
          slot={assigningNursing.slot}
          currentAssignee={assigningNursing.nurse}
          onClose={() => setAssigningNursing(null)}
        />
      )}
    </div>
  );
}
