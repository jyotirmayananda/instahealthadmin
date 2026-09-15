'use client';

import React, { useMemo, useState } from 'react';
import { UserCheck, AlertCircle, MapPin, Calendar, HeartPulse } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminNursing, NursingStatus } from '@/lib/types';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import AssignStaffModal from '@/components/AssignStaffModal';

const NEXT: Partial<Record<NursingStatus, NursingStatus>> = {
  nurse_assigned: 'on_the_way',
  on_the_way: 'in_progress',
  in_progress: 'completed',
};

const NEXT_LABEL: Partial<Record<NursingStatus, string>> = {
  nurse_assigned: 'Mark On The Way',
  on_the_way: 'Start Clinical Visit',
  in_progress: 'Complete & Bill Visit',
};

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
        subtitle="Assign certified nurses, track home aseptic care, and manage pay-after-service billing."
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
                    <p className="text-lg font-extrabold text-slate-900">₹{n.billed}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Pay After Service</p>
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

                {/* Staff Assignment Bar */}
                <div className="p-3 rounded-2xl bg-rose-50/30 border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {n.nurse ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
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

                {/* Workflow Transitions */}
                <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-slate-100">
                  {NEXT[n.status] && (
                    <ActionButton tone="good" onClick={() => setNursingStatus(n.id, NEXT[n.status]!)}>
                      {NEXT_LABEL[n.status]}
                    </ActionButton>
                  )}
                  {!isComplete && (
                    <ActionButton tone="danger" onClick={() => setNursingStatus(n.id, 'cancelled')}>
                      Cancel Visit
                    </ActionButton>
                  )}
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
