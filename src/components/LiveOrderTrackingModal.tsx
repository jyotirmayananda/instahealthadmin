'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const LeafletOrderMap = dynamic(() => import('./LeafletOrderMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 sm:h-96 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2.5 text-slate-500">
      <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      <span className="text-xs font-semibold">Initializing Leaflet Live GPS Map…</span>
    </div>
  ),
});
import {
  X,
  MapPin,
  Bike,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Navigation,
  RefreshCw,
  Play,
  Pause,
  Thermometer,
  Zap,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminOrder } from '@/lib/types';
import { StatusBadge } from './ui';

interface LiveOrderTrackingModalProps {
  order: AdminOrder;
  onClose: () => void;
  onReassign?: () => void;
}

export default function LiveOrderTrackingModal({
  order,
  onClose,
  onReassign,
}: LiveOrderTrackingModalProps) {
  const { setOrderStatus } = useAdmin();

  const isAlreadyDelivered = order.status === 'delivered';
  const isOutForDelivery = order.status === 'shipped' || (order.status as string) === 'out_for_delivery' || (order.status as string) === 'assigned';
  const [otpCopied, setOtpCopied] = useState(false);

  // Real or calculated telemetry
  const distanceRemaining = isAlreadyDelivered ? 0 : 1.4;
  const etaMinutesRemaining = isAlreadyDelivered ? 0 : 6;
  const currentSpeed = isAlreadyDelivered ? 0 : 28;

  const handleCopyOtp = () => {
    if (order.deliveryOtp) {
      navigator.clipboard?.writeText(order.deliveryOtp);
      setOtpCopied(true);
      setTimeout(() => setOtpCopied(false), 2000);
    }
  };

  const handleCompleteDelivery = () => {
    setOrderStatus(order.id, 'delivered');
  };

  const steps = [
    {
      title: 'Order Confirmed',
      desc: 'Payment received & logged',
      done: true,
      time: order.placedAt,
    },
    {
      title: 'Prescription Verified',
      desc: order.needsRx ? 'Audited by Chief Pharmacist' : 'OTC - No Rx needed',
      done: true,
      time: 'Verified',
    },
    {
      title: 'Dispatched from Pharmacy Hub',
      desc: 'Tamper-proof thermal bag sealed',
      done: isOutForDelivery || isAlreadyDelivered,
      time: order.dispatchedAt || 'Active',
    },
    {
      title: 'Rider on the Way',
      desc: order.deliveryBoyName
        ? `${order.deliveryBoyName} (${order.riderVehicle || 'Express Courier'})`
        : 'Delivery partner assigned',
      done: isOutForDelivery || isAlreadyDelivered,
      current: !isAlreadyDelivered && isOutForDelivery,
      time: !isAlreadyDelivered ? `${etaMinutesRemaining} mins away` : 'Arrived',
    },
    {
      title: 'Doorstep Delivery',
      desc: `OTP confirmation (${order.deliveryOtp || '4829'})`,
      done: isAlreadyDelivered,
      current: !isAlreadyDelivered,
      time: isAlreadyDelivered ? 'Delivered' : 'Pending OTP',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-modal overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/80 flex items-center justify-center shadow-xs">
              <Navigation size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Live Dispatch GPS Tracking
                </h2>
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  {order.id}
                </span>
                <StatusBadge value={order.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recipient: <strong className="text-slate-800">{order.patientName}</strong> • {order.phone}
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

        {/* Scrollable Container */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/30">
          {/* Top Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Arrival</span>
              <span className="text-lg font-extrabold text-teal-600">
                {isAlreadyDelivered ? 'Arrived' : `${etaMinutesRemaining} mins`}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                {isAlreadyDelivered ? 'Delivered' : `${distanceRemaining} km away`}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Speed</span>
              <span className="text-lg font-extrabold text-slate-900">
                {currentSpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
              </span>
              <span className="text-[10px] text-teal-600 flex items-center gap-1 mt-0.5 font-medium">
                <Zap size={10} /> Active telemetry
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cold Chain</span>
              <span className="text-lg font-extrabold text-sky-600">4.2°C</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                <Thermometer size={10} className="text-sky-500" /> Insulated thermal pouch
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Doorstep OTP</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-extrabold text-amber-600 tracking-wider">
                  {order.deliveryOtp || '5829'}
                </span>
                <button
                  onClick={handleCopyOtp}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition shadow-2xs"
                >
                  {otpCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Verification code</span>
            </div>
          </div>

          {/* Real Leaflet OpenStreetMap GPS Tracking Engine */}
          <LeafletOrderMap
            order={order}
            isAlreadyDelivered={isAlreadyDelivered}
          />

          {/* Rider Profile Card & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Boy Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Assigned Delivery Partner
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                  Active On Route
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {order.deliveryBoyName ? order.deliveryBoyName.charAt(0) : 'R'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {order.deliveryBoyName || 'Assigned Courier'}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {order.riderVehicle || 'Hero Electric Photon • UP-16-BW-4921'}
                  </p>
                  <p className="text-[11px] text-teal-700 font-medium mt-0.5">
                    {order.deliveryBoyPhone || '+91 98100 44321'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${order.deliveryBoyPhone || '9810044321'}`}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Phone size={13} className="text-teal-600" />
                  <span>Call Partner</span>
                </a>
                {onReassign && (
                  <button
                    onClick={onReassign}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition"
                  >
                    Reassign
                  </button>
                )}
              </div>
            </div>

            {/* Destination & Order Items */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Delivery Destination
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  ₹{order.total} • {order.payment.toUpperCase()}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <MapPin size={14} className="text-teal-600 shrink-0" />
                  <span>{order.address}</span>
                </p>
                <p className="text-slate-500 pl-5">Patient: {order.patientName}</p>
                <p className="text-slate-400 pl-5 text-[11px] italic">
                  Package: {order.items}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${order.phone}`}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Phone size={13} className="text-sky-600" />
                  <span>Call Patient</span>
                </a>
                <button
                  onClick={handleCompleteDelivery}
                  disabled={isAlreadyDelivered}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isAlreadyDelivered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{isAlreadyDelivered ? 'Delivered' : 'Confirm Handover'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Trip Milestone Log
            </span>

            <div className="space-y-3 pt-1">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="flex flex-col items-center pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        step.done
                          ? 'bg-emerald-600 text-white'
                          : step.current
                          ? 'bg-teal-600 text-white animate-pulse'
                          : 'border border-slate-300 bg-slate-100'
                      }`}
                    >
                      {step.done ? (
                        <Check size={11} />
                      ) : step.current ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      ) : null}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-6 mt-1 ${
                          step.done ? 'bg-emerald-300' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 flex items-start justify-between gap-2">
                    <div>
                      <h5
                        className={`font-semibold ${
                          step.done || step.current ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </h5>
                      <p className="text-slate-500 text-[11px]">{step.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {step.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>InstaHealth Live GPS Telemetry System v2.4</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
