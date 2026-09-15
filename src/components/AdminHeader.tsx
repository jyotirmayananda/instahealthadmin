'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  Menu,
  Search,
  Building2,
  ChevronDown,
  Plus,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Bike,
  ShoppingBag,
  DollarSign,
  HeartPulse,
  TestTube,
  X,
  ExternalLink,
  LocateFixed,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminHeader({ onMenu }: { onMenu?: () => void }) {
  const router = useRouter();
  const { counts, orders, prescriptions, doctors, providers, riders, settlements } = useAdmin();

  // -------------------------------------------------------------------------
  // Location Detection & Hub Switcher
  // -------------------------------------------------------------------------
  const [currentHub, setCurrentHub] = useState('Current Live Location');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [customCityInput, setCustomCityInput] = useState('');
  const locationRef = useRef<HTMLDivElement>(null);

  // Auto-detect or restore saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem('admin_hub_location');
    if (saved) {
      setCurrentHub(saved);
      return;
    }
    // Attempt auto-detect on first load
    detectCurrentLocation();
  }, []);

  const detectCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setCurrentHub('Current Live Location');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision || 'Current GPS';
            const formatted = `${city} • Live Hub`;
            setCurrentHub(formatted);
            localStorage.setItem('admin_hub_location', formatted);
          } else {
            setCurrentHub('Current Live Location');
          }
        } catch {
          setCurrentHub('Current Live Location');
        } finally {
          setIsDetectingLocation(false);
          setShowLocationDropdown(false);
        }
      },
      () => {
        // Fallback if permission dismissed
        setCurrentHub('Current Live Location');
        setIsDetectingLocation(false);
      },
      { timeout: 6000 }
    );
  };

  const selectHub = (hub: string) => {
    setCurrentHub(hub);
    localStorage.setItem('admin_hub_location', hub);
    setShowLocationDropdown(false);
  };

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCityInput.trim()) {
      const formatted = `${customCityInput.trim()} • Operating Zone`;
      selectHub(formatted);
      setCustomCityInput('');
    }
  };

  // -------------------------------------------------------------------------
  // Notifications Popover
  // -------------------------------------------------------------------------
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'staff' | 'orders'>('all');
  const [isDismissed, setIsDismissed] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Compile real live alerts
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'staff' | 'orders' | 'rx';
      title: string;
      description: string;
      time: string;
      href: string;
      tone: 'danger' | 'warning' | 'info';
      icon: any;
      badgeText: string;
    }> = [];

    // 1. Pending Delivery Riders
    riders
      .filter((r) => r.status === 'pending_approval')
      .forEach((r) => {
        list.push({
          id: `notif_rider_${r.id}`,
          category: 'staff',
          title: `Delivery Partner Application: ${r.name}`,
          description: `${r.vehicleType || 'Electric Bike'} (${r.vehicleNumber || 'DL-KA'}) • Zone: ${r.currentZone}`,
          time: 'Awaiting Review',
          href: '/dispatch',
          tone: 'warning',
          icon: Bike,
          badgeText: 'Rider Onboarding',
        });
      });

    // 2. Pending Doctor Credential Audits
    doctors
      .filter((d) => d.status === 'pending_approval')
      .forEach((d) => {
        list.push({
          id: `notif_doc_${d.id}`,
          category: 'staff',
          title: `Doctor Credential Audit: ${d.name}`,
          description: `${d.specialty} • Council Reg: ${d.councilRegNo}`,
          time: 'Pending KYC',
          href: '/doctors',
          tone: 'danger',
          icon: UserCheck,
          badgeText: 'Medical Council',
        });
      });

    // 3. Pending Healthcare Staff KYC
    providers
      .filter((p) => p.status === 'pending')
      .forEach((p) => {
        list.push({
          id: `notif_prov_${p.id}`,
          category: 'staff',
          title: `Nurse & Staff KYC: ${p.name}`,
          description: `${p.role} • Reg: ${p.councilRegNo}`,
          time: 'Pending Audit',
          href: '/providers',
          tone: 'warning',
          icon: UserCheck,
          badgeText: 'Staff KYC',
        });
      });

    // 4. Pending Prescriptions
    prescriptions
      .filter((p) => p.status === 'pending')
      .forEach((p) => {
        list.push({
          id: `notif_rx_${p.id}`,
          category: 'rx',
          title: `Prescription Verification Required`,
          description: `Uploaded for ${p.patientName} (${p.fileName || 'Rx Document'}) • Needs audit`,
          time: p.uploadedAt || 'Pending',
          href: '/prescriptions',
          tone: 'danger',
          icon: FileText,
          badgeText: 'Rx Audit',
        });
      });

    // 5. Unassigned Orders
    orders
      .filter((o) => !['delivered', 'cancelled'].includes(o.status) && !o.deliveryBoyId)
      .slice(0, 3)
      .forEach((o) => {
        list.push({
          id: `notif_order_${o.id}`,
          category: 'orders',
          title: `Assign Delivery Courier: ${o.id}`,
          description: `${o.patientName} • ${o.address} (₹${o.total})`,
          time: o.placedAt || 'Just now',
          href: '/orders',
          tone: 'warning',
          icon: ShoppingBag,
          badgeText: 'Order Dispatch',
        });
      });

    // 6. Pending Payouts
    settlements
      .filter((s) => s.status === 'pending')
      .slice(0, 2)
      .forEach((s) => {
        list.push({
          id: `notif_set_${s.id}`,
          category: 'orders',
          title: `Payout Disbursement: ${s.providerName}`,
          description: `₹${s.netPayout.toLocaleString('en-IN')} pending for ${s.period}`,
          time: 'Ready for processing',
          href: '/finance',
          tone: 'info',
          icon: DollarSign,
          badgeText: 'Finance',
        });
      });

    return list;
  }, [riders, doctors, providers, prescriptions, orders, settlements]);

  const filteredNotifications = useMemo(() => {
    if (activeNotifTab === 'all') return notifications;
    if (activeNotifTab === 'staff') return notifications.filter((n) => n.category === 'staff');
    return notifications.filter((n) => n.category === 'orders' || n.category === 'rx');
  }, [notifications, activeNotifTab]);

  const unreadCount = isDismissed ? 0 : notifications.length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenu}
          className="lg:hidden w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
        >
          <Menu size={18} />
        </button>

        {/* Global Quick Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-60 lg:w-72 text-xs text-slate-400 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search patients, Rx, orders..."
            className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 w-full text-xs"
          />
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Live Ops Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">
            Live Ops • {counts.availableFleet} Fleet Free • {counts.pendingOrders} Open Orders
          </span>
          <span className="sm:hidden">Live Ops</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Dynamic Location / Express Hub Pill with Dropdown */}
        <div className="relative" ref={locationRef}>
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 transition shadow-xs"
            title="Click to switch operating hub or auto-detect current location"
          >
            <MapPin size={14} className="text-teal-600 shrink-0" />
            <span className="max-w-[140px] sm:max-w-[180px] truncate">{currentHub}</span>
            <ChevronDown size={12} className="text-slate-400 shrink-0 ml-0.5" />
          </button>

          {/* Location Dropdown Modal */}
          {showLocationDropdown && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-teal-600" />
                  <span className="text-xs font-bold text-slate-900">Select Operating Hub</span>
                </div>
                <button
                  onClick={() => setShowLocationDropdown(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Auto-detect button */}
              <button
                onClick={detectCurrentLocation}
                disabled={isDetectingLocation}
                className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center justify-center gap-2 border border-teal-200 shadow-xs"
              >
                {isDetectingLocation ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-teal-600" />
                    <span>Detecting GPS Location…</span>
                  </>
                ) : (
                  <>
                    <LocateFixed size={13} className="text-teal-600" />
                    <span>Detect My Current Location</span>
                  </>
                )}
              </button>

              {/* Active Zone Status */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Operating Location Status
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {currentHub}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Using real GPS coordinates. Tap detect above or enter a custom city below.
                </p>
              </div>

              {/* Custom City input */}
              <form onSubmit={handleCustomCitySubmit} className="pt-2 border-t border-slate-100 flex gap-1.5">
                <input
                  type="text"
                  placeholder="Enter city / hub name…"
                  value={customCityInput}
                  onChange={(e) => setCustomCityInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Set
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Quick Action Button */}
        <Link
          href="/orders"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus size={14} />
          <span>New Dispatch</span>
        </Link>

        {/* Notifications Bell with Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showNotifications) setIsDismissed(false);
            }}
            className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            aria-label="Platform Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Floating Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Ops Alerts &amp; Queue</h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono">
                    {notifications.length} Pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="text-[11px] text-slate-400 hover:text-teal-700 font-medium"
                  >
                    Mark Read
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification Filter Chips */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${notifications.length})` },
                  { id: 'staff', label: 'Riders & Staff' },
                  { id: 'orders', label: 'Orders & Rx' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveNotifTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      activeNotifTab === tab.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle2 size={28} className="text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">All caught up!</p>
                    <p className="text-[11px] text-slate-400">No pending audits or dispatch alerts.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const IconComponent = notif.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl border transition flex items-start gap-3 ${
                          notif.tone === 'danger'
                            ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                            : notif.tone === 'warning'
                            ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.tone === 'danger'
                              ? 'bg-rose-100 text-rose-700'
                              : notif.tone === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {notif.description}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {notif.badgeText}
                            </span>
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                router.push(notif.href);
                              }}
                              className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition"
                            >
                              <span>Take Action</span>
                              <ExternalLink size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All Queues Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  href="/dispatch"
                  onClick={() => setShowNotifications(false)}
                  className="font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Bike size={12} />
                  <span>Fleet Desk</span>
                </Link>
                <Link
                  href="/providers"
                  onClick={() => setShowNotifications(false)}
                  className="font-bold text-slate-600 hover:text-slate-900"
                >
                  Staff KYC Desk ➔
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">Supervisor</p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">Admin Ops</p>
          </div>
        </div>
      </div>
    </header>
  );
}
