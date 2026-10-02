export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'verified'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PrescriptionStatus = 'pending' | 'verified' | 'rejected';
export type LabStatus =
  | 'confirmed'
  | 'phlebotomist_assigned'
  | 'on_the_way'
  | 'sample_collected'
  | 'processing_in_lab'
  | 'report_ready'
  | 'cancelled';
export type ConsultStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type NursingStatus =
  | 'confirmed'
  | 'nurse_assigned'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type KycStatus = 'pending' | 'verified' | 'rejected';
export type FleetStatus = 'available' | 'on_the_way' | 'in_visit' | 'offline';
export type PayoutStatus = 'pending' | 'processed';
export type PatientStatus = 'active' | 'suspended';
export type CatalogType = 'medicine' | 'lab_test' | 'procedure';

export type DoctorAccessStatus = 'active' | 'suspended' | 'pending_approval';

export interface DoctorPermissions {
  videoConsult: boolean;
  audioConsult: boolean;
  chatConsult: boolean;
  digitalRxSigning: boolean;
  emergencyOnCall: boolean;
}

export interface PlatformConsultationPricing {
  videoFee: number;
  audioFee: number;
  chatFee: number;
  currency: string;
  currencySymbol: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminDoctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qualification: string;
  councilRegNo: string;
  experienceYears: number;
  hospitalAffiliation: string;
  consultFee: number;
  videoFee?: number;
  audioFee?: number;
  chatFee?: number;
  rating: number;
  totalConsults: number;
  status: DoctorAccessStatus;
  permissions: DoctorPermissions;
  joinedAt: string;
  verifiedAt?: string;
  avatarUrl?: string;
  documents?: string[];
}

export type RiderStatus = 'available' | 'delivering' | 'offline' | 'pending_approval';

export interface AdminDeliveryRider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  drivingLicense?: string;
  vehicleNumber: string;
  vehicleType: 'Electric Bike' | 'Motorcycle' | 'Scooter';
  currentZone: string;
  status: RiderStatus;
  battery: number;
  rating: number;
  activeOrdersCount: number;
  avatar?: string;
  joinedAt: string;
  documents?: string[];
}

export interface OrderTrackingStep {
  status: string;
  title: string;
  description: string;
  time: string;
  done: boolean;
  current?: boolean;
}

export interface AdminOrder {
  id: string;
  patientName: string;
  phone: string;
  items: string;
  total: number;
  payment: 'razorpay' | 'cod' | 'upi';
  address: string;
  status: OrderStatus;
  placedAt: string;
  needsRx: boolean;
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  deliveryBoyPhone?: string;
  riderVehicle?: string;
  deliveryOtp?: string;
  distanceKm?: number;
  etaMinutes?: number;
  liveCoordinates?: { lat: number; lng: number };
  trackingSteps?: OrderTrackingStep[];
  dispatchedAt?: string;
}

export interface AdminPrescription {
  id: string;
  patientName: string;
  phone: string;
  patientAge?: number;
  fileName: string;
  fileUrl?: string;
  targetRole?: 'doctor' | 'nurse' | 'pharmacist' | 'all';
  targetProviderName?: string;
  uploadedAt: string;
  status: PrescriptionStatus;
  notes?: string;
  linkedOrderId?: string;
  verifiedBy?: string;
  auditNotes?: string;
}

export interface AdminLab {
  id: string;
  patientName: string;
  phone: string;
  tests: string;
  mode: 'home_collection' | 'center_visit';
  slot: string;
  zone: string;
  total: number;
  status: LabStatus;
  phlebotomist?: string;
  phlebotomistId?: string;
  reportUrl?: string;
  reportFileName?: string;
  reportUploadedAt?: string;
}

export interface AdminConsult {
  id: string;
  patientName: string;
  doctorName: string;
  doctorId?: string;
  specialty: string;
  type: 'video' | 'audio' | 'chat';
  slot: string;
  fee: number;
  status: ConsultStatus;
  symptoms: string;
}

export interface AdminNursing {
  id: string;
  patientName: string;
  phone: string;
  procedures: string;
  slot: string;
  zone: string;
  billed: number;
  status: NursingStatus;
  nurse?: string;
  nurseId?: string;
}

export interface AdminPatient {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  lastActive: string;
  status: PatientStatus;
}

export interface AdminCatalogItem {
  id: string;
  name: string;
  category: string;
  type: CatalogType;
  price: number;
  mrp: number;
  inStock: boolean;
  turnaroundHours?: number;
}

export type MedicineForm =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Injection'
  | 'Ointment'
  | 'Drops'
  | 'Inhaler'
  | 'Gel';

export interface AdminMedicine {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  dosageForm: MedicineForm | string;
  strength?: string;
  packSize: string;
  price: number;
  mrp: number;
  isRx: boolean;
  inStock: boolean;
  stockCount: number;
  batchNumber: string;
  expiryDate: string;
  description: string;
  imageUrl?: string;
  images?: string[];
  storageConditions?: string;
  sideEffects?: string;
  addedAt?: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderValue: number;
  active: boolean;
}

export interface AdminKyc {
  id: string;
  name: string;
  role: string;
  phone: string;
  councilRegNo: string;
  qualification: string;
  submittedAt: string;
  status: KycStatus;
  documents: string[];
}

export interface AdminFleet {
  id: string;
  name: string;
  role: string;
  phone: string;
  currentZone: string;
  status: FleetStatus;
  activeTask: string;
  battery: number;
}

export interface AdminSettlement {
  id: string;
  providerName: string;
  role: string;
  period: string;
  totalVisits: number;
  grossAmount: number;
  platformCommission: number;
  netPayout: number;
  status: PayoutStatus;
  payoutDate?: string;
}
