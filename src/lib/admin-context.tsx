'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import type {
  AdminCatalogItem,
  AdminConsult,
  AdminCoupon,
  AdminDeliveryRider,
  AdminDoctor,
  AdminFleet,
  AdminKyc,
  AdminLab,
  AdminMedicine,
  AdminNursing,
  AdminOrder,
  AdminPatient,
  AdminPrescription,
  AdminSettlement,
  ConsultStatus,
  DoctorAccessStatus,
  DoctorPermissions,
  FleetStatus,
  KycStatus,
  LabStatus,
  NursingStatus,
  OrderStatus,
  PatientStatus,
  PrescriptionStatus,
  RiderStatus,
} from './types';
import {
  SEED_CATALOG,
  SEED_CONSULTS,
  SEED_COUPONS,
  SEED_DOCTORS,
  SEED_FLEET,
  SEED_KYC,
  SEED_LABS,
  SEED_MEDICINES,
  SEED_NURSING,
  SEED_ORDERS,
  SEED_PATIENTS,
  SEED_PRESCRIPTIONS,
  SEED_RIDERS,
  SEED_SETTLEMENTS,
} from './seed';

export interface AdminCounts {
  pendingOrders: number;
  pendingRx: number;
  openLabs: number;
  liveConsults: number;
  openNursing: number;
  pendingKyc: number;
  pendingPayouts: number;
  activePatients: number;
  availableFleet: number;
  // Doctor & Delivery Specific counts
  activeDoctors: number;
  pendingDoctors: number;
  suspendedDoctors: number;
  unassignedOrders: number;
  deliveringOrders: number;
  availableRiders: number;
  pendingRiders: number;

  // Medicine Specific counts
  totalMedicines: number;
  lowStockMedicines: number;
  outOfStockMedicines: number;
  rxMedicines: number;
}

interface AdminContextValue {
  orders: AdminOrder[];
  prescriptions: AdminPrescription[];
  labs: AdminLab[];
  consults: AdminConsult[];
  nursing: AdminNursing[];
  patients: AdminPatient[];
  catalog: AdminCatalogItem[];
  medicines: AdminMedicine[];
  coupons: AdminCoupon[];
  providers: AdminKyc[];
  fleet: AdminFleet[];
  settlements: AdminSettlement[];
  doctors: AdminDoctor[];
  riders: AdminDeliveryRider[];
  counts: AdminCounts;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  setPrescriptionStatus: (id: string, status: PrescriptionStatus) => void;
  setLabStatus: (id: string, status: LabStatus) => void;
  assignPhlebo: (id: string, name: string, phleboId?: string) => void;
  setConsultStatus: (id: string, status: ConsultStatus) => void;
  assignDoctor: (id: string, doctorName: string, doctorId?: string, specialty?: string) => void;
  setNursingStatus: (id: string, status: NursingStatus) => void;
  assignNurse: (id: string, name: string, nurseId?: string) => void;
  setPatientStatus: (id: string, status: PatientStatus) => void;
  setCatalogPrice: (id: string, price: number) => void;
  toggleCatalogStock: (id: string) => void;
  addCatalogItem: (item: Omit<AdminCatalogItem, 'id'>) => void;
  deleteCatalogItem: (id: string) => void;
  addMedicine: (item: Omit<AdminMedicine, 'id'>) => void;
  updateMedicine: (id: string, updates: Partial<AdminMedicine>) => void;
  deleteMedicine: (id: string) => void;
  toggleMedicineStock: (id: string) => void;
  updateMedicineStockCount: (id: string, count: number) => void;
  toggleCoupon: (id: string) => void;
  addCoupon: (item: Omit<AdminCoupon, 'id'>) => void;
  setKycStatus: (id: string, status: KycStatus) => void;
  reassignFleet: (id: string, zone: string) => void;
  setFleetStatus: (id: string, status: FleetStatus) => void;
  processPayout: (id: string) => void;

