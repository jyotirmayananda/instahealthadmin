'use client';

import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Video,
  PhoneCall,
  MessageSquare,
  FileSignature,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Star,
  Hospital,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  X,
  UserPlus,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminDoctor, DoctorAccessStatus, DoctorPermissions } from '@/lib/types';
import { ActionButton, EmptyNote, PageHeader } from '@/components/ui';

const SPECIALTIES = [
  'All Specialties',
  'General Physician',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
];

export default function DoctorsPage() {
  const {
    doctors,
    setDoctorStatus,
    updateDoctorPermissions,
    addDoctor,
    approveDoctor,
    rejectDoctor,
    counts,
  } = useAdmin();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties');

  // Modals state
  const [editingDoctor, setEditingDoctor] = useState<AdminDoctor | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  // New Doctor Form State
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'General Physician',
    qualification: '',
    councilRegNo: '',
    experienceYears: 5,
    hospitalAffiliation: '',
    consultFee: 500,
    status: 'active' as DoctorAccessStatus,
    permissions: {
      videoConsult: true,
      audioConsult: true,
      chatConsult: true,
      digitalRxSigning: true,
      emergencyOnCall: false,
    },
  });

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const q = query.toLowerCase();
      const matchesQuery =
        doc.name.toLowerCase().includes(q) ||
        doc.councilRegNo.toLowerCase().includes(q) ||
        doc.hospitalAffiliation.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (statusFilter !== 'all' && doc.status !== statusFilter) {
        return false;
      }

      if (specialtyFilter !== 'All Specialties' && doc.specialty !== specialtyFilter) {
        return false;
      }

      return true;
    });
  }, [doctors, query, statusFilter, specialtyFilter]);

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.councilRegNo) return;

    addDoctor(newDoctor);
    setShowOnboardModal(false);
    setNewDoctor({
      name: '',
      email: '',
      phone: '',
      specialty: 'General Physician',
      qualification: '',
      councilRegNo: '',
      experienceYears: 5,
      hospitalAffiliation: '',
      consultFee: 500,
      status: 'active',
      permissions: {
        videoConsult: true,
        audioConsult: true,
        chatConsult: true,
        digitalRxSigning: true,
        emergencyOnCall: false,
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Access & Credential Control"
        subtitle="Manage doctor portal authorization, audit medical council registrations, toggle digital Rx signing, and govern consultation privileges."
        right={
          <button
            onClick={() => setShowOnboardModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-2 shadow-xs"
          >
            <UserPlus size={15} />
            <span>Onboard New Doctor</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Total Doctors</span>
          <span className="text-2xl font-extrabold text-slate-900">{doctors.length}</span>
          <span className="text-[10px] text-slate-500 block">All onboarded specialists</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Active Authorized</span>
          <span className="text-2xl font-extrabold text-emerald-600">{counts.activeDoctors}</span>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <ShieldCheck size={11} /> Granted portal access
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Pending Approval</span>
          <span className="text-2xl font-extrabold text-amber-600">{counts.pendingDoctors}</span>
          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
            <Clock size={11} /> Awaiting council audit
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Suspended / Revoked</span>
          <span className="text-2xl font-extrabold text-rose-600">{counts.suspendedDoctors}</span>
          <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
            <ShieldAlert size={11} /> Portal access blocked
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctor, council ID, hospital…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'pending_approval', label: 'Pending' },
            { id: 'suspended', label: 'Suspended' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Specialty Filter */}
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        >
          {SPECIALTIES.map((spec) => (
            <option key={spec} value={spec} className="bg-white text-slate-900">
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Cards Directory */}
      {filteredDoctors.length === 0 ? (
        <EmptyNote text="No doctors match the selected filters." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredDoctors.map((doc) => {
            const isActive = doc.status === 'active';
            const isPending = doc.status === 'pending_approval';
            const isSuspended = doc.status === 'suspended';

            return (
              <div
                key={doc.id}
                className={`bg-white border rounded-3xl p-5 space-y-4 transition shadow-card hover:shadow-card-hover ${
                  isActive
                    ? 'border-slate-200/80 hover:border-slate-300'
                    : isPending
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-rose-300 bg-rose-50/20'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 truncate">{doc.name}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                          {doc.specialty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{doc.qualification}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Hospital size={12} className="text-slate-400" />
                        <span className="truncate">{doc.hospitalAffiliation}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 text-right">
                    {isActive && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        <span>Access Active</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>Pending Audit</span>
                      </span>
                    )}
                    {isSuspended && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5">
                        <XCircle size={13} />
                        <span>Access Suspended</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Credentials & Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">
                      Council Reg.
                    </span>
                    <span className="font-mono font-semibold text-slate-800 text-xs truncate block">
                      {doc.councilRegNo}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">
                      Experience
                    </span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {doc.experienceYears} Years
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">
                      Consult Fee
                    </span>
                    <span className="font-semibold text-teal-700 text-xs">
                      ₹{doc.consultFee}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">
                      Rating / Consults
                    </span>
                    <span className="font-semibold text-amber-600 text-xs flex items-center gap-1">
                      <Star size={11} className="fill-amber-400 text-amber-500" />
                      {doc.rating} ({doc.totalConsults})
                    </span>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">
                      Authorized Capabilities
                    </span>
                    <button
                      onClick={() => setEditingDoctor(doc)}
                      className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 transition"
                    >
                      <Settings size={12} />
                      <span>Configure</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <PermissionChip
                      icon={Video}
                      label="Video Call"
                      enabled={doc.permissions.videoConsult}
                    />
                    <PermissionChip
                      icon={PhoneCall}
                      label="Audio Call"
                      enabled={doc.permissions.audioConsult}
                    />
                    <PermissionChip
                      icon={MessageSquare}
                      label="Direct Chat"
                      enabled={doc.permissions.chatConsult}
                    />
                    <PermissionChip
                      icon={FileSignature}
                      label="Digital Rx Signing"
                      enabled={doc.permissions.digitalRxSigning}
                    />
                    <PermissionChip
                      icon={AlertCircle}
                      label="Emergency On-Call"
                      enabled={doc.permissions.emergencyOnCall}
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Phone: {doc.phone}
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <ActionButton
                          tone="danger"
                          onClick={() => rejectDoctor(doc.id)}
                        >
                          Reject
                        </ActionButton>
                        <ActionButton
                          tone="primary"
                          onClick={() => approveDoctor(doc.id)}
                        >
                          Approve & Grant Access
                        </ActionButton>
                      </>
                    )}

                    {isActive && (
                      <ActionButton
                        tone="danger"
                        onClick={() => setDoctorStatus(doc.id, 'suspended')}
                      >
                        Suspend Access
                      </ActionButton>
                    )}

                    {isSuspended && (
                      <ActionButton
                        tone="good"
                        onClick={() => setDoctorStatus(doc.id, 'active')}
                      >
                        Restore Access
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permissions Configuration Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-modal p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Doctor Access</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingDoctor.name}</p>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              <ToggleRow
                icon={Video}
                title="Video Teleconsultation"
                desc="Permit launching secure end-to-end video consultation rooms."
                checked={editingDoctor.permissions.videoConsult}
                onChange={(val) =>
                  updateDoctorPermissions(editingDoctor.id, { videoConsult: val })
                }
              />

              <ToggleRow
                icon={PhoneCall}
                title="Audio Consultations"
                desc="Permit voice call sessions with patients."
                checked={editingDoctor.permissions.audioConsult}
                onChange={(val) =>
                  updateDoctorPermissions(editingDoctor.id, { audioConsult: val })
                }
              />

              <ToggleRow
                icon={MessageSquare}
                title="Patient Direct Messaging"
                desc="Enable real-time messaging and file exchange in consultations."
                checked={editingDoctor.permissions.chatConsult}
                onChange={(val) =>
                  updateDoctorPermissions(editingDoctor.id, { chatConsult: val })
                }
              />

              <ToggleRow
                icon={FileSignature}
                title="Digital Prescription Signing Authority"
                desc="Authorize doctor to generate legally binding digital prescriptions linked to medicine cart."
                checked={editingDoctor.permissions.digitalRxSigning}
                onChange={(val) =>
                  updateDoctorPermissions(editingDoctor.id, { digitalRxSigning: val })
                }
              />

              <ToggleRow
                icon={AlertCircle}
                title="Emergency On-Call Escalations"
                desc="Route critical emergency consultation tickets to this physician."
                checked={editingDoctor.permissions.emergencyOnCall}
                onChange={(val) =>
                  updateDoctorPermissions(editingDoctor.id, { emergencyOnCall: val })
                }
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setEditingDoctor(null)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Doctor Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-modal p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Onboard & Grant Doctor Access</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register practitioner profile, verify council accreditation, and issue access.
                </p>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Priyanshu Mehta, MD"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Specialty *
                  </label>
                  <select
                    value={newDoctor.specialty}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    {SPECIALTIES.filter((s) => s !== 'All Specialties').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Medical Council Reg. Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DMC/2016/55491"
                    value={newDoctor.councilRegNo}
                    onChange={(e) => setNewDoctor({ ...newDoctor, councilRegNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Qualifications *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, MD (General Medicine)"
                    value={newDoctor.qualification}
                    onChange={(e) => setNewDoctor({ ...newDoctor, qualification: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Hospital / Clinic Affiliation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Max Healthcare & Apollo Clinic"
                    value={newDoctor.hospitalAffiliation}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, hospitalAffiliation: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={newDoctor.consultFee}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, consultFee: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Doctor Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98XXX XXXXX"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Doctor Email
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@instahealth.app"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Initial Portal Status
                </label>
                <select
                  value={newDoctor.status}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, status: e.target.value as DoctorAccessStatus })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="active">Active (Immediate Portal Access)</option>
                  <option value="pending_approval">Pending Approval (Credential Review)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs"
                >
                  Confirm & Onboard Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionChip({
  icon: Icon,
  label,
  enabled,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  enabled: boolean;
}) {
  return (
    <span
      className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 border transition ${
        enabled
          ? 'bg-teal-50 border-teal-200 text-teal-800'
          : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
      }`}
    >
      <Icon size={11} className={enabled ? 'text-teal-600' : 'text-slate-400'} />
      <span>{label}</span>
    </span>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={14} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900">{title}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
      </label>
    </div>
  );
}
