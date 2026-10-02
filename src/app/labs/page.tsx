'use client';

import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  UserPlus,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  TestTube,
  FileCheck,
  Download,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminLab, LabStatus } from '@/lib/types';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import AssignStaffModal from '@/components/AssignStaffModal';
import UploadLabReportModal from '@/components/UploadLabReportModal';

const NEXT: Partial<Record<LabStatus, LabStatus>> = {
  phlebotomist_assigned: 'on_the_way',
  on_the_way: 'sample_collected',
  sample_collected: 'processing_in_lab',
  processing_in_lab: 'report_ready',
};

const NEXT_LABEL: Partial<Record<LabStatus, string>> = {
  phlebotomist_assigned: 'Mark On The Way',
  on_the_way: 'Sample Collected',
  sample_collected: 'Send to Lab Processing',
  processing_in_lab: 'Upload & Release Report',
};

export default function LabsPage() {
  const { labs, setLabStatus, uploadLabReport } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('open');

  // Modal for assigning phlebotomist
  const [assigningLab, setAssigningLab] = useState<AdminLab | null>(null);

  // Modal for uploading lab report
  const [uploadingLab, setUploadingLab] = useState<AdminLab | null>(null);

  const rows = useMemo(() => {
    return labs.filter((l) => {
      const q = query.toLowerCase();
      const match =
        l.id.toLowerCase().includes(q) ||
        l.patientName.toLowerCase().includes(q) ||
        l.tests.toLowerCase().includes(q) ||
        (l.phlebotomist && l.phlebotomist.toLowerCase().includes(q));
      if (!match) return false;
      if (filter === 'open') return !['report_ready', 'cancelled'].includes(l.status);
      if (filter === 'all') return true;
      if (filter === 'confirmed') return l.status === 'confirmed';
      return l.status === filter;
    });
  }, [labs, query, filter]);

  const unassignedCount = labs.filter((l) => l.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Lab Bookings Desk"
        subtitle="Assign phlebotomists, track doorstep sample collection, and release digital test reports."
        right={
          <div className="flex items-center gap-2">
            {unassignedCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs">
                <AlertCircle size={13} className="text-amber-600" />
                {unassignedCount} UNASSIGNED
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold font-mono shadow-xs">
              {labs.filter((l) => l.status !== 'report_ready' && l.status !== 'cancelled').length} OPEN BOOKINGS
            </span>
          </div>
        }
      />

      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search booking, patient, test, or phlebotomist…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'open', label: 'Open' },
          { id: 'confirmed', label: 'Unassigned', count: unassignedCount },
          { id: 'phlebotomist_assigned', label: 'Phlebo Assigned' },
          { id: 'report_ready', label: 'Reports Ready' },
          { id: 'all', label: 'All' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No lab bookings match this filter." />
      ) : (
        <div className="space-y-4">
          {rows.map((l) => {
            const isUnassigned = l.status === 'confirmed';
            const isComplete = l.status === 'report_ready' || l.status === 'cancelled';

            return (
              <div
                key={l.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 hover:border-slate-300 hover:shadow-card-hover transition shadow-card"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">{l.id}</h3>
                      <StatusBadge value={l.status} />
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 uppercase">
                        {l.mode.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Patient: <strong className="text-slate-800">{l.patientName}</strong> • {l.phone}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-lg font-extrabold text-slate-900">₹{l.total}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Billed &amp; Logged</p>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-3.5 text-xs text-slate-700 space-y-2">
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <TestTube size={13} className="text-teal-600" />
                    <span>{l.tests}</span>
                  </p>
                  <div className="flex items-center gap-4 text-slate-500 text-[11px] flex-wrap">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin size={12} className="text-teal-600" />
                      <span>{l.zone}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Calendar size={12} className="text-sky-600" />
                      <span>{l.slot}</span>
                    </span>
                  </div>
                </div>

                {/* Staff Assignment Bar */}
                <div className="p-3 rounded-2xl bg-teal-50/40 border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {l.phlebotomist ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                        {l.phlebotomist.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Assigned Phlebotomist: {l.phlebotomist}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Doorstep sample collection lead
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>No phlebotomist assigned yet to this sample collection.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {!isComplete && (
                      <button
                        onClick={() => setAssigningLab(l)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs ${
                          isUnassigned
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <UserCheck size={14} />
                        <span>{isUnassigned ? 'Assign Phlebotomist' : 'Reassign Phlebo'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Released Report Card when report_ready */}
                {l.status === 'report_ready' && (
                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                        <FileCheck size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-emerald-950">
                            Verified Digital Lab Report Released
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Customer Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {l.reportFileName || 'Diagnostic_Lab_Report.pdf'} •{' '}
                          {l.reportUploadedAt || 'Available on customer portal'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <a
                        href={l.reportUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={l.reportFileName || 'Diagnostic_Lab_Report.pdf'}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Download size={13} />
                        <span>Download / Preview PDF</span>
                      </a>
                      <button
                        onClick={() => setUploadingLab(l)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition shadow-xs"
                      >
                        Replace Report
                      </button>
                    </div>
                  </div>
                )}

                {/* Workflow Transitions */}
                <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-slate-100">
                  {l.status === 'processing_in_lab' && (
                    <ActionButton tone="primary" onClick={() => setUploadingLab(l)}>
                      <Upload size={14} className="mr-1 inline" />
                      Upload &amp; Release Report
                    </ActionButton>
                  )}
                  {NEXT[l.status] && l.status !== 'processing_in_lab' && (
                    <ActionButton tone="good" onClick={() => setLabStatus(l.id, NEXT[l.status]!)}>
                      {NEXT_LABEL[l.status]}
                    </ActionButton>
                  )}
                  {!isComplete && (
                    <ActionButton tone="danger" onClick={() => setLabStatus(l.id, 'cancelled')}>
                      Cancel Booking
                    </ActionButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Choose Whom to Assign Modal */}
      {assigningLab && (
        <AssignStaffModal
          taskType="lab"
          taskId={assigningLab.id}
          patientName={assigningLab.patientName}
          taskDescription={assigningLab.tests}
          zone={assigningLab.zone}
          slot={assigningLab.slot}
          currentAssignee={assigningLab.phlebotomist}
          onClose={() => setAssigningLab(null)}
        />
      )}

      {/* Upload Lab Report Modal */}
      {uploadingLab && (
        <UploadLabReportModal
          bookingId={uploadingLab.id}
          patientName={uploadingLab.patientName}
          tests={uploadingLab.tests}
          existingReportUrl={uploadingLab.reportUrl}
          existingFileName={uploadingLab.reportFileName}
          onClose={() => setUploadingLab(null)}
          onUpload={(reportUrl, fileName) => {
            uploadLabReport(uploadingLab.id, reportUrl, fileName);
          }}
        />
      )}
    </div>
  );
}
