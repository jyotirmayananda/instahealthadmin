'use client';

import React, { useMemo, useState } from 'react';
import { FileCheck, ShieldCheck, UserCheck, Bike, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/lib/admin-context';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';

export default function ProvidersKycPage() {
  const { providers, setKycStatus, approveNurse, riders, approveRider, rejectRider } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('pending');
  const [roleTab, setRoleTab] = useState<'all' | 'clinical' | 'delivery'>('all');

  // Unified list of applicants
  const allApplicants = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      role: string;
      isRider: boolean;
      qualification: string;
      councilRegNo: string;
      phone: string;
      status: 'pending' | 'verified' | 'rejected';
      documents: string[];
    }> = [];

    // 1. Clinical staff
    providers.forEach((p) => {
      list.push({
        id: p.id,
        name: p.name,
        role: p.role,
        isRider: false,
        qualification: p.qualification,
        councilRegNo: p.councilRegNo,
        phone: p.phone,
        status: p.status,
        documents: p.documents,
      });
    });

    // 2. Delivery riders
    riders.forEach((r) => {
      list.push({
        id: r.id,
        name: r.name,
        role: 'Delivery Partner',
        isRider: true,
        qualification: `${r.vehicleType || 'Electric Bike'} • ${r.vehicleNumber || 'UP-16-EV-9011'}`,
        councilRegNo: r.drivingLicense || 'DL-KA-05-9923',
        phone: r.phone,
        status: r.status === 'pending_approval' ? 'pending' : (r.status === 'available' || r.status === 'delivering' ? 'verified' : 'rejected'),
        documents: r.documents || ['Driving License', 'Vehicle RC Document'],
      });
    });

    return list;
  }, [providers, riders]);

  const pendingCount = allApplicants.filter((r) => r.status === 'pending').length;

  const rows = useMemo(() => {
    return allApplicants.filter((r) => {
      const match =
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.councilRegNo.toLowerCase().includes(query.toLowerCase()) ||
        r.role.toLowerCase().includes(query.toLowerCase());
      if (!match) return false;

      if (roleTab === 'clinical' && r.isRider) return false;
      if (roleTab === 'delivery' && !r.isRider) return false;

      if (filter === 'all') return true;
      return r.status === filter;
    });
  }, [allApplicants, query, filter, roleTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner & Staff KYC Verification Desk"
        subtitle="Review credentials and approve Delivery Partners, Nurses, and Clinical Staff before they go live on the field."
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/dispatch"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold hover:bg-sky-100 transition shadow-xs"
            >
              <Bike size={14} />
              <span>Open Fleet Dispatch Desk ➔</span>
            </Link>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold font-mono shadow-xs">
              {pendingCount} AWAITING AUDIT
            </span>
          </div>
        }
      />

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: `All Applicants (${allApplicants.length})` },
          { id: 'delivery', label: `Delivery Partners (${riders.length})` },
          { id: 'clinical', label: `Clinical Nurses & Staff (${providers.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRoleTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              roleTab === tab.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search name, phone, or license / registration number…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'pending', label: 'Pending Approval', count: pendingCount },
          { id: 'verified', label: 'Approved & Active' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'all', label: 'All' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No applications match this filter." />
      ) : (
        <div className="space-y-4">
          {rows.map((req) => (
            <div
              key={req.id}
              className={`bg-white border rounded-3xl p-6 space-y-4 shadow-card hover:border-slate-300 hover:shadow-card-hover transition ${
                req.status === 'pending' ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      req.isRider
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}
                  >
                    {req.isRider ? <Bike size={20} /> : req.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{req.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.isRider
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {req.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{req.qualification}</p>
                  </div>
                </div>
                <StatusBadge value={req.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                    {req.isRider ? 'Driving License / ID' : 'Council Registration'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{req.councilRegNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Phone Number</span>
                  <span className="font-semibold text-slate-800 text-sm">{req.phone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Accreditation &amp; Identity Documents
                </p>
                <div className="space-y-1.5">
                  {req.documents.map((doc) => (
                    <div
                      key={doc}
                      className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <FileCheck size={14} className="text-teal-600" />
                        <span>{doc}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Uploaded &amp; Intact
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <ActionButton
                    tone="danger"
                    onClick={() => {
                      if (req.isRider) {
                        rejectRider(req.id);
                      } else {
                        setKycStatus(req.id, 'rejected');
                      }
                    }}
                  >
                    Reject Application
                  </ActionButton>
                  <ActionButton
                    tone="primary"
                    onClick={() => {
                      if (req.isRider) {
                        approveRider(req.id);
                      } else {
                        approveNurse(req.id);
                      }
                    }}
                  >
                    Approve &amp; Grant Field Access
                  </ActionButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
