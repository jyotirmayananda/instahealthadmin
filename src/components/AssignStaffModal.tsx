'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck,
  Search,
  MapPin,
  BatteryCharging,
  Star,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  Stethoscope,
  TestTube,
  HeartPulse,
  Bike,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

export type AssignTaskType = 'lab' | 'nursing' | 'consultation' | 'order';

interface AssignStaffModalProps {
  taskType: AssignTaskType;
  taskId: string;
  patientName: string;
  taskDescription: string;
  zone?: string;
  slot?: string;
  currentAssignee?: string;
  onClose: () => void;
  onAssigned?: (assigneeName: string) => void;
}

export default function AssignStaffModal({
  taskType,
  taskId,
  patientName,
  taskDescription,
  zone,
  slot,
  currentAssignee,
  onClose,
  onAssigned,
}: AssignStaffModalProps) {
  const { fleet, doctors, riders, assignPhlebo, assignNurse, assignDoctor, assignDeliveryBoy } =
    useAdmin();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [sendNotification, setSendNotification] = useState(true);

  // Configuration by task type
  const config = useMemo(() => {
    switch (taskType) {
      case 'lab':
        return {
          title: 'Assign Phlebotomist',
          roleName: 'Phlebotomist',
          icon: TestTube,
          color: 'text-teal-700 bg-teal-50 border-teal-200',
          accentColor: 'bg-teal-600',
        };
      case 'nursing':
        return {
          title: 'Assign Home Nurse',
          roleName: 'Home Nurse Specialist',
          icon: HeartPulse,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          accentColor: 'bg-rose-600',
        };
      case 'consultation':
        return {
          title: 'Assign / Reassign Doctor',
          roleName: 'Authorized Physician',
          icon: Stethoscope,
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          accentColor: 'bg-indigo-600',
        };
      case 'order':
        return {
          title: 'Assign Delivery Rider',
          roleName: 'Express Delivery Partner',
          icon: Bike,
          color: 'text-sky-700 bg-sky-50 border-sky-200',
          accentColor: 'bg-sky-600',
        };
    }
  }, [taskType]);

  // Build eligible candidates list
  const candidates = useMemo(() => {
    const q = search.toLowerCase();

    if (taskType === 'lab') {
      const phlebos = fleet.filter((f) => f.role.toLowerCase().includes('phlebo'));
      return phlebos
        .map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          phone: p.phone,
          zone: p.currentZone,
          status: p.status,
          battery: p.battery,
          activeTask: p.activeTask,
          rating: 4.8,
          isMatchZone: zone ? p.currentZone.toLowerCase().includes(zone.toLowerCase()) : false,
        }))
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.zone.toLowerCase().includes(q) ||
            p.phone.includes(q)
        );
    }

    if (taskType === 'nursing') {
      const nurses = fleet.filter((f) => f.role.toLowerCase().includes('nurse'));
      return nurses
        .map((n) => ({
          id: n.id,
          name: n.name,
          role: n.role,
          phone: n.phone,
          zone: n.currentZone,
          status: n.status,
          battery: n.battery,
          activeTask: n.activeTask,
          rating: 4.9,
          isMatchZone: zone ? n.currentZone.toLowerCase().includes(zone.toLowerCase()) : false,
        }))
        .filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.zone.toLowerCase().includes(q) ||
            n.phone.includes(q)
        );
    }

    if (taskType === 'consultation') {
      const activeDocs = doctors.filter((d) => d.status === 'active');
      return activeDocs
        .map((d) => ({
          id: d.id,
          name: d.name,
          role: `${d.specialty} • ${d.qualification}`,
          phone: d.phone,
          zone: d.hospitalAffiliation,
          status: 'available',
          battery: 100,
          activeTask: `${d.totalConsults} Consultations Completed`,
          rating: d.rating,
          isMatchZone: false,
          specialty: d.specialty,
        }))
        .filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.role.toLowerCase().includes(q) ||
            d.zone.toLowerCase().includes(q)
        );
    }

    if (taskType === 'order') {
      return riders
        .map((r) => ({
          id: r.id,
          name: r.name,
          role: `${r.vehicleType} (${r.vehicleNumber})`,
          phone: r.phone,
          zone: r.currentZone,
          status: r.status,
          battery: r.battery,
          activeTask:
            r.activeOrdersCount > 0 ? `${r.activeOrdersCount} active order` : 'Available now',
          rating: r.rating,
          isMatchZone: zone ? r.currentZone.toLowerCase().includes(zone.toLowerCase()) : false,
        }))
        .filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.zone.toLowerCase().includes(q) ||
            r.role.toLowerCase().includes(q)
        );
    }

    return [];
  }, [taskType, fleet, doctors, riders, search, zone]);

  const handleAssign = () => {
    const chosen = candidates.find((c) => c.id === selectedId);
    if (!chosen) return;

    if (taskType === 'lab') {
      assignPhlebo(taskId, chosen.name, chosen.id);
    } else if (taskType === 'nursing') {
      assignNurse(taskId, chosen.name, chosen.id);
    } else if (taskType === 'consultation') {
      assignDoctor(taskId, chosen.name, chosen.id, (chosen as any).specialty);
    } else if (taskType === 'order') {
      assignDeliveryBoy(taskId, chosen.id);
    }

    if (onAssigned) onAssigned(chosen.name);
    onClose();
  };

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-modal overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${config.color} shadow-xs`}>
              <Icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">{config.title}</h2>
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {taskId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select whom to assign for <strong className="text-slate-800">{patientName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition shadow-xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Task Context Summary Card */}
        <div className="bg-teal-50/40 px-5 py-3 border-b border-teal-100/60 text-xs space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-slate-800 truncate">{taskDescription}</span>
            {currentAssignee && (
              <span className="shrink-0 text-[11px] text-slate-500">
                Current: <strong className="text-teal-700">{currentAssignee}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px] flex-wrap">
            {zone && (
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <MapPin size={12} className="text-teal-600" />
                <span>{zone}</span>
              </span>
            )}
            {slot && (
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <Calendar size={12} className="text-sky-600" />
                <span>{slot}</span>
              </span>
            )}
          </div>
        </div>

        {/* Search Filter */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${config.roleName.toLowerCase()} by name, zone, or contact…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>
        </div>

        {/* Candidates List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50/30">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Eligible Personnel ({candidates.length})
            </span>
            <span className="text-[11px] text-teal-700 font-medium">Tap to select assignee</span>
          </div>

          {candidates.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
              No qualified {config.roleName.toLowerCase()} found matching your search.
            </div>
          ) : (
            candidates.map((person, idx) => {
              const isSelected = selectedId === person.id;
              const isAvailable = person.status === 'available';
              const isCurrent = currentAssignee === person.name;

              return (
                <div
                  key={person.id}
                  onClick={() => setSelectedId(person.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 ring-1 ring-teal-500 shadow-xs'
                      : isCurrent
                      ? 'bg-emerald-50/50 border-emerald-400'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : isAvailable
                          ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {person.name.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{person.name}</h4>
                        {person.isMatchZone && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles size={10} /> Matching Zone
                          </span>
                        )}
                        {idx === 0 && isAvailable && !person.isMatchZone && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                            Top Recommendation
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                            Currently Assigned
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {person.role} • {person.phone}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin size={11} className="text-teal-600" />
                          <span className="truncate max-w-[200px]">{person.zone}</span>
                        </span>
                        {person.battery !== undefined && person.battery < 100 && (
                          <span className="flex items-center gap-1 text-emerald-600 font-mono font-semibold">
                            <BatteryCharging size={11} />
                            {person.battery}%
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Star size={11} className="fill-amber-400 text-amber-500" />
                          {person.rating}
                        </span>
                        <span className="text-slate-500">
                          Status:{' '}
                          <strong
                            className={
                              isAvailable ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'
                            }
                          >
                            {person.status.replace('_', ' ')}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Send dispatch notification &amp; route details to assigned personnel</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedId}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                selectedId
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserCheck size={14} />
              <span>Confirm Task Assignment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
