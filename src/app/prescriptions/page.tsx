'use client';

import React, { useMemo, useState } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Stethoscope,
  HeartPulse,
  Pill,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  X,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { AdminPrescription } from '@/lib/types';

export default function PrescriptionsPage() {
  const { prescriptions, setPrescriptionStatus, setOrderStatus } = useAdmin();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'doctor' | 'nurse' | 'pharmacist'

  // Selected prescription for reader modal
  const [readingRx, setReadingRx] = useState<AdminPrescription | null>(null);
  const [auditRemarks, setAuditRemarks] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const pendingCount = prescriptions.filter((p) => p.status === 'pending').length;

  const roleCounts = useMemo(() => {
    return {
      all: prescriptions.length,
      doctor: prescriptions.filter((p) => p.targetRole === 'doctor').length,
      nurse: prescriptions.filter((p) => p.targetRole === 'nurse').length,
      pharmacist: prescriptions.filter((p) => p.targetRole === 'pharmacist').length,
    };
  }, [prescriptions]);

  const rows = useMemo(() => {
    return prescriptions.filter((p) => {
      const q = query.toLowerCase();
      const match =
        p.id.toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        p.fileName.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q));
      if (!match) return false;

      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Target Role filter
      if (roleFilter !== 'all') {
        const rxRole = p.targetRole || 'all';
        if (rxRole !== roleFilter && rxRole !== 'all') return false;
      }

      return true;
    });
  }, [prescriptions, query, statusFilter, roleFilter]);

  const handleOpenReader = (rx: AdminPrescription) => {
    setReadingRx(rx);
    setAuditRemarks(rx.auditNotes || '');
    setZoomLevel(1);
    setRotation(0);
  };

  const handleCloseReader = () => {
    setReadingRx(null);
  };

  const handleAuditAction = (id: string, status: 'verified' | 'rejected') => {
    setPrescriptionStatus(id, status, auditRemarks);
    if (readingRx && readingRx.linkedOrderId && status === 'verified') {
      setOrderStatus(readingRx.linkedOrderId, 'verified');
    }
    if (readingRx?.id === id) {
      setReadingRx((prev) => (prev ? { ...prev, status, auditNotes: auditRemarks } : null));
    }
  };

  const getTargetBadge = (role?: string) => {
    switch (role) {
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Stethoscope size={13} className="text-blue-600" />
            For Doctor
          </span>
        );
      case 'nurse':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <HeartPulse size={13} className="text-emerald-600" />
            For Nurse
          </span>
        );
      case 'pharmacist':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Pill size={13} className="text-purple-600" />
            For Pharmacist
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText size={13} className="text-slate-500" />
            General / Any
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescription Clinical Audit & Reader"
        subtitle="Review, read, and audit patient uploaded prescriptions. Intended provider routing for Doctors, Nurses, and Pharmacists."
        right={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono shadow-xs">
              {pendingCount} AWAITING AUDIT
            </span>
          </div>
        }
      />

      {/* Target Recipient Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Target Provider:</span>
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            roleFilter === 'all'
              ? 'bg-[#184575] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Recipients ({roleCounts.all})
        </button>
        <button
          onClick={() => setRoleFilter('doctor')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            roleFilter === 'doctor'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Stethoscope size={13} />
          Doctor ({roleCounts.doctor})
        </button>
        <button
          onClick={() => setRoleFilter('nurse')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            roleFilter === 'nurse'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HeartPulse size={13} />
          Nurse ({roleCounts.nurse})
        </button>
        <button
          onClick={() => setRoleFilter('pharmacist')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            roleFilter === 'pharmacist'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Pill size={13} />
          Pharmacist ({roleCounts.pharmacist})
        </button>
      </div>

      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search patient, file, notes, or Rx ID…"
        active={statusFilter}
        onFilter={setStatusFilter}
        filters={[
          { id: 'pending', label: 'Pending Audit', count: pendingCount },
          { id: 'verified', label: 'Verified' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'all', label: 'All Statuses' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No prescriptions match your current filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((p) => {
            const fileUrl = p.fileUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900';
            const isPdf = p.fileName?.toLowerCase().endsWith('.pdf');

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card hover:border-slate-300 hover:shadow-card-hover transition space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Thumbnail preview */}
                    <div
                      onClick={() => handleOpenReader(p)}
                      className="cursor-pointer group relative w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center hover:ring-2 hover:ring-[#184575] transition"
                    >
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center text-red-600">
                          <FileText size={28} />
                          <span className="text-[9px] font-bold mt-0.5">PDF</span>
                        </div>
                      ) : (
                        <img
                          src={fileUrl}
                          alt={p.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Eye size={18} className="text-white" />
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{p.id}</h3>
                        <StatusBadge value={p.status} />
                        {getTargetBadge(p.targetRole)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-800">{p.patientName}</span>
                        {p.patientAge && <span>• {p.patientAge} yrs</span>}
                        <span>• {p.phone}</span>
                        <span>• Uploaded: {new Date(p.uploadedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>

                      {p.targetProviderName && (
                        <p className="text-xs text-[#184575] font-medium mt-1">
                          Assigned Provider: {p.targetProviderName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.linkedOrderId && (
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        Order: {p.linkedOrderId}
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenReader(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#184575] text-white rounded-xl text-xs font-bold hover:bg-[#12365c] transition shadow-xs"
                    >
                      <Eye size={14} />
                      Open &amp; Read Rx
                    </button>
                  </div>
                </div>

                {/* Patient notes & Attachment bar */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <div>
                      Attachment:{' '}
                      <span className="font-semibold text-slate-900 font-mono">{p.fileName}</span>
                    </div>
                    <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Digital Scan • High Resolution
                    </span>
                  </div>

                  {p.notes && (
                    <div className="pt-1.5 border-t border-slate-200/70 text-slate-700">
                      <strong className="text-slate-800">Patient Note: </strong>
                      {p.notes}
                    </div>
                  )}

                  {p.auditNotes && (
                    <div className="pt-1 border-t border-slate-200/70 text-slate-600 flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck size={13} className="text-emerald-600" />
                      <span>Audit Notes: {p.auditNotes} (by {p.verifiedBy || 'Auditor'})</span>
                    </div>
                  )}
                </div>

                {/* Audit Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-400">
                    Status: <strong className="text-slate-700 uppercase">{p.status}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <ActionButton
                      tone="neutral"
                      onClick={() => handleOpenReader(p)}
                    >
                      <Eye size={13} className="mr-1 inline" /> Full Clinical Reader
                    </ActionButton>

                    {p.status !== 'rejected' && (
                      <ActionButton
                        tone="danger"
                        onClick={() => handleAuditAction(p.id, 'rejected')}
                      >
                        Reject
                      </ActionButton>
                    )}

                    {p.status !== 'verified' && (
                      <ActionButton
                        tone="primary"
                        onClick={() => handleAuditAction(p.id, 'verified')}
                      >
                        Verify &amp; Approve
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Prescription Reader & Clinical Inspection Modal */}
      {readingRx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#184575] flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Prescription Reader • {readingRx.id}</h2>
                    {getTargetBadge(readingRx.targetRole)}
                  </div>
                  <p className="text-xs text-slate-300">
                    Patient: {readingRx.patientName} ({readingRx.phone}) • Uploaded {readingRx.uploadedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge value={readingRx.status} />
                <button
                  onClick={handleCloseReader}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Split Reader & Inspector */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
              {/* Left Side: Document Viewer with Controls */}
              <div className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
                {/* Reader Controls Toolbar */}
                <div className="px-4 py-2 bg-slate-900/90 text-white flex items-center justify-between border-b border-slate-800 z-10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut size={14} /> Zoom -
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Zoom In"
                    >
                      <ZoomIn size={14} /> Zoom +
                    </button>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Rotate Document"
                    >
                      <RotateCw size={14} /> Rotate
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={readingRx.fileUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition text-slate-300"
                    >
                      <ExternalLink size={14} /> Open Full Size
                    </a>
                  </div>
                </div>

                {/* Document Display Canvas */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                  <div
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out',
                    }}
                    className="max-w-full max-h-full flex items-center justify-center origin-center"
                  >
                    {readingRx.fileName?.toLowerCase().endsWith('.pdf') ? (
                      <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
                        <FileText size={64} className="text-red-500 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-slate-900">{readingRx.fileName}</h4>
                        <p className="text-xs text-slate-500 mt-1 mb-4">
                          PDF Prescription Document • Clinical Order
                        </p>
                        <a
                          href={readingRx.fileUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#184575] text-white rounded-xl text-xs font-bold hover:bg-[#12365c] transition"
                        >
                          <Download size={14} /> Download / View PDF Document
                        </a>
                      </div>
                    ) : (
                      <img
                        src={readingRx.fileUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900'}
                        alt={readingRx.fileName}
                        className="max-h-[70vh] object-contain rounded-xl shadow-2xl select-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Clinical Metadata & Audit Decision Panel */}
              <div className="w-full lg:w-96 bg-white border-l border-slate-200 p-5 overflow-y-auto space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Prescription Audit Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify doctor seal, MCI reg, dosage &amp; instructions
                  </p>
                </div>

                {/* Patient Information Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Patient Name:</span>
                    <strong className="text-slate-900">{readingRx.patientName}</strong>
                  </div>
                  {readingRx.patientAge && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Patient Age:</span>
                      <strong className="text-slate-900">{readingRx.patientAge} Years</strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone Contact:</span>
                    <strong className="text-slate-900">{readingRx.phone}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Intended Recipient:</span>
                    <div>{getTargetBadge(readingRx.targetRole)}</div>
                  </div>
                  {readingRx.linkedOrderId && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Linked Medicine Order:</span>
                      <strong className="text-teal-700 font-mono">{readingRx.linkedOrderId}</strong>
                    </div>
                  )}
                </div>

                {/* Patient Notes Box */}
                {readingRx.notes && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                      <AlertCircle size={14} />
                      Patient Instructions / Reason:
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">{readingRx.notes}</p>
                  </div>
                )}

                {/* Audit Decision Section */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Clinical Audit Notes / Remarks:
                  </label>
                  <textarea
                    rows={3}
                    value={auditRemarks}
                    onChange={(e) => setAuditRemarks(e.target.value)}
                    placeholder="e.g. Valid physician signature & MCI stamp verified. Approved for 30-day dispensing."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#184575] focus:border-transparent"
                  />

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleAuditAction(readingRx.id, 'verified')}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <CheckCircle2 size={16} />
                      Approve &amp; Mark Verified
                    </button>

                    <button
                      onClick={() => handleAuditAction(readingRx.id, 'rejected')}
                      className="w-full h-10 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <XCircle size={16} />
                      Reject Prescription
                    </button>
                  </div>

                  {readingRx.verifiedBy && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div>
                        Audited by: <strong className="text-slate-800">{readingRx.verifiedBy}</strong>
                      </div>
                      {readingRx.auditNotes && (
                        <div>
                          Note: <span className="italic">{readingRx.auditNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
