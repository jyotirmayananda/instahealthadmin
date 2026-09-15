'use client';

import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Zap,
  Bike,
  AlertTriangle,
  Navigation,
  BatteryCharging,
  Star,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminOrder, FleetStatus, RiderStatus } from '@/lib/types';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import AssignDeliveryModal from '@/components/AssignDeliveryModal';
import LiveOrderTrackingModal from '@/components/LiveOrderTrackingModal';
import AssignStaffModal, { type AssignTaskType } from '@/components/AssignStaffModal';

const ZONES = [
  'Current Operational Hub',
  'Central Express Corridor',
  'North Sector Corridor',
  'South Sector Corridor',
  'Express Highway Corridor',
];

export default function DispatchPage() {
  const {
    fleet,
    riders,
    orders,
    labs,
    nursing,
    consults,
    reassignFleet,
    setFleetStatus,
    reassignRiderZone,
    setRiderStatus,
    approveRider,
    rejectRider,
    counts,
  } = useAdmin();

  const [query, setQuery] = useState('');
  const [categoryTab, setCategoryTab] = useState<'all' | 'riders' | 'phlebo' | 'nurse'>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [assigningOrder, setAssigningOrder] = useState<AdminOrder | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<AdminOrder | null>(null);
  const [assigningTask, setAssigningTask] = useState<{
    taskType: AssignTaskType;
    taskId: string;
    patientName: string;
    taskDescription: string;
    zone?: string;
    slot?: string;
    currentAssignee?: string;
  } | null>(null);

  // Unassigned medicine orders requiring delivery dispatch
  const unassignedOrders = useMemo(() => {
    return orders.filter(
      (o) => !['delivered', 'cancelled'].includes(o.status) && !o.deliveryBoyId
    );
  }, [orders]);

  // Active in-transit delivery orders
  const inTransitOrders = useMemo(() => {
    const seen = new Set<string>();
    return orders.filter((o) => {
      if (o.status === 'out_for_delivery' && o.deliveryBoyId) {
        if (!seen.has(o.id)) {
          seen.add(o.id);
          return true;
        }
      }
      return false;
    });
  }, [orders]);

  // All tasks awaiting assignment across platform (orders, labs, nursing, consults)
  const unassignedTasks = useMemo(() => {
    const list: Array<{
      id: string;
      taskType: AssignTaskType;
      typeLabel: string;
      patientName: string;
      description: string;
      zone: string;
      slot: string;
      badgeClass: string;
    }> = [];

    const seenKeys = new Set<string>();

    orders
      .filter((o) => !['delivered', 'cancelled'].includes(o.status) && !o.deliveryBoyId)
      .forEach((o) => {
        const key = `order-${o.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: o.id,
            taskType: 'order',
            typeLabel: 'Medicine Delivery',
            patientName: o.patientName,
            description: o.items,
            zone: o.address,
            slot: o.placedAt,
            badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200',
          });
        }
      });

    labs
      .filter((l) => l.status === 'confirmed')
      .forEach((l) => {
        const key = `lab-${l.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: l.id,
            taskType: 'lab',
            typeLabel: 'Lab Sample Pickup',
            patientName: l.patientName,
            description: l.tests,
            zone: l.zone,
            slot: l.slot,
            badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200',
          });
        }
      });

    nursing
      .filter((n) => n.status === 'confirmed')
      .forEach((n) => {
        const key = `nursing-${n.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: n.id,
            taskType: 'nursing',
            typeLabel: 'Home Nursing Procedure',
            patientName: n.patientName,
            description: n.procedures,
            zone: n.zone,
            slot: n.slot,
            badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
          });
        }
      });

    consults
      .filter((c) => !c.doctorName || c.doctorName.toLowerCase().includes('unassigned'))
      .forEach((c) => {
        const key = `consult-${c.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: c.id,
            taskType: 'consultation',
            typeLabel: 'Physician Consult',
            patientName: c.patientName,
            description: `${c.specialty}: ${c.symptoms}`,
            zone: 'Teleconsult Room',
            slot: c.slot,
            badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
          });
        }
      });

    return list;
  }, [orders, labs, nursing, consults]);

  // Combined personnel list for display
  const combinedPersonnel = useMemo(() => {
    const q = query.toLowerCase();

    const riderItems = riders.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      role: `Delivery Rider (${r.vehicleType})`,
      category: 'riders' as const,
      currentZone: r.currentZone,
      status: r.status as string,
      battery: r.battery,
      activeTask:
        r.status === 'pending_approval'
          ? 'New Applicant • Pending Admin Verification'
          : r.activeOrdersCount > 0
          ? `Delivering ${r.activeOrdersCount} Medicine Order(s)`
          : 'Ready for Dispatch',
      vehicle: r.vehicleNumber,
      drivingLicense: r.drivingLicense,
      documents: r.documents,
      rating: r.rating,
      isRider: true,
    }));

    const fleetItems = fleet.map((f) => ({
      id: f.id,
      name: f.name,
      phone: f.phone,
      role: f.role,
      category: f.role.toLowerCase().includes('nurse') ? ('nurse' as const) : ('phlebo' as const),
      currentZone: f.currentZone,
      status: f.status as string,
      battery: f.battery,
      activeTask: f.activeTask,
      vehicle: undefined,
      drivingLicense: undefined,
      documents: undefined,
      rating: 4.8,
      isRider: false,
    }));

    const all = [...riderItems, ...fleetItems];

    return all.filter((p) => {
      const match =
        p.name.toLowerCase().includes(q) ||
        p.currentZone.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q);

      if (!match) return false;

      if (categoryTab !== 'all' && p.category !== categoryTab) {
        return false;
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          return p.status === 'pending_approval';
        }
        if (statusFilter === 'available') {
          return p.status === 'available';
        }
        if (statusFilter === 'active') {
          return p.status === 'delivering' || p.status === 'on_the_way' || p.status === 'in_visit';
        }
        if (statusFilter === 'offline') {
          return p.status === 'offline';
        }
      }

      return true;
    });
  }, [riders, fleet, query, categoryTab, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Fleet & Delivery Dispatch Desk"
        subtitle="Real-time control over express medicine delivery riders, home nurses, diagnostic phlebotomists, and zonal clusters."
        right={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
              <Zap size={14} className="text-emerald-600" />
              <span>{counts.availableRiders + counts.availableFleet} READY ON-CALL</span>
            </div>
          </div>
        }
      />

      {/* Spatial Grid Header Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-teal-100">
              NCR CENTRAL LIVE SPATIAL DISPATCH GRID
            </span>
          </div>
          <span className="text-xs font-mono text-teal-200 bg-white/10 px-2.5 py-0.5 rounded-full">
            25 km Express SLA Radius
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1 border-t border-white/10">
          <div>
            <span className="text-teal-200 block text-[11px] font-medium">Delivery Riders</span>
            <strong className="text-white text-lg font-extrabold">{riders.length} Active</strong>
          </div>
          <div>
            <span className="text-teal-200 block text-[11px] font-medium">Riders Free Now</span>
            <strong className="text-emerald-300 text-lg font-extrabold">{counts.availableRiders} Ready</strong>
          </div>
          <div>
            <span className="text-teal-200 block text-[11px] font-medium">Live In-Transit</span>
            <strong className="text-sky-300 text-lg font-extrabold">{counts.deliveringOrders} Trips</strong>
          </div>
          <div>
            <span className="text-teal-200 block text-[11px] font-medium">Clinical Fleet</span>
            <strong className="text-white text-lg font-extrabold">{fleet.length} Specialists</strong>
          </div>
        </div>
      </div>

      {/* Platform Tasks Needing Assignment (Orders, Labs, Nursing, Consults) */}
      {unassignedTasks.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Platform Tasks Needing Assignment ({unassignedTasks.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Click &quot;Assign&quot; to allocate qualified personnel immediately
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unassignedTasks.map((t) => (
              <div
                key={`task-${t.taskType}-${t.id}`}
                className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900">{t.id}</span>
                    <span className="text-xs text-slate-700 font-semibold">• {t.patientName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.badgeClass}`}>
                      {t.typeLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-1">{t.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin size={10} className="text-teal-600 shrink-0" />
                    <span className="truncate">{t.zone}</span>
                    <span>•</span>
                    <span className="truncate">{t.slot}</span>
                  </p>
                </div>
                <button
                  onClick={() =>
                    setAssigningTask({
                      taskType: t.taskType,
                      taskId: t.id,
                      patientName: t.patientName,
                      taskDescription: t.description,
                      zone: t.zone,
                      slot: t.slot,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <UserCheck size={14} />
                  <span>Assign</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live In-Transit Trips Strip */}
      {inTransitOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>Live In-Transit Deliveries ({inTransitOrders.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inTransitOrders.map((ord) => (
              <div
                key={`transit-${ord.id}`}
                className="bg-white p-4 rounded-2xl border border-teal-200 flex items-center justify-between gap-3 shadow-card hover:border-teal-300 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900">{ord.id}</span>
                    <span className="text-xs text-slate-700 font-bold">• {ord.patientName}</span>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      {ord.etaMinutes || 6}m ETA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Courier: {ord.deliveryBoyName} ({ord.riderVehicle})
                  </p>
                </div>
                <button
                  onClick={() => setTrackingOrder(ord)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Navigation size={13} className="animate-pulse text-teal-600" />
                  <span>Track GPS</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: `All Personnel (${riders.length + fleet.length})` },
          { id: 'riders', label: `Delivery Riders (${riders.length})` },
          { id: 'phlebo', label: 'Diagnostic Phlebotomists' },
          { id: 'nurse', label: 'Home Nurses' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              categoryTab === tab.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Status Filters */}
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search personnel by name, vehicle, or zone…"
        active={statusFilter}
        onFilter={setStatusFilter}
        filters={[
          { id: 'all', label: 'All Status' },
          { id: 'pending', label: 'Pending Approval', count: counts.pendingRiders },
          { id: 'available', label: 'Available' },
          { id: 'active', label: 'Active on Task' },
          { id: 'offline', label: 'Offline' },
        ]}
      />

      {/* Personnel Grid */}
      {combinedPersonnel.length === 0 ? (
        <EmptyNote text="No personnel match this filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {combinedPersonnel.map((person) => {
            const isAvail = person.status === 'available';
            const isPending = person.status === 'pending_approval';

            return (
              <div
                key={person.id}
                className={`bg-white border rounded-3xl p-5 space-y-4 hover:border-slate-300 hover:shadow-card-hover transition shadow-card ${
                  isPending ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        person.isRider
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      {person.isRider ? <Bike size={20} /> : person.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{person.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {person.role} • {person.phone}
                      </p>
                      {person.vehicle && (
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Vehicle: {person.vehicle}
                        </p>
                      )}
                      {person.drivingLicense && (
                        <p className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                          License: {person.drivingLicense}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge value={person.status} />
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin size={13} className="text-teal-600" /> {person.currentZone}
                    </span>
                    <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                      <BatteryCharging size={13} />
                      {person.battery}%
                    </span>
                  </div>
                  <p className="text-slate-800 font-semibold pt-1">Task: {person.activeTask}</p>
                </div>

                <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-slate-100">
                  {isPending ? (
                    <>
                      <ActionButton
                        tone="danger"
                        onClick={() => rejectRider(person.id)}
                      >
                        Reject
                      </ActionButton>
                      <ActionButton
                        tone="primary"
                        onClick={() => approveRider(person.id)}
                      >
                        Approve &amp; Onboard Rider
                      </ActionButton>
                    </>
                  ) : (
                    <>
                      {ZONES.filter((z) => z !== person.currentZone)
                        .slice(0, 1)
                        .map((z) => (
                          <ActionButton
                            key={z}
                            onClick={() => {
                              if (person.isRider) {
                                reassignRiderZone(person.id, z);
                              } else {
                                reassignFleet(person.id, z);
                              }
                            }}
                          >
                            Reassign zone
                          </ActionButton>
                        ))}

                      {isAvail ? (
                        <ActionButton
                          tone="warn"
                          onClick={() => {
                            if (person.isRider) {
                              setRiderStatus(person.id, 'offline');
                            } else {
                              setFleetStatus(person.id, 'offline');
                            }
                          }}
                        >
                          Set offline
                        </ActionButton>
                      ) : (
                        <ActionButton
                          tone="good"
                          onClick={() => {
                            if (person.isRider) {
                              setRiderStatus(person.id, 'available');
                            } else {
                              setFleetStatus(person.id, 'available');
                            }
                          }}
                        >
                          Set available
                        </ActionButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Delivery Partner Modal */}
      {assigningOrder && (
        <AssignDeliveryModal
          order={assigningOrder}
          onClose={() => setAssigningOrder(null)}
          onAssigned={() => {
            setTrackingOrder(assigningOrder);
          }}
        />
      )}

      {/* Live Order Tracking Modal */}
      {trackingOrder && (
        <LiveOrderTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onReassign={() => {
            const ord = trackingOrder;
            setTrackingOrder(null);
            setAssigningOrder(ord);
          }}
        />
      )}

      {/* Universal Task Assignee Picker Modal */}
      {assigningTask && (
        <AssignStaffModal
          taskType={assigningTask.taskType}
          taskId={assigningTask.taskId}
          patientName={assigningTask.patientName}
          taskDescription={assigningTask.taskDescription}
          zone={assigningTask.zone}
          slot={assigningTask.slot}
          currentAssignee={assigningTask.currentAssignee}
          onClose={() => setAssigningTask(null)}
        />
      )}
    </div>
  );
}
