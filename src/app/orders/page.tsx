'use client';

import React, { useMemo, useState } from 'react';
import {
  Bike,
  Navigation,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Phone,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminOrder, OrderStatus } from '@/lib/types';
import { ActionButton, EmptyNote, FilterBar, PageHeader, StatusBadge } from '@/components/ui';
import AssignDeliveryModal from '@/components/AssignDeliveryModal';
import LiveOrderTrackingModal from '@/components/LiveOrderTrackingModal';

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed',
  confirmed: 'verified',
  verified: 'packed',
  packed: 'shipped',
  shipped: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  placed: 'Confirm Order',
  confirmed: 'Verify Rx',
  verified: 'Mark Packed',
  packed: 'Ship Order',
  shipped: 'Out for Delivery',
  out_for_delivery: 'Mark Delivered',
};

export default function OrdersPage() {
  const { orders, setOrderStatus, counts } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('open');

  // Modal states
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<AdminOrder | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<AdminOrder | null>(null);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    const seen = new Set<string>();
    return orders.filter((o) => {
      if (!o || !o.id || seen.has(o.id)) return false;
      seen.add(o.id);

      const match =
        o.id.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.items.toLowerCase().includes(q) ||
        (o.deliveryBoyName && o.deliveryBoyName.toLowerCase().includes(q));
      if (!match) return false;

      if (filter === 'open') return !['delivered', 'cancelled'].includes(o.status);
      if (filter === 'all') return true;
      if (filter === 'unassigned') {
        return !['delivered', 'cancelled'].includes(o.status) && !o.deliveryBoyId;
      }
      return o.status === filter;
    });
  }, [orders, query, filter]);

  // Keep current active tracking order in sync with admin context updates
  const currentTrackingOrder = useMemo(() => {
    if (!activeTrackingOrder) return null;
    return orders.find((o) => o.id === activeTrackingOrder.id) || activeTrackingOrder;
  }, [orders, activeTrackingOrder]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Orders & Dispatch Desk"
        subtitle="Manage end-to-end pharmacy fulfillment, assign delivery riders, and monitor real-time live GPS tracking to customer doorsteps."
        right={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono border border-slate-200">
              {rows.length} SHOWN
            </span>
            {counts.unassignedOrders > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold font-mono border border-amber-200 flex items-center gap-1.5 shadow-xs">
                <AlertTriangle size={12} className="text-amber-600" />
                {counts.unassignedOrders} NEED RIDER
              </span>
            )}
          </div>
        }
      />

      {/* Mini Ops Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Open Orders</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{counts.pendingOrders}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Unassigned Riders</span>
          <span
            className={`text-2xl font-extrabold mt-0.5 block ${
              counts.unassignedOrders > 0 ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {counts.unassignedOrders}
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">In-Transit Live GPS</span>
          <span className="text-2xl font-extrabold text-teal-600 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            {counts.deliveringOrders}
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Fleet</span>
          <span className="text-2xl font-extrabold text-indigo-600 mt-0.5 block">{counts.availableRiders}</span>
        </div>
      </div>

      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search order id, patient, medicine, rider…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'open', label: 'Open', count: counts.pendingOrders },
          { id: 'all', label: 'All' },
          { id: 'unassigned', label: 'Needs Rider', count: counts.unassignedOrders },
          { id: 'out_for_delivery', label: 'In-Transit (Live)', count: counts.deliveringOrders },
          { id: 'placed', label: 'New Placed' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote text="No orders match this filter." />
      ) : (
        <div className="space-y-4">
          {rows.map((o) => {
            const hasDeliveryBoy = Boolean(o.deliveryBoyId);
            const isDelivered = o.status === 'delivered';
            const isCancelled = o.status === 'cancelled';
            const isLive = o.status === 'out_for_delivery';

            return (
              <div
                key={o.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 hover:border-slate-300 hover:shadow-card-hover transition shadow-card"
              >
                {/* Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">{o.id}</h3>
                      <StatusBadge value={o.status} />
                      {o.needsRx && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Rx Required
                        </span>
                      )}
                      {isLive && (
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                          Live GPS Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {o.patientName} • {o.phone} • Placed: {o.placedAt}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xl font-black text-slate-900">₹{o.total}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">{o.payment}</p>
                  </div>
                </div>

                {/* Items & Address */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-3.5 text-xs text-slate-700 space-y-1.5">
                  <p className="font-semibold text-slate-900">{o.items}</p>
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <MapPin size={13} className="text-teal-600 shrink-0" />
                    <span>{o.address}</span>
                  </p>
                </div>

                {/* Delivery Boy & Tracking Section */}
                <div className="p-3.5 rounded-2xl bg-teal-50/30 border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {hasDeliveryBoy ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <Bike size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Partner: {o.deliveryBoyName}
                          </span>
                          {o.deliveryOtp && (
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              OTP: {o.deliveryOtp}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {o.riderVehicle || 'Delivery Partner'} • {o.deliveryBoyPhone}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-amber-800 text-xs font-medium">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                      <span>No delivery partner assigned yet for doorstep dispatch.</span>
                    </div>
                  )}

                  {/* Rider Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {hasDeliveryBoy ? (
                      <>
                        <button
                          onClick={() => setActiveTrackingOrder(o)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Navigation size={13} className="animate-pulse text-teal-600" />
                          <span>Live GPS Track</span>
                        </button>
                        {!isDelivered && !isCancelled && (
                          <button
                            onClick={() => setAssigningOrder(o)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition shadow-xs"
                          >
                            Reassign
                          </button>
                        )}
                      </>
                    ) : (
                      !isDelivered &&
                      !isCancelled && (
                        <button
                          onClick={() => setAssigningOrder(o)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Bike size={14} />
                          <span>Assign Delivery Boy</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-slate-100">
                  {NEXT[o.status] && (
                    <ActionButton tone="good" onClick={() => setOrderStatus(o.id, NEXT[o.status]!)}>
                      {NEXT_LABEL[o.status]}
                    </ActionButton>
                  )}
                  {!isDelivered && !isCancelled && (
                    <ActionButton tone="danger" onClick={() => setOrderStatus(o.id, 'cancelled')}>
                      Cancel Order
                    </ActionButton>
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
            setActiveTrackingOrder(assigningOrder);
          }}
        />
      )}

      {/* Live Order Tracking Modal */}
      {currentTrackingOrder && (
        <LiveOrderTrackingModal
          order={currentTrackingOrder}
          onClose={() => setActiveTrackingOrder(null)}
          onReassign={() => {
            const ord = currentTrackingOrder;
            setActiveTrackingOrder(null);
            setAssigningOrder(ord);
          }}
        />
      )}
    </div>
  );
}
