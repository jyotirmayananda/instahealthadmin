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
  Trash2,
  Eye,
  IndianRupee,
  Coins,
  BadgeCheck,
  FileText,
  Phone,
  Mail,
  Edit3,
  Save,
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
    removeDoctor,
    consultationPricing,
    updateConsultationPricing,
    counts,
  } = useAdmin();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties');

  // Modals state
  const [inspectingDoctor, setInspectingDoctor] = useState<AdminDoctor | null>(null);
  const [doctorToRemove, setDoctorToRemove] = useState<AdminDoctor | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPermissionsDoctor, setEditingPermissionsDoctor] = useState<AdminDoctor | null>(null);

  // Pricing edit form state
  const [pricingForm, setPricingForm] = useState({
    videoFee: consultationPricing?.videoFee || 499,
    audioFee: consultationPricing?.audioFee || 299,
    chatFee: consultationPricing?.chatFee || 149,
  });
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState('');

  // New Doctor Form State (Onboarding by Admin)
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'General Physician',
    qualification: 'MBBS, MD',
    councilRegNo: '',
    experienceYears: 5,
    hospitalAffiliation: 'Medco Partner Clinic',
    consultFee: consultationPricing?.videoFee || 499,
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

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    await updateConsultationPricing({
      videoFee: Number(pricingForm.videoFee),
      audioFee: Number(pricingForm.audioFee),
      chatFee: Number(pricingForm.chatFee),
    });
    setIsSavingPricing(false);
    setShowPricingModal(false);
    setPricingSuccessMsg('Patient consultation rates updated successfully across all accounts.');
    setTimeout(() => setPricingSuccessMsg(''), 4000);
  };

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.councilRegNo) return;

    addDoctor({
      ...newDoctor,
      consultFee: consultationPricing?.videoFee || 499,
      documents: [
        'Medical Council Registration Certificate',
        'State Medical License',
        `${newDoctor.qualification} Degree Certificate`,
      ],
    });
    setShowOnboardModal(false);
    setNewDoctor({
      name: '',
      email: '',
      phone: '',
      specialty: 'General Physician',
      qualification: 'MBBS, MD',
      councilRegNo: '',
      experienceYears: 5,
      hospitalAffiliation: 'Medco Partner Clinic',
      consultFee: consultationPricing?.videoFee || 499,
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

  const handleConfirmRemove = () => {
    if (doctorToRemove) {
      removeDoctor(doctorToRemove.id);
      setDoctorToRemove(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Registry & Patient Consultation Pricing"
        subtitle="Govern centralized teleconsultation fees (Video, Audio, Chat), review Medical Council credentials, onboard accredited physicians, or revoke portal access."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPricingForm({
                  videoFee: consultationPricing?.videoFee || 499,
                  audioFee: consultationPricing?.audioFee || 299,
                  chatFee: consultationPricing?.chatFee || 149,
                });
                setShowPricingModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-semibold transition flex items-center gap-2 shadow-xs"
            >
              <Coins size={15} className="text-teal-600" />
              <span>Configure Patient Rates</span>
            </button>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-2 shadow-xs"
            >
              <UserPlus size={15} />
              <span>Onboard Doctor</span>
            </button>
          </div>
        }
      />

      {pricingSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{pricingSuccessMsg}</span>
        </div>
      )}

      {/* Centralized Teleconsultation Fee Control Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-indigo-900 rounded-3xl p-5 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-teal-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/60 border border-teal-400/30 flex items-center justify-center shrink-0">
              <Coins size={20} className="text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Platform Teleconsultation Pricing (Patient-Facing)</h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-700/80 text-teal-200 text-[10px] font-bold border border-teal-500/30">
                  Global Rate
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-0.5">
                Admin sets these fees. These exact amounts are shown to all patients across the Medco Patient App. Individual doctors cannot charge custom fees.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setPricingForm({
                videoFee: consultationPricing?.videoFee || 499,
                audioFee: consultationPricing?.audioFee || 299,
                chatFee: consultationPricing?.chatFee || 149,
              });
              setShowPricingModal(true);
            }}
            className="self-start md:self-auto px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            <Edit3 size={13} />
            <span>Edit Patient Rates</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-teal-200 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Video size={14} /> Video Call Fee
              </span>
              <span className="text-[10px] bg-teal-600/60 px-1.5 py-0.5 rounded font-mono">Instant &amp; Scheduled</span>
            </div>
            <div className="text-2xl font-black text-white flex items-center">
              <span>₹{consultationPricing?.videoFee ?? 499}</span>
              <span className="text-xs text-teal-200 font-normal ml-1.5">/ session</span>
            </div>
            <p className="text-[11px] text-teal-100/70">Displayed to patients for video appointments.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-teal-200 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <PhoneCall size={14} /> Audio Call Fee
              </span>
              <span className="text-[10px] bg-teal-600/60 px-1.5 py-0.5 rounded font-mono">Voice Only</span>
            </div>
            <div className="text-2xl font-black text-white flex items-center">
              <span>₹{consultationPricing?.audioFee ?? 299}</span>
              <span className="text-xs text-teal-200 font-normal ml-1.5">/ session</span>
            </div>
            <p className="text-[11px] text-teal-100/70">Displayed to patients for direct voice teleconsults.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-teal-200 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <MessageSquare size={14} /> Text Chat Fee
              </span>
              <span className="text-[10px] bg-teal-600/60 px-1.5 py-0.5 rounded font-mono">Chat &amp; e-Rx</span>
            </div>
            <div className="text-2xl font-black text-white flex items-center">
              <span>₹{consultationPricing?.chatFee ?? 149}</span>
              <span className="text-xs text-teal-200 font-normal ml-1.5">/ session</span>
            </div>
            <p className="text-[11px] text-teal-100/70">Displayed to patients for secure message consults.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Total Network Doctors</span>
          <span className="text-2xl font-extrabold text-slate-900">{doctors.length}</span>
          <span className="text-[10px] text-slate-500 block">All registered &amp; onboarded specialists</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Active &amp; Authorized</span>
          <span className="text-2xl font-extrabold text-emerald-600">{counts.activeDoctors}</span>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <ShieldCheck size={11} /> Granted teleconsult access
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Pending Council Audit</span>
          <span className="text-2xl font-extrabold text-amber-600">{counts.pendingDoctors}</span>
          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
            <Clock size={11} /> Awaiting admin approval
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Suspended Access</span>
          <span className="text-2xl font-extrabold text-rose-600">{counts.suspendedDoctors}</span>
          <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
            <ShieldAlert size={11} /> Portal access paused
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
            placeholder="Search doctor, council reg no, hospital…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: 'all', label: 'All Doctors' },
            { id: 'active', label: 'Active' },
            { id: 'pending_approval', label: 'Pending Audit' },
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
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 text-right">
                    {isActive && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        <span>Active</span>
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
                        <span>Suspended</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls: See Details, Approve/Suspend, and Remove */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setInspectingDoctor(doc)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Eye size={13} className="text-slate-500" />
                    <span>View Credentials</span>
                  </button>

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
                          Approve &amp; Authorize
                        </ActionButton>
                      </>
                    )}

                    {isActive && (
                      <ActionButton
                        tone="danger"
                        onClick={() => setDoctorStatus(doc.id, 'suspended')}
                      >
                        Suspend
                      </ActionButton>
                    )}

                    {isSuspended && (
                      <ActionButton
                        tone="good"
                        onClick={() => setDoctorStatus(doc.id, 'active')}
                      >
                        Restore
                      </ActionButton>
                    )}

                    {/* Remove Doctor Action */}
                    <button
                      onClick={() => setDoctorToRemove(doc)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Remove doctor from network"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Doctor Credentials Modal (Read-Only / No Credentials Exposure) */}
      {inspectingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-modal p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {inspectingDoctor.name.replace('Dr. ', '').charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{inspectingDoctor.name}</h3>
                  <p className="text-xs text-slate-500">{inspectingDoctor.specialty}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingDoctor(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Council Registration:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {inspectingDoctor.councilRegNo}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Degree &amp; Qualifications:</span>
                  <span className="font-semibold text-slate-800">{inspectingDoctor.qualification}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Hospital Affiliation:</span>
                  <span className="font-semibold text-slate-800">{inspectingDoctor.hospitalAffiliation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Clinical Experience:</span>
                  <span className="font-semibold text-slate-800">{inspectingDoctor.experienceYears} Years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Contact Phone:</span>
                  <span className="font-mono font-semibold text-slate-800">{inspectingDoctor.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Registered Email:</span>
                  <span className="font-semibold text-slate-800">{inspectingDoctor.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Portal Access Status:</span>
                  <span className="font-bold uppercase text-[11px] text-teal-700">{inspectingDoctor.status}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Doctor Set Rates:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="text-teal-700">Video ₹{inspectingDoctor.videoFee || inspectingDoctor.consultFee || 499}</span>
                    <span>•</span>
                    <span className="text-blue-700">Audio ₹{inspectingDoctor.audioFee || 299}</span>
                    <span>•</span>
                    <span className="text-indigo-700">Chat ₹{inspectingDoctor.chatFee || 199}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Verification Documents */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Uploaded Audit Documents:</span>
                <div className="space-y-1.5">
                  {(inspectingDoctor.documents || [
                    'Medical Council Registration Certificate',
                    'State Medical Practice License',
                    'Degree & MD Specialization Certificate',
                  ]).map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileText size={14} className="text-teal-600" />
                        <span className="font-medium">{doc}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                        <BadgeCheck size={11} /> Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security note */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <Shield size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <span>
                  Admin has audit and governance authority only. Doctor authentication credentials and private keys are isolated to the Medco Provider App for HIPAA/NABH compliance.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectingDoctor(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Global Patient Consultation Rates Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-modal p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Coins size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configure Patient Rates</h3>
                  <p className="text-xs text-slate-500">Global teleconsultation pricing</p>
                </div>
              </div>
              <button
                onClick={() => setShowPricingModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Video Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pricingForm.videoFee}
                  onChange={(e) => setPricingForm({ ...pricingForm, videoFee: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Amount billed to patients for video appointments.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Audio Call Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pricingForm.audioFee}
                  onChange={(e) => setPricingForm({ ...pricingForm, audioFee: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Amount billed to patients for direct voice teleconsults.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Text Chat Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pricingForm.chatFee}
                  onChange={(e) => setPricingForm({ ...pricingForm, chatFee: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Amount billed to patients for text consults and digital prescriptions.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPricing}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
                >
                  <Save size={13} />
                  <span>{isSavingPricing ? 'Saving…' : 'Save & Publish Rates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Doctor Confirmation Modal */}
      {doctorToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-modal p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Remove Doctor</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{doctorToRemove.name}</span> from the network?
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-[11px]">
              This will revoke all teleconsultation privileges and remove this physician from the Medco patient marketplace.
            </div>
            <div className="pt-2 flex items-center justify-center gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDoctorToRemove(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Doctor Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-modal p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Onboard Accredited Doctor</h3>
                <p className="text-xs text-slate-500">Register and authorize a physician</p>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Council Reg. No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCI/2021/89201"
                    value={newDoctor.councilRegNo}
                    onChange={(e) => setNewDoctor({ ...newDoctor, councilRegNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Degree / Qualifications
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD (Internal Med)"
                    value={newDoctor.qualification}
                    onChange={(e) => setNewDoctor({ ...newDoctor, qualification: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Hospital / Clinic Affiliation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fortis Healthcare / Medco Clinic"
                    value={newDoctor.hospitalAffiliation}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, hospitalAffiliation: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDoctor.experienceYears}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, experienceYears: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98110 22334"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. dr.rajesh@medco.care"
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
                  Confirm &amp; Onboard Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Configuration Modal */}
      {editingPermissionsDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-modal p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Doctor Capabilities</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingPermissionsDoctor.name}</p>
              </div>
              <button
                onClick={() => setEditingPermissionsDoctor(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              <ToggleRow
                icon={Video}
                title="Video Teleconsultation"
                desc={`Authorize end-to-end video appointments at platform rate (₹${consultationPricing?.videoFee || 499}).`}
                checked={editingPermissionsDoctor.permissions.videoConsult}
                onChange={(val) =>
                  updateDoctorPermissions(editingPermissionsDoctor.id, { videoConsult: val })
                }
              />
              <ToggleRow
                icon={PhoneCall}
                title="Audio Call Teleconsultation"
                desc={`Authorize direct voice teleconsultations at platform rate (₹${consultationPricing?.audioFee || 299}).`}
                checked={editingPermissionsDoctor.permissions.audioConsult}
                onChange={(val) =>
                  updateDoctorPermissions(editingPermissionsDoctor.id, { audioConsult: val })
                }
              />
              <ToggleRow
                icon={MessageSquare}
                title="Direct Text Chat"
                desc={`Authorize real-time text chat at platform rate (₹${consultationPricing?.chatFee || 149}).`}
                checked={editingPermissionsDoctor.permissions.chatConsult}
                onChange={(val) =>
                  updateDoctorPermissions(editingPermissionsDoctor.id, { chatConsult: val })
                }
              />
              <ToggleRow
                icon={FileSignature}
                title="Digital Rx Signing"
                desc="Permit issuing cryptographically signed digital prescriptions."
                checked={editingPermissionsDoctor.permissions.digitalRxSigning}
                onChange={(val) =>
                  updateDoctorPermissions(editingPermissionsDoctor.id, { digitalRxSigning: val })
                }
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPermissionsDoctor(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
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