  // Doctor Access Management
  setDoctorStatus: (id: string, status: DoctorAccessStatus) => void;
  updateDoctorPermissions: (id: string, perms: Partial<DoctorPermissions>) => void;
  addDoctor: (doctor: Omit<AdminDoctor, 'id' | 'joinedAt' | 'totalConsults' | 'rating'>) => void;
  approveDoctor: (id: string) => void;
  rejectDoctor: (id: string) => void;

  // Nurse & Staff Approval
  approveNurse: (id: string) => void;

  // Delivery Boy & Live Tracking
  assignDeliveryBoy: (orderId: string, riderId: string) => void;
  reassignRiderZone: (riderId: string, zone: string) => void;
  setRiderStatus: (riderId: string, status: RiderStatus) => void;
  approveRider: (id: string) => void;
  rejectRider: (id: string) => void;
  updateOrderTracking: (
    orderId: string,
    coords: { lat: number; lng: number },
    etaMinutes: number,
    distanceKm: number
  ) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const OPEN_LAB: LabStatus[] = [
  'confirmed',
  'phlebotomist_assigned',
  'on_the_way',
  'sample_collected',
  'processing_in_lab',
];
const OPEN_NURSING: NursingStatus[] = ['confirmed', 'nurse_assigned', 'on_the_way', 'in_progress'];

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [prescriptions, setPrescriptions] = useState(SEED_PRESCRIPTIONS);
  const [labs, setLabs] = useState(SEED_LABS);
  const [consults, setConsults] = useState(SEED_CONSULTS);
  const [nursing, setNursing] = useState(SEED_NURSING);
  const [patients, setPatients] = useState(SEED_PATIENTS);
  const [catalog, setCatalog] = useState(SEED_CATALOG);
  const [medicines, setMedicines] = useState(SEED_MEDICINES);
  const [coupons, setCoupons] = useState(SEED_COUPONS);
  const [providers, setProviders] = useState(SEED_KYC);
  const [fleet, setFleet] = useState(SEED_FLEET);
  const [settlements, setSettlements] = useState(SEED_SETTLEMENTS);
  const [doctors, setDoctors] = useState(SEED_DOCTORS);
  const [riders, setRiders] = useState(SEED_RIDERS);

  const counts = useMemo<AdminCounts>(
    () => ({
      pendingOrders: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
      pendingRx: prescriptions.filter((p) => p.status === 'pending').length,
      openLabs: labs.filter((l) => OPEN_LAB.includes(l.status)).length,
      liveConsults: consults.filter((c) => c.status === 'scheduled' || c.status === 'live').length,
      openNursing: nursing.filter((n) => OPEN_NURSING.includes(n.status)).length,
      pendingKyc: providers.filter((p) => p.status === 'pending').length,
      pendingPayouts: settlements.filter((s) => s.status === 'pending').length,
      activePatients: patients.filter((p) => p.status === 'active').length,
      availableFleet: fleet.filter((f) => f.status === 'available').length,

      // Doctors
      activeDoctors: doctors.filter((d) => d.status === 'active').length,
      pendingDoctors: doctors.filter((d) => d.status === 'pending_approval').length,
      suspendedDoctors: doctors.filter((d) => d.status === 'suspended').length,

      // Deliveries
      unassignedOrders: orders.filter(
        (o) => !['delivered', 'cancelled'].includes(o.status) && !o.deliveryBoyId
      ).length,
      deliveringOrders: orders.filter((o) => o.status === 'out_for_delivery').length,
      availableRiders: riders.filter((r) => r.status === 'available').length,
      pendingRiders: riders.filter((r) => r.status === 'pending_approval').length,

      // Medicines
      totalMedicines: medicines.length,
      lowStockMedicines: medicines.filter((m) => m.inStock && m.stockCount > 0 && m.stockCount <= 20).length,
      outOfStockMedicines: medicines.filter((m) => !m.inStock || m.stockCount === 0).length,
      rxMedicines: medicines.filter((m) => m.isRx).length,
    }),
    [orders, prescriptions, labs, consults, nursing, providers, settlements, patients, fleet, doctors, riders, medicines]
  );

