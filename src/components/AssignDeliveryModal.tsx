'use client';

import React, { useState } from 'react';
import {
  X,
  Bike,
  BatteryCharging,
  Star,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminOrder } from '@/lib/types';

interface AssignDeliveryModalProps {
  order: AdminOrder;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignDeliveryModal({
  order,
  onClose,
  onAssigned,
}: AssignDeliveryModalProps) {
  const { riders, assignDeliveryBoy, setOrderStatus } = useAdmin();
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [autoDispatch, setAutoDispatch] = useState(true);

  const filteredRiders = riders.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.vehicleNumber.toLowerCase().includes(q) ||
      r.currentZone.toLowerCase().includes(q)
    );
  });

  const handleAssign = () => {
    if (!selectedRiderId) return;
    assignDeliveryBoy(order.id, selectedRiderId);
    if (autoDispatch && order.status !== 'out_for_delivery') {
      setOrderStatus(order.id, 'out_for_delivery');
    }
    if (onAssigned) onAssigned();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-modal overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Assign Delivery Partner
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Order <span className="font-mono text-teal-700 font-bold">{order.id}</span> • {order.patientName} (₹{order.total})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition shadow-xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Order Details Mini Banner */}
        <div className="bg-teal-50/50 px-5 py-3 border-b border-teal-100 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700 min-w-0">
            <MapPin size={14} className="text-teal-600 shrink-0" />
            <span className="truncate font-medium">{order.address}</span>
          </div>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200/80 font-mono text-[10px] font-bold uppercase shadow-xs">
            {order.status.replace('_', ' ')}
          </span>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search rider name, vehicle number, or zone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>
        </div>

        {/* Riders List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50/30">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Available Fleet Partners ({filteredRiders.length})
            </p>
            <span className="text-[11px] text-teal-700 font-medium">Auto-matched by proximity</span>
          </div>

          {filteredRiders.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
              No delivery partners found matching your search.
            </div>
          ) : (
            filteredRiders.map((rider, index) => {
              const isSelected = selectedRiderId === rider.id;
              const isCurrentlyAssigned = order.deliveryBoyId === rider.id;
              const isAvailable = rider.status === 'available';

              return (
                <div
                  key={rider.id}
                  onClick={() => setSelectedRiderId(rider.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 ring-1 ring-teal-500 shadow-xs'
                      : isCurrentlyAssigned
                      ? 'bg-emerald-50/50 border-emerald-400'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : isAvailable
                          ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      <Bike size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{rider.name}</h4>
                        {index === 0 && isAvailable && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Recommended
                          </span>
                        )}
                        {isCurrentlyAssigned && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                            Current Rider
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-slate-700 font-semibold">{rider.vehicleNumber}</span>
                        <span>•</span>
                        <span>{rider.vehicleType}</span>
                        <span>•</span>
                        <span>{rider.phone}</span>
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin size={11} className="text-teal-600" />
                          {rider.currentZone}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-mono font-semibold">
                          <BatteryCharging size={12} />
                          {rider.battery}%
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Star size={11} className="fill-amber-400 text-amber-500" />
                          {rider.rating}
                        </span>
                        <span className="text-slate-500">
                          Active load: <strong className="text-slate-800">{rider.activeOrdersCount}</strong>
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

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoDispatch}
              onChange={(e) => setAutoDispatch(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Auto-mark order as &quot;Out for Delivery&quot; upon assignment</span>
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
              disabled={!selectedRiderId}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                selectedRiderId
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Bike size={14} />
              <span>Confirm & Dispatch Rider</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
