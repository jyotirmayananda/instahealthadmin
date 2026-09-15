'use client';

import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  Stethoscope,
  Video,
  PhoneCall,
  MessageSquare,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminConsult } from '@/lib/types';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import AssignStaffModal from '@/components/AssignStaffModal';

export default function ConsultationsPage() {
  const { consults, setConsultStatus } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('open');

  // Modal for assigning doctor
  const [assigningConsult, setAssigningConsult] = useState<AdminConsult | null>(null);

  const rows = useMemo(() => {
    return consults.filter((c) => {
      const q = query.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.patientName.toLowerCase().includes(q) ||
        c.doctorName.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q);
      if (!match) return false;
      if (filter === 'open') return c.status === 'scheduled' || c.status === 'live';
      if (filter === 'all') return true;
      return c.status === filter;
    });
  }, [consults, query, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Teleconsultations Desk"
        subtitle="Assign licensed physicians, start live consultation rooms, and oversee digital e-prescriptions."
        right={
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold font-mono shadow-xs">
            {consults.filter((c) => c.status === 'scheduled' || c.status === 'live').length} LIVE QUEUE
          </span>
        }
      />

      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search patient, doctor, specialty, or symptoms…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'open', label: 'Open' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'live', label: 'Live' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No consultations match this filter." />
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const isCompleted = c.status === 'completed' || c.status === 'cancelled';
            const isUnassigned =
              !c.doctorName || c.doctorName.toLowerCase().includes('unassigned');

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 hover:border-slate-300 hover:shadow-card-hover transition shadow-card"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">{c.id}</h3>
                      <StatusBadge value={c.status} />
                      <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                        {c.type === 'video' ? (
                          <Video size={11} />
                        ) : c.type === 'audio' ? (
                          <PhoneCall size={11} />
                        ) : (
                          <MessageSquare size={11} />
                        )}
                        <span>{c.type} Consult</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Patient: <strong className="text-slate-800">{c.patientName}</strong> • Slot: {c.slot}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-lg font-extrabold text-slate-900">₹{c.fee}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.specialty}</p>
                  </div>
                </div>

                {/* Symptoms Description */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-3.5 text-xs text-slate-700 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Chief Complaint / Symptoms
                  </span>
                  <p className="font-semibold text-slate-900">{c.symptoms}</p>
                </div>

                {/* Doctor Assignment Bar */}
                <div className="p-3 rounded-2xl bg-teal-50/40 border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                      <Stethoscope size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {isUnassigned ? 'No Doctor Assigned' : c.doctorName}
                        </span>
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                          {c.specialty}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isUnassigned
                          ? 'Assign an authorized physician to take this consultation'
                          : 'Assigned Consulting Specialist'}
                      </span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => setAssigningConsult(c)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs ${
                        isUnassigned
                          ? 'bg-teal-600 hover:bg-teal-700 text-white'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <UserCheck size={14} />
                      <span>{isUnassigned ? 'Assign Doctor' : 'Reassign Doctor'}</span>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-slate-100">
                  {c.status === 'scheduled' && (
                    <ActionButton tone="primary" onClick={() => setConsultStatus(c.id, 'live')}>
                      Start Live Session
                    </ActionButton>
                  )}
                  {(c.status === 'scheduled' || c.status === 'live') && (
                    <>
                      <ActionButton tone="good" onClick={() => setConsultStatus(c.id, 'completed')}>
                        Complete &amp; e-Rx
                      </ActionButton>
                      <ActionButton tone="danger" onClick={() => setConsultStatus(c.id, 'cancelled')}>
                        Cancel Session
                      </ActionButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Doctor Modal */}
      {assigningConsult && (
        <AssignStaffModal
          taskType="consultation"
          taskId={assigningConsult.id}
          patientName={assigningConsult.patientName}
          taskDescription={`${assigningConsult.specialty} consultation: ${assigningConsult.symptoms}`}
          slot={assigningConsult.slot}
          currentAssignee={assigningConsult.doctorName}
          onClose={() => setAssigningConsult(null)}
        />
      )}
    </div>
  );
}