  // Sync registrations & live data from Supabase + Backend + Admin API
  useEffect(() => {
    let isSubscribed = true;

    async function syncAllData() {
      if (!isSubscribed) return;

      // 1. Sync from Admin Registrations API (which combines local and Supabase)
      try {
        const res = await fetch('/api/registrations');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          json.data.forEach((reg: any) => {
            if (reg.role === 'doctor') {
              setDoctors((prev) => {
                const exists = prev.find((d) => d.id === reg.id || d.councilRegNo === reg.councilRegNo);
                if (exists) {
                  return prev.map((d) =>
                    d.id === exists.id ? { ...d, status: reg.status === 'active' ? 'active' : d.status } : d
                  );
                }
                return [
                  {
                    id: reg.id,
                    name: reg.name,
                    email: reg.email || 'doctor@instahealth.app',
                    phone: reg.phone,
                    specialty: reg.specialty || 'General Medicine',
                    qualification: reg.qualification || 'MBBS',
                    councilRegNo: reg.councilRegNo || 'REG-PENDING',
                    experienceYears: 6,
                    hospitalAffiliation: reg.hospital || 'InstaHealth Network Clinic',
                    consultFee: 500,
                    rating: 5.0,
                    totalConsults: 0,
                    status: reg.status || 'pending_approval',
                    permissions: {
                      videoConsult: true,
                      audioConsult: true,
                      chatConsult: true,
                      digitalRxSigning: false,
                      emergencyOnCall: false,
                    },
                    joinedAt: reg.submittedAt || 'Today',
                  },
                  ...prev,
                ];
              });
            } else if (reg.role === 'nurse') {
              setProviders((prev) => {
                const exists = prev.find((p) => p.id === reg.id || p.councilRegNo === reg.councilRegNo);
                if (exists) {
                  return prev.map((p) =>
                    p.id === exists.id ? { ...p, status: reg.status === 'active' ? 'verified' : p.status } : p
                  );
                }
                return [
                  {
                    id: reg.id,
                    name: reg.name,
                    role: 'Home Nurse Specialist',
                    phone: reg.phone,
                    councilRegNo: reg.councilRegNo || 'INC-PENDING',
                    qualification: reg.qualification || 'B.Sc Nursing',
                    submittedAt: reg.submittedAt || 'Today',
                    status: reg.status === 'active' ? 'verified' : 'pending',
                    documents: reg.documents || ['Nursing License', 'Aadhaar Identity'],
                  },
                  ...prev,
                ];
              });
            } else if (reg.role === 'delivery') {
              setRiders((prev) => {
                const exists = prev.find(
                  (r) => r.id === reg.id || (reg.phone && r.phone === reg.phone) || r.name === reg.name
                );
                if (exists) {
                  return prev.map((r) =>
                    r.id === exists.id
                      ? {
                          ...r,
                          status:
                            reg.status === 'active' || reg.status === 'available'
                              ? 'available'
                              : reg.status === 'rejected'
                              ? 'offline'
                              : r.status,
                        }
                      : r
                  );
                }
                return [
                  {
                    id: reg.id,
                    name: reg.name,
                    phone: reg.phone,
                    email: reg.email,
                    drivingLicense: reg.councilRegNo || 'DL-PENDING',
                    vehicleNumber: reg.vehicleNumber || 'DL-01-EXP-001',
                    vehicleType: reg.vehicleType || 'Electric Bike',
                    currentZone: reg.zone || 'Sector 62 / Indirapuram Corridor',
                    status:
                      reg.status === 'active' || reg.status === 'available'
                        ? 'available'
                        : 'pending_approval',
                    battery: 100,
                    rating: 5.0,
                    activeOrdersCount: 0,
                    joinedAt: reg.submittedAt || 'Today',
                    documents: reg.documents || ['Driving License', 'Vehicle RC'],
                  },
                  ...prev,
                ];
              });
            }
          });
        }
      } catch (err) {
        // Handled silently
      }

      // 2. Direct Supabase Query for Provider KYC (including Delivery Partners)
      try {
        const { data: kycRows } = await supabase
          .from('provider_kyc')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (kycRows && Array.isArray(kycRows)) {
          kycRows.forEach((row) => {
            if (row.role === 'delivery') {
              setRiders((prev) => {
                const exists = prev.find((r) => r.id === row.id || (row.phone && r.phone === row.phone));
                const riderStatus =
                  row.status === 'verified'
                    ? 'available'
                    : row.status === 'rejected'
                    ? 'offline'
                    : 'pending_approval';

                if (exists) {
                  return prev.map((r) => (r.id === exists.id ? { ...r, status: riderStatus } : r));
                }
                return [
                  {
                    id: row.id,
                    name: row.name,
                    phone: row.phone || '',
                    email: row.email,
                    drivingLicense: row.council_reg_no || 'DL-PENDING',
                    vehicleNumber: 'UP-16-EV-9011',
                    vehicleType: 'Electric Bike',
                    currentZone: 'Sector 62 / Indirapuram Corridor',
                    status: riderStatus,
                    battery: 100,
                    rating: 5.0,
                    activeOrdersCount: 0,
                    joinedAt: 'Recently',
                    documents: Array.isArray(row.documents) ? row.documents : ['Driving License'],
                  },
                  ...prev,
                ];
              });
            }
          });
        }
      } catch (err) {
        // Fallback silently
      }

      // 3. Direct Supabase Query for Fleet Staff
      try {
        const { data: fleetRows } = await supabase.from('fleet_staff').select('*');
        if (fleetRows && Array.isArray(fleetRows)) {
          fleetRows.forEach((fl) => {
            if (fl.role === 'delivery') {
              setRiders((prev) => {
                const exists = prev.find((r) => r.id === fl.id || (fl.phone && r.phone === fl.phone));
                if (exists) return prev;
                return [
                  {
                    id: fl.id,
                    name: fl.name,
                    phone: fl.phone || '',
                    vehicleNumber: 'UP-16-BW-4921',
                    vehicleType: 'Electric Bike',
                    currentZone: fl.current_zone || 'Sector 62',
                    status: fl.status === 'pending_approval' ? 'pending_approval' : 'available',
                    battery: fl.battery_percent || 100,
                    rating: Number(fl.rating || 5.0),
                    activeOrdersCount: 0,
                    joinedAt: 'Active Staff',
                  },
                  ...prev,
                ];
              });
            }
          });
        }
      } catch (err) {
        // Fallback silently
      }

      // 3.5. Direct Supabase Query for Live Orders
      try {
        const { data: supaOrders } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('placed_at', { ascending: false });

        if (supaOrders && Array.isArray(supaOrders) && supaOrders.length > 0) {
          const mapped: AdminOrder[] = supaOrders.map((o: any) => {
            const addr = o.address || {};
            const addrParts: string[] = [];
            if (addr.line1) addrParts.push(addr.line1);
            if (addr.city) addrParts.push(addr.city);
            if (addr.state) addrParts.push(addr.state);
            if (addr.pincode) addrParts.push(addr.pincode);
            const addressStr =
              addrParts.length > 0
                ? addrParts.join(', ')
                : typeof addr === 'string' && addr
                ? addr
                : 'Current Location';

            const patientName =
              o.patient_name || (addr.label ? `Patient (${addr.label})` : 'Customer');
            const patientPhone =
              o.patient_phone || addr.phone || '+91 82490 23875';

            const itemsStr =
              Array.isArray(o.order_items) && o.order_items.length > 0
                ? o.order_items.map((i: any) => `${i.product_name || 'Medicine'} x${i.quantity}`).join(', ')
                : Array.isArray(o.items)
                ? o.items.map((i: any) => `${i.product?.name || i.name} x${i.quantity}`).join(', ')
                : 'Prescription Medicines';

            return {
              id: o.id,
              patientName,
              phone: patientPhone,
              items: itemsStr,
              total: Number(o.total || 0),
              payment: (o.payment_method === 'cod' ? 'cod' : 'razorpay') as 'razorpay' | 'cod' | 'upi',
              address: addressStr,
              placedAt: o.placed_at
                ? new Date(o.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
              status: (o.status || 'placed') as OrderStatus,
              needsRx: false,
              deliveryBoyId: o.delivery_boy_id,
              deliveryBoyName: o.delivery_boy_name,
              deliveryBoyPhone: o.delivery_boy_phone,
              riderVehicle: o.rider_vehicle,
              deliveryOtp: o.delivery_otp,
              dispatchedAt: o.dispatched_at,
              liveCoordinates:
                addr.latitude && addr.longitude
                  ? { lat: Number(addr.latitude), lng: Number(addr.longitude) }
                  : undefined,
            };
          });

          setOrders(mapped);
        }
      } catch (err) {
        // Fallback to backend API
      }

      // 4. Sync live orders & consults from Backend API (Port 5001)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api';
        const [ordersRes, consultsRes] = await Promise.allSettled([
          fetch(`${apiUrl}/orders`),
          fetch(`${apiUrl}/consultations`),
        ]);

        if (ordersRes.status === 'fulfilled') {
          const json = await ordersRes.value.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mappedOrders: AdminOrder[] = json.data.map((o: any) => {
              const addr = o.address || {};
              const addrParts: string[] = [];
              if (addr.line1) addrParts.push(addr.line1);
              if (addr.city) addrParts.push(addr.city);
              if (addr.state) addrParts.push(addr.state);
              if (addr.pincode) addrParts.push(addr.pincode);
              const addressStr =
                addrParts.length > 0
                  ? addrParts.join(', ')
                  : typeof addr === 'string' && addr
                  ? addr
                  : 'Current Location';

              const patientName =
                o.patient_name || (addr.label ? `Patient (${addr.label})` : 'Customer');
              const patientPhone =
                o.patient_phone || addr.phone || '+91 82490 23875';

              return {
                id: o.id,
                patientName,
                phone: patientPhone,
                items: Array.isArray(o.items) && o.items.length > 0
                  ? o.items.map((i: any) => `${i.product?.name || i.name} x${i.quantity}`).join(', ')
                  : 'Prescription Medicines',
                total: Number(o.total || 0),
                payment: (o.payment_method === 'cod' ? 'cod' : 'razorpay') as 'razorpay' | 'cod' | 'upi',
                address: addressStr,
                placedAt: o.placed_at
                  ? new Date(o.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now',
                status: (o.status || 'placed') as OrderStatus,
                needsRx: false,
                deliveryBoyId: o.delivery_boy_id || o.deliveryBoyId,
                deliveryBoyName: o.delivery_boy_name || o.deliveryBoyName,
                deliveryBoyPhone: o.delivery_boy_phone || o.deliveryBoyPhone,
                riderVehicle: o.rider_vehicle || o.riderVehicle,
                deliveryOtp: o.delivery_otp || o.deliveryOtp,
                dispatchedAt: o.dispatched_at || o.dispatchedAt,
                liveCoordinates:
                  addr.latitude && addr.longitude
                    ? { lat: Number(addr.latitude), lng: Number(addr.longitude) }
                    : undefined,
              };
            });

            setOrders((prev) => {
              const orderMap = new Map<string, AdminOrder>();
              mappedOrders.forEach((m) => {
                if (m && m.id) orderMap.set(m.id, m);
              });
              prev.forEach((p) => {
                if (p && p.id && !orderMap.has(p.id)) orderMap.set(p.id, p);
              });
              return Array.from(orderMap.values());
            });
          }
        }

        if (consultsRes.status === 'fulfilled') {
          const json = await consultsRes.value.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mappedConsults: AdminConsult[] = json.data.map((c: any) => ({
              id: c.id,
              patientName: c.patient_name || 'Priya Sharma',
              age: c.patient_age || 28,
              gender: 'Female' as const,
              phone: '+91 98765 43210',
              doctorName: c.doctorName || 'Dr. Rajesh Verma',
              specialty: c.doctorSpecialty || 'General Physician',
              type: (c.type || 'video') as 'video' | 'audio' | 'chat',
              slot: `${c.scheduled_date || 'Today'} • ${c.scheduled_time || '05:00 PM'}`,
              status: (c.status || 'scheduled') as ConsultStatus,
              fee: Number(c.fee || 499),
              notes: c.symptoms || 'General Consultation',
            }));

            setConsults((prev) => {
              const consultMap = new Map<string, AdminConsult>();
              prev.forEach((p) => {
                if (p && p.id) consultMap.set(p.id, p);
              });
              mappedConsults.forEach((m) => {
                if (m && m.id) consultMap.set(m.id, m);
              });
              return Array.from(consultMap.values());
            });
          }
        }
      } catch (err) {
        // Handled silently
      }

      // 5. Sync real registered patients from Supabase via Backend /patients endpoint
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api';
        const patientsRes = await fetch(`${apiUrl}/patients`);
        const patientsJson = await patientsRes.json();

        if (patientsJson.success && Array.isArray(patientsJson.data) && patientsJson.data.length > 0) {
          setPatients((prev) => {
            const patientMap = new Map<string, AdminPatient>();
            // Start with real Supabase patients
            patientsJson.data.forEach((p: AdminPatient) => {
              if (p && p.id) patientMap.set(p.id, p);
            });
            // Only keep seed patients not in Supabase
            prev.forEach((p) => {
              if (p && p.id && !patientMap.has(p.id)) patientMap.set(p.id, p);
            });
            return Array.from(patientMap.values());
          });
        }
      } catch (err) {
        // Fallback to Supabase direct query
        try {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, name, email, phone, created_at')
            .eq('role', 'patient')
            .order('created_at', { ascending: false });

          if (usersData && usersData.length > 0) {
            setPatients((prev) => {
              const patientMap = new Map<string, AdminPatient>();
              usersData.forEach((u: any) => {
                if (u && u.id) {
                  patientMap.set(u.id, {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone || '',
                    city: 'Live Location',
                    orders: 0,
                    spent: 0,
                    lastActive: new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                    status: 'active',
                  });
                }
              });
              prev.forEach((p) => {
                if (p && p.id && !patientMap.has(p.id)) patientMap.set(p.id, p);
              });
              return Array.from(patientMap.values());
            });
          }
        } catch {
          // Keep seed patients as fallback
        }
      }
    }

    // Initial sync
    syncAllData();

    // Fast polling every 3 seconds for live sync
    const interval = setInterval(syncAllData, 3000);

    // Supabase Realtime channel subscription
    let channel: any = null;
    try {
      channel = supabase
        .channel('admin-realtime-feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_kyc' }, () => {
          syncAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_staff' }, () => {
          syncAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          syncAllData();
        })
        .subscribe();
    } catch {
      // Realtime optional
    }

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const value: AdminContextValue = {
    orders,
    prescriptions,
    labs,
    consults,
    nursing,
    patients,
    catalog,
    medicines,
    coupons,
    providers,
    fleet,
    settlements,
    doctors,
    riders,
    counts,
    setOrderStatus: (id, status) => {
      setOrders((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api'}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    },
    setPrescriptionStatus: (id, status) => {
      setPrescriptions((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api'}/prescriptions/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    },
    setLabStatus: (id, status) => {
      setLabs((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api'}/labs/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    },
    assignPhlebo: (id, name, phleboId) =>
      setLabs((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                phlebotomist: name,
                phlebotomistId: phleboId,
                status: 'phlebotomist_assigned',
              }
            : r
        )
      ),
    setConsultStatus: (id, status) => {
      setConsults((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api'}/consultations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    },
    assignDoctor: (id, doctorName, doctorId, specialty) =>
      setConsults((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                doctorName,
                doctorId,
                specialty: specialty || r.specialty,
              }
            : r
        )
      ),
    setNursingStatus: (id, status) => {
      setNursing((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api'}/nursing/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    },
    assignNurse: (id, name, nurseId) =>
      setNursing((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                nurse: name,
                nurseId,
                status: 'nurse_assigned',
              }
            : r
        )
      ),
    setPatientStatus: (id, status) =>
      setPatients((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r))),
    setCatalogPrice: (id, price) =>
      setCatalog((rows) => rows.map((r) => (r.id === id ? { ...r, price } : r))),
    toggleCatalogStock: (id) =>
      setCatalog((rows) => rows.map((r) => (r.id === id ? { ...r, inStock: !r.inStock } : r))),
    addCatalogItem: (item) =>
      setCatalog((rows) => [{ ...item, id: `cat_${Date.now()}` }, ...rows]),
    deleteCatalogItem: (id) =>
      setCatalog((rows) => rows.filter((r) => r.id !== id)),

    // Medicine Inventory Management
    addMedicine: (item) => {
      const newId = `med_${Date.now()}`;
      const newMed: AdminMedicine = {
        ...item,
        id: newId,
        addedAt: item.addedAt || new Date().toISOString().split('T')[0],
      };
      setMedicines((rows) => [newMed, ...rows]);
      setCatalog((rows) => [
        {
          id: `cat_${newId}`,
          name: newMed.name,
          category: newMed.category,
          type: 'medicine',
          price: newMed.price,
          mrp: newMed.mrp,
          inStock: newMed.inStock,
        },
        ...rows,
      ]);
    },
    updateMedicine: (id, updates) => {
      setMedicines((rows) =>
        rows.map((m) => {
          if (m.id !== id) return m;
          const updated = { ...m, ...updates };
          if (updates.stockCount !== undefined) {
            updated.inStock = updates.stockCount > 0 && (updates.inStock !== undefined ? updates.inStock : m.inStock);
          }
          return updated;
        })
      );
      setCatalog((rows) =>
        rows.map((c) => {
          if (c.id === `cat_${id}` || (updates.name && c.name.toLowerCase() === updates.name.toLowerCase())) {
            return {
              ...c,
              name: updates.name ?? c.name,
              price: updates.price ?? c.price,
              mrp: updates.mrp ?? c.mrp,
              inStock: updates.inStock ?? c.inStock,
              category: updates.category ?? c.category,
            };
          }
          return c;
        })
      );
    },
    deleteMedicine: (id) => {
      setMedicines((rows) => {
        const target = rows.find((m) => m.id === id);
        if (target) {
          setCatalog((cRows) =>
            cRows.filter(
              (c) => c.id !== `cat_${id}` && c.name.toLowerCase() !== target.name.toLowerCase()
            )
          );
        }
        return rows.filter((m) => m.id !== id);
      });
    },
    toggleMedicineStock: (id) => {
      setMedicines((rows) =>
        rows.map((m) => {
          if (m.id !== id) return m;
          const nextInStock = !m.inStock;
          return {
            ...m,
            inStock: nextInStock,
            stockCount: nextInStock ? (m.stockCount === 0 ? 50 : m.stockCount) : 0,
          };
        })
      );
    },
    updateMedicineStockCount: (id, count) => {
      const validCount = Math.max(0, count);
      setMedicines((rows) =>
        rows.map((m) =>
          m.id === id
            ? {
                ...m,
                stockCount: validCount,
                inStock: validCount > 0,
              }
            : m
        )
      );
    },
    toggleCoupon: (id) =>
      setCoupons((rows) => rows.map((r) => (r.id === id ? { ...r, active: !r.active } : r))),
    addCoupon: (item) =>
      setCoupons((rows) => [{ ...item, id: `cp_${Date.now()}` }, ...rows]),
    setKycStatus: (id, status) =>
      setProviders((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r))),
    reassignFleet: (id, zone) =>
      setFleet((rows) => rows.map((r) => (r.id === id ? { ...r, currentZone: zone } : r))),
    setFleetStatus: (id, status) =>
      setFleet((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r))),
    processPayout: (id) =>
      setSettlements((rows) =>
        rows.map((r) =>
          r.id === id ? { ...r, status: 'processed', payoutDate: 'Today, via Direct NEFT' } : r
        )
      ),

    // Doctor management
    setDoctorStatus: (id, status) =>
      setDoctors((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                verifiedAt: status === 'active' ? (r.verifiedAt || 'Today') : r.verifiedAt,
              }
            : r
        )
      ),
    updateDoctorPermissions: (id, perms) =>
      setDoctors((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                permissions: { ...r.permissions, ...perms },
              }
            : r
        )
      ),
    addDoctor: (doctor) =>
      setDoctors((rows) => [
        {
          ...doctor,
          id: `doc_${Date.now()}`,
          joinedAt: 'Today',
          totalConsults: 0,
          rating: 5.0,
        },
        ...rows,
      ]),
    approveDoctor: (id: string) => {
      setDoctors((rows) =>
        rows.map((r) => (r.id === id ? { ...r, status: 'active', verifiedAt: 'Today (Approved)' } : r))
      );
      fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' }),
      }).catch(() => {});
    },
    rejectDoctor: (id: string) => {
      setDoctors((rows) =>
        rows.map((r) => (r.id === id ? { ...r, status: 'suspended' } : r))
      );
      fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      }).catch(() => {});
    },
    approveNurse: (id: string) => {
      setProviders((rows) =>
        rows.map((r) => (r.id === id ? { ...r, status: 'verified' } : r))
      );
      fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' }),
      }).catch(() => {});
    },

    // Delivery assignment & tracking
    assignDeliveryBoy: (orderId, riderId) => {
      const rider = riders.find((r) => r.id === riderId);
      if (!rider) return;

      const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const riderVehicle = `${rider.vehicleNumber} (${rider.vehicleType})`;

      setOrders((rows) =>
        rows.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            deliveryBoyId: rider.id,
            deliveryBoyName: rider.name,
            deliveryBoyPhone: rider.phone,
            riderVehicle,
            deliveryOtp: randomOtp,
            distanceKm: 2.1,
            etaMinutes: 10,
            status: 'out_for_delivery',
            dispatchedAt: 'Just now',
          };
        })
      );

      setRiders((rows) =>
        rows.map((r) =>
          r.id === riderId
            ? {
                ...r,
                status: 'delivering',
                activeOrdersCount: (r.activeOrdersCount || 0) + 1,
              }
            : r
        )
      );

      // Persist to Supabase
      Promise.resolve(
        supabase
          .from('orders')
          .update({
            delivery_boy_id: rider.id,
            delivery_boy_name: rider.name,
            delivery_boy_phone: rider.phone,
            rider_vehicle: riderVehicle,
            delivery_otp: randomOtp,
            status: 'out_for_delivery',
            dispatched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
      ).catch(() => {});

      // Persist to Backend API
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://instahealthbackend.onrender.com/api'}/orders/${orderId}/assign-rider`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: rider.id,
          riderName: rider.name,
          riderPhone: rider.phone,
          riderVehicle,
          deliveryOtp: randomOtp,
          status: 'out_for_delivery',
        }),
      }).catch(() => {});
    },

    reassignRiderZone: (riderId, zone) =>
      setRiders((rows) => rows.map((r) => (r.id === riderId ? { ...r, currentZone: zone } : r))),

    setRiderStatus: (riderId, status) =>
      setRiders((rows) => rows.map((r) => (r.id === riderId ? { ...r, status } : r))),

    approveRider: (id: string) => {
      setRiders((rows) =>
        rows.map((r) => (r.id === id ? { ...r, status: 'available' } : r))
      );
      fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' }),
      }).catch(() => {});
    },

    rejectRider: (id: string) => {
      setRiders((rows) =>
        rows.map((r) => (r.id === id ? { ...r, status: 'offline' } : r))
      );
      fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      }).catch(() => {});
    },

    updateOrderTracking: (orderId, coords, etaMinutes, distanceKm) =>
      setOrders((rows) =>
        rows.map((o) =>
          o.id === orderId
            ? {
                ...o,
                liveCoordinates: coords,
                etaMinutes,
                distanceKm,
              }
            : o
        )
      ),
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
