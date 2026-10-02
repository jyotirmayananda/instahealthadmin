'use client';

import React, { useMemo, useState } from 'react';
import {
  Pill,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Edit3,
  Trash2,
  Eye,
  Layers,
  Package,
  Calendar,
  Building2,
  Sparkles,
  RefreshCw,
  X,
  Check,
  ShieldAlert,
  ArrowUpDown,
  Download,
  Filter,
  TrendingUp,
  Droplet,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Clock,
  Upload,
  Image as ImageIcon,
  Link2,
  Loader2,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminMedicine, MedicineForm } from '@/lib/types';

const MEDICINE_CATEGORIES = [
  'All',
  'Antibiotics',
  'Cardiovascular & BP',
  'Pain & Fever',
  'Gastro & Acidity',
  'Diabetes Care',
  'Respiratory & Allergy',
  'Vitamins & Supplements',
  'Cough & Cold',
  'First Aid & Antiseptic',
  'Dermatology',
];

const DOSAGE_FORMS: MedicineForm[] = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Drops',
  'Inhaler',
  'Gel',
];

type SortField = 'name' | 'stock' | 'price' | 'expiry';
type SortDirection = 'asc' | 'desc';

export default function MedicinesPage() {
  const {
    medicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    toggleMedicineStock,
    updateMedicineStockCount,
    counts,
  } = useAdmin();

  // Search, filter & sorting
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'rx' | 'otc'>('all');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingMed, setViewingMed] = useState<AdminMedicine | null>(null);
  const [editingMed, setEditingMed] = useState<AdminMedicine | null>(null);
  const [deletingMed, setDeletingMed] = useState<AdminMedicine | null>(null);

  // Form State for New Medicine
  const initialFormState = {
    name: '',
    genericName: '',
    manufacturer: '',
    category: 'Antibiotics',
    dosageForm: 'Tablet' as MedicineForm,
    strength: '',
    packSize: '10 Tablets / Strip',
    price: 99,
    mrp: 120,
    isRx: true,
    inStock: true,
    stockCount: 100,
    batchNumber: `BTH-${Math.floor(1000 + Math.random() * 9000)}`,
    expiryDate: '2027-12',
    description: '',
    storageConditions: 'Store below 25°C in a dry place.',
    sideEffects: '',
    imageUrl: '',
    images: [] as string[],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [addUrlInput, setAddUrlInput] = useState('');
  const [editUrlInput, setEditUrlInput] = useState('');
  const [activeViewImageIndex, setActiveViewImageIndex] = useState(0);

  // Multiple files upload handler for medicine packaging & formulation photos
  const handleMultipleFilesUpload = async (
    files: FileList | File[],
    onSuccess: (newUrls: string[]) => void
  ) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);

    try {
      const uploadData = new FormData();
      Array.from(files).forEach((f) => {
        uploadData.append('files', f);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
          onSuccess(data.urls);
          setIsUploadingImage(false);
          return;
        } else if (data.url) {
          onSuccess([data.url]);
          setIsUploadingImage(false);
          return;
        }
      }

      // Fallback: convert files to base64 Data URLs
      const dataUrls = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') resolve(reader.result);
                else resolve('');
              };
              reader.readAsDataURL(file);
            })
        )
      );

      const validUrls = dataUrls.filter(Boolean);
      if (validUrls.length > 0) {
        onSuccess(validUrls);
      }
    } catch {
      // Local fallback with FileReader
      const dataUrls = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') resolve(reader.result);
                else resolve('');
              };
              reader.readAsDataURL(file);
            })
        )
      );
      const validUrls = dataUrls.filter(Boolean);
      if (validUrls.length > 0) {
        onSuccess(validUrls);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Sample quick templates for Add Medicine
  const SAMPLE_PRESETS = [
    {
      name: 'Amoxyclav 625mg Tablet',
      genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      manufacturer: 'Abbott Healthcare',
      category: 'Antibiotics',
      dosageForm: 'Tablet' as MedicineForm,
      strength: '625mg',
      packSize: '10 Tablets / Strip',
      price: 178,
      mrp: 210,
      isRx: true,
      stockCount: 120,
      batchNumber: 'ABB-625-X',
      expiryDate: '2027-11',
      description: 'Treatment for upper and lower respiratory tract infections.',
      storageConditions: 'Store below 25°C.',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Pantocid DSR Capsule',
      genericName: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
      manufacturer: 'Sun Pharma Ltd',
      category: 'Gastro & Acidity',
      dosageForm: 'Capsule' as MedicineForm,
      strength: '40mg + 30mg',
      packSize: '15 Capsules / Strip',
      price: 185,
      mrp: 225,
      isRx: true,
      stockCount: 80,
      batchNumber: 'SUN-PAN-42',
      expiryDate: '2027-09',
      description: 'Proton pump inhibitor with prokinetic for hyperacidity and reflux.',
      storageConditions: 'Store away from direct light.',
      imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Combiflam Plus Tablet',
      genericName: 'Ibuprofen (400mg) + Paracetamol (325mg)',
      manufacturer: 'Sanofi India Ltd',
      category: 'Pain & Fever',
      dosageForm: 'Tablet' as MedicineForm,
      strength: '400mg + 325mg',
      packSize: '20 Tablets / Strip',
      price: 45,
      mrp: 52,
      isRx: false,
      stockCount: 250,
      batchNumber: 'SAN-CBF-11',
      expiryDate: '2028-03',
      description: 'Dual action analgesic and antipyretic for moderate musculoskeletal pain.',
      storageConditions: 'Store in dry place.',
      imageUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=600&auto=format&fit=crop&q=80',
    },
  ];

  // Helper styling functions
  const getFormIcon = (form: string) => {
    switch (form) {
      case 'Capsule':
        return <Layers size={16} className="text-indigo-600" />;
      case 'Syrup':
        return <Droplet size={16} className="text-amber-600" />;
      case 'Ointment':
      case 'Gel':
        return <Sparkles size={16} className="text-emerald-600" />;
      case 'Injection':
        return <ShieldAlert size={16} className="text-rose-600" />;
      default:
        return <Pill size={16} className="text-teal-600" />;
    }
  };

  const getFormBadgeStyle = (_form?: string) => {
    return 'bg-slate-100 border-slate-200 text-slate-600';
  };

  const getCategoryBadgeStyle = (_category?: string) => {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Filtered & Sorted Rows
  const filteredMedicines = useMemo(() => {
    const list = medicines.filter((m) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (categoryFilter !== 'All' && m.category !== categoryFilter) {
        return false;
      }

      if (statusFilter === 'in_stock' && (!m.inStock || m.stockCount === 0)) return false;
      if (statusFilter === 'out_of_stock' && m.inStock && m.stockCount > 0) return false;
      if (statusFilter === 'low_stock' && (!m.inStock || m.stockCount <= 0 || m.stockCount > 20)) return false;
      if (statusFilter === 'rx' && !m.isRx) return false;
      if (statusFilter === 'otc' && m.isRx) return false;

      return true;
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'stock') comparison = a.stockCount - b.stockCount;
      else if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'expiry') comparison = (a.expiryDate || '').localeCompare(b.expiryDate || '');

      return sortDir === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [medicines, query, categoryFilter, statusFilter, sortBy, sortDir]);

  // Handle Add Medicine Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const allImages =
      formData.images && formData.images.length > 0
        ? formData.images
        : formData.imageUrl?.trim()
        ? [formData.imageUrl.trim()]
        : [];
    const primaryImg = allImages[0] || undefined;

    addMedicine({
      name: formData.name.trim(),
      genericName: formData.genericName.trim() || formData.name.trim(),
      manufacturer: formData.manufacturer.trim() || 'Generic Pharma Ltd',
      category: formData.category,
      dosageForm: formData.dosageForm,
      strength: formData.strength.trim(),
      packSize: formData.packSize.trim() || '1 Unit',
      price: Number(formData.price) || 0,
      mrp: Number(formData.mrp) || Number(formData.price) || 0,
      isRx: formData.isRx,
      inStock: formData.stockCount > 0 && formData.inStock,
      stockCount: Number(formData.stockCount) || 0,
      batchNumber: formData.batchNumber.trim() || `BTH-${Date.now().toString().slice(-4)}`,
      expiryDate: formData.expiryDate || '2027-12',
      description: formData.description.trim() || 'Therapeutic medication for clinical indications.',
      storageConditions: formData.storageConditions.trim() || 'Store in a cool, dry place.',
      sideEffects: formData.sideEffects.trim(),
      imageUrl: primaryImg,
      images: allImages,
    });

    setIsAddOpen(false);
    setFormData(initialFormState);
    setAddUrlInput('');
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !editingMed.name.trim()) return;

    const allImages =
      editingMed.images && editingMed.images.length > 0
        ? editingMed.images
        : editingMed.imageUrl?.trim()
        ? [editingMed.imageUrl.trim()]
        : [];
    const primaryImg = allImages[0] || undefined;

    updateMedicine(editingMed.id, {
      ...editingMed,
      price: Number(editingMed.price) || 0,
      mrp: Number(editingMed.mrp) || 0,
      stockCount: Number(editingMed.stockCount) || 0,
      inStock: Number(editingMed.stockCount) > 0 && editingMed.inStock,
      imageUrl: primaryImg,
      images: allImages,
    });

    setEditingMed(null);
    setEditUrlInput('');
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (deletingMed) {
      deleteMedicine(deletingMed.id);
      setDeletingMed(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'SKU ID,Medicine Name,Generic Salt Composition,Manufacturer,Category,Dosage Form,Strength,Pack Size,Price (INR),MRP (INR),Stock Units,In Stock,Prescription Required,Batch Number,Expiry Date',
    ];
    const rows = filteredMedicines.map((m) =>
      `"${m.id}","${m.name}","${m.genericName}","${m.manufacturer}","${m.category}","${m.dosageForm}","${m.strength || ''}","${m.packSize}","${m.price}","${m.mrp}","${m.stockCount}","${m.inStock}","${m.isRx ? 'Yes' : 'No'}","${m.batchNumber}","${m.expiryDate}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Medco_Medicine_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* ------------------------------------------------------------------- */}
      {/* 1. HERO HEADER WITH BREADCRUMB & PRIMARY ACTION CLUSTER            */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Medicine &amp; Formulation Inventory
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-bold transition shadow-xs active:scale-95"
              title="Download filtered medicine catalog as CSV"
            >
              <Download size={15} className="text-slate-500" />
              <span>Export CSV</span>
            </button>


            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-700/20 transition active:scale-95"
            >
              <Plus size={16} />
              <span>Add New Medicine</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. COMPACT KPI STAT CARDS (CLICKABLE FILTERS)                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total SKUs */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setCategoryFilter('All');
            setQuery('');
          }}
          className={`bg-white border rounded-2xl p-3 sm:p-3.5 transition cursor-pointer group ${
            statusFilter === 'all' && categoryFilter === 'All'
              ? 'border-teal-500 ring-2 ring-teal-500/15 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Pill size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-900 leading-none">
                {counts.totalMedicines}
              </p>
              <p className="text-xs font-bold text-slate-600 truncate mt-1">Formulary SKUs</p>
            </div>
          </div>
        </div>

        {/* In Stock */}
        <div
          onClick={() => setStatusFilter((p) => (p === 'in_stock' ? 'all' : 'in_stock'))}
          className={`bg-white border rounded-2xl p-3 sm:p-3.5 transition cursor-pointer group ${
            statusFilter === 'in_stock'
              ? 'border-emerald-500 ring-2 ring-emerald-500/15 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-900 leading-none">
                {counts.totalMedicines - counts.outOfStockMedicines}
              </p>
              <p className="text-xs font-bold text-slate-600 truncate mt-1">In-Stock SKUs</p>
            </div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div
          onClick={() => setStatusFilter((p) => (p === 'low_stock' ? 'all' : 'low_stock'))}
          className={`bg-white border rounded-2xl p-3 sm:p-3.5 transition cursor-pointer group ${
            statusFilter === 'low_stock'
              ? 'border-amber-500 ring-2 ring-amber-500/15 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-900 leading-none">
                {counts.lowStockMedicines}
              </p>
              <p className="text-xs font-bold text-slate-600 truncate mt-1">Low Stock (&lt;20)</p>
            </div>
          </div>
        </div>

        {/* Rx Required */}
        <div
          onClick={() => setStatusFilter((p) => (p === 'rx' ? 'all' : 'rx'))}
          className={`bg-white border rounded-2xl p-3 sm:p-3.5 transition cursor-pointer group ${
            statusFilter === 'rx'
              ? 'border-purple-500 ring-2 ring-purple-500/15 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <ShieldAlert size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-900 leading-none">
                {counts.rxMedicines}
              </p>
              <p className="text-xs font-bold text-slate-600 truncate mt-1">Rx Required</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. SEARCH & DROPDOWN FILTERS                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input - spans 5 cols on lg */}
          <div className="lg:col-span-4 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicine, salt, manufacturer, batch..."
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown - spans 3 cols on lg */}
          <div className="lg:col-span-3 relative">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:bg-white transition">
              <Filter size={14} className="text-teal-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">
                  Category
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-bold text-slate-900 text-xs cursor-pointer truncate mt-0.5"
                >
                  {MEDICINE_CATEGORIES.map((cat) => {
                    const count =
                      cat === 'All'
                        ? medicines.length
                        : medicines.filter((m) => m.category === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? `All Categories (${count})` : `${cat} (${count})`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Status Dropdown - spans 3 cols on lg */}
          <div className="lg:col-span-3 relative">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:bg-white transition">
              <Package size={14} className="text-teal-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">
                  Stock / Rx Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-transparent border-none outline-none font-bold text-slate-900 text-xs cursor-pointer truncate mt-0.5"
                >
                  <option value="all">All Items ({medicines.length})</option>
                  <option value="in_stock">In Stock ({counts.totalMedicines - counts.outOfStockMedicines})</option>
                  <option value="low_stock">Low Stock &lt;20 ({counts.lowStockMedicines})</option>
                  <option value="out_of_stock">Out of Stock ({counts.outOfStockMedicines})</option>
                  <option value="rx">Rx Only ({counts.rxMedicines})</option>
                  <option value="otc">OTC ({medicines.filter((m) => !m.isRx).length})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sort Dropdown - spans 2 cols on lg */}
          <div className="lg:col-span-2 relative">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:bg-white transition">
              <ArrowUpDown size={14} className="text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">
                  Sort
                </span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortField)}
                    className="w-full bg-transparent border-none outline-none font-bold text-slate-900 text-xs cursor-pointer truncate"
                  >
                    <option value="name">Name</option>
                    <option value="stock">Stock</option>
                    <option value="price">Price</option>
                    <option value="expiry">Expiry</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                    className="text-[9px] font-black uppercase text-teal-700 hover:text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0"
                    title={`Toggle direction (${sortDir.toUpperCase()})`}
                  >
                    {sortDir.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Pill Bar (shown when any filter is active) */}
        {(categoryFilter !== 'All' || statusFilter !== 'all' || query.trim() !== '') && (
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Active Filters:
            </span>
            {query.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                Query: "{query}"
                <button type="button" onClick={() => setQuery('')} className="hover:text-teal-950">
                  <X size={12} />
                </button>
              </span>
            )}
            {categoryFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                Category: {categoryFilter}
                <button type="button" onClick={() => setCategoryFilter('All')} className="hover:text-teal-950">
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                Status: {statusFilter.replace('_', ' ').toUpperCase()}
                <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-teal-950">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategoryFilter('All');
                setStatusFilter('all');
              }}
              className="text-[11px] font-black text-rose-600 hover:text-rose-700 hover:underline ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. MEDICINES INVENTORY TABLE                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
        {/* Table Subheader */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Showing <strong className="text-slate-900 font-extrabold">{filteredMedicines.length}</strong> of{' '}
              {medicines.length} formulary formulations
            </span>
            {(query || categoryFilter !== 'All' || statusFilter !== 'all') && (
              <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold">
                Filtered
              </span>
            )}
          </div>

          {(query || categoryFilter !== 'All' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setQuery('');
                setCategoryFilter('All');
                setStatusFilter('all');
              }}
              className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
            >
              <RefreshCw size={12} /> Reset all filters
            </button>
          )}
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Pill size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">No medicines match current criteria</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different drug name, clear active filters, or register a new formulation SKU.
              </p>
            </div>
            <button
              onClick={() => {
                setQuery('');
                setCategoryFilter('All');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Medicine &amp; Composition</th>
                  <th className="py-3 px-4">Manufacturer &amp; Batch</th>
                  <th className="py-3 px-4">Category &amp; Form</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Stock &amp; Status</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMedicines.map((med) => {
                  const discount =
                    med.mrp > med.price
                      ? Math.round(((med.mrp - med.price) / med.mrp) * 100)
                      : 0;
                  const isLowStock = med.inStock && med.stockCount > 0 && med.stockCount <= 20;
                  const isOutOfStock = !med.inStock || med.stockCount === 0;

                  return (
                    <tr
                      key={med.id}
                      className="hover:bg-slate-50/80 transition duration-150"
                    >
                      {/* Name & Composition */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          {(() => {
                            const rowImages =
                              med.images && med.images.length > 0
                                ? med.images
                                : med.imageUrl
                                ? [med.imageUrl]
                                : [];
                            const coverImg = rowImages[0] || med.imageUrl;

                            if (coverImg) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveViewImageIndex(0);
                                    setViewingMed(med);
                                  }}
                                  className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 mt-0.5 shadow-2xs bg-slate-50 hover:border-slate-400 transition relative group/img cursor-pointer"
                                  title={`Click to view ${rowImages.length} packaging photos`}
                                >
                                  <img
                                    src={coverImg}
                                    alt={med.name}
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition duration-200"
                                  />
                                  {rowImages.length > 1 && (
                                    <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[8px] font-black px-1 rounded-tl">
                                      +{rowImages.length - 1}
                                    </span>
                                  )}
                                </button>
                              );
                            }

                            return (
                              <div
                                className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${getFormBadgeStyle()}`}
                              >
                                {getFormIcon(med.dosageForm)}
                              </div>
                            );
                          })()}
                          <div className="space-y-0.5">
                            <p
                              className="font-bold text-slate-900 text-xs hover:text-teal-700 transition cursor-pointer leading-snug"
                              onClick={() => setViewingMed(med)}
                            >
                              {med.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-normal leading-tight">
                              {med.genericName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                              {med.packSize}
                              {med.strength ? ` • ${med.strength}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Manufacturer & Batch */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 text-xs">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span>{med.manufacturer}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-1 space-x-1.5">
                          <span>Batch: {med.batchNumber}</span>
                          <span className="text-slate-300">|</span>
                          <span>Exp: {med.expiryDate}</span>
                        </div>
                      </td>

                      {/* Category & Form */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {med.category}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Form: <span className="text-slate-700 font-medium">{med.dosageForm}</span>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-bold text-slate-900">₹{med.price}</span>
                          {med.mrp > med.price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{med.mrp}
                            </span>
                          )}
                        </div>
                        {discount > 0 && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {discount}% off
                          </div>
                        )}
                      </td>

                      {/* Stock Units & Quick Controls */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {med.stockCount} units
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-500'
                                  : isLowStock
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>

                        {/* Stepper & Toggle */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            type="button"
                            title="Decrease Stock (-5)"
                            onClick={() =>
                              updateMedicineStockCount(med.id, Math.max(0, med.stockCount - 5))
                            }
                            className="w-5 h-5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs transition"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            title="Increase Stock (+10)"
                            onClick={() =>
                              updateMedicineStockCount(med.id, med.stockCount + 10)
                            }
                            className="w-5 h-5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs transition"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMedicineStock(med.id)}
                            className="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition ml-1"
                          >
                            {med.inStock ? 'Mark OOS' : 'Restock'}
                          </button>
                        </div>
                      </td>

                      {/* Type (Rx vs OTC) */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {med.isRx ? 'Rx Required' : 'OTC Self-Care'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View Details"
                            onClick={() => {
                              setActiveViewImageIndex(0);
                              setViewingMed(med);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => {
                              const imgs =
                                med.images && med.images.length > 0
                                  ? med.images
                                  : med.imageUrl
                                  ? [med.imageUrl]
                                  : [];
                              setEditingMed({
                                ...med,
                                images: imgs,
                                imageUrl: imgs[0] || '',
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeletingMed(med)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. ADD MEDICINE MODAL                                               */}
      {/* ------------------------------------------------------------------- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                  <Pill size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add New Medicine Formulation</h3>
                  <p className="text-xs text-slate-500">
                    Register a new pharmaceutical SKU with verified clinical and stock metadata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Presets for Demo / Testing */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                Quick Prefill Preset:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...initialFormState,
                        ...preset,
                      });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-[11px] font-bold text-slate-700 transition shadow-2xs"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Medicine / Brand Name *
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Augmentin 625 Duo Tablet"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Generic Name / Salt Composition *
                  </label>
                  <input
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Manufacturer / Pharma Brand
                  </label>
                  <input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. GlaxoSmithKline / Cipla / Sun Pharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Therapeutic Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  >
                    {MEDICINE_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">Dosage Form</label>
                    <select
                      value={formData.dosageForm}
                      onChange={(e) =>
                        setFormData({ ...formData, dosageForm: e.target.value as MedicineForm })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                    >
                      {DOSAGE_FORMS.map((df) => (
                        <option key={df} value={df}>
                          {df}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">Strength</label>
                    <input
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="e.g. 625mg / 100ml"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Packaging / Pack Size
                  </label>
                  <input
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    placeholder="e.g. 10 Tablets / Strip, 100ml Bottle"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Batch Number &amp; Expiry
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="Batch code"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono"
                    />
                    <input
                      type="month"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Commercials */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Selling Price (INR) &amp; MRP (INR)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="Selling Price ₹"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                    />
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                      placeholder="MRP ₹"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Initial Stock Units
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer bg-purple-50/70 border border-purple-200 px-3 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={formData.isRx}
                    onChange={(e) => setFormData({ ...formData, isRx: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-900">
                    Prescription Required (Schedule-H / Rx)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-emerald-50/70 border border-emerald-200 px-3 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-900">
                    Immediately Active for Dispensing
                  </span>
                </label>
              </div>

              {/* Image Upload & Packaging Photos (Multiple) */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-teal-600" />
                    <label className="text-[11px] font-black text-slate-700">
                      Medicine &amp; Packaging Photos
                    </label>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-md">
                      Upload Multiple
                    </span>
                  </div>
                  {formData.images.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-bold">
                      {formData.images.length} photo{formData.images.length > 1 ? 's' : ''} attached
                    </span>
                  )}
                </div>

                {formData.images.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {formData.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-2xs flex flex-col justify-between"
                        >
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-1.5">
                            <div className="flex items-center justify-between">
                              {idx === 0 ? (
                                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                  Cover
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const target = formData.images[idx];
                                    const remaining = formData.images.filter((_, i) => i !== idx);
                                    const nextImgs = [target, ...remaining];
                                    setFormData({
                                      ...formData,
                                      images: nextImgs,
                                      imageUrl: nextImgs[0] || '',
                                    });
                                  }}
                                  className="bg-white/90 hover:bg-white text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow transition"
                                >
                                  Set Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextImgs = formData.images.filter((_, i) => i !== idx);
                                  setFormData({
                                    ...formData,
                                    images: nextImgs,
                                    imageUrl: nextImgs[0] || '',
                                  });
                                }}
                                className="w-5 h-5 rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition"
                                title="Remove photo"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <p className="text-[9px] text-white font-medium truncate">
                              Photo {idx + 1} {idx === 0 && '• Cover'}
                            </p>
                          </div>
                          {idx === 0 && (
                            <span className="group-hover:hidden absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Add More Tile */}
                      <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition p-2 text-center group">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleMultipleFilesUpload(e.target.files, (newUrls) => {
                                const nextImgs = [...formData.images, ...newUrls];
                                setFormData({
                                  ...formData,
                                  images: nextImgs,
                                  imageUrl: nextImgs[0] || '',
                                });
                              });
                            }
                          }}
                        />
                        {isUploadingImage ? (
                          <Loader2 size={16} className="text-teal-600 animate-spin" />
                        ) : (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                              <Plus size={14} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">Add More</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Or Paste URL */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={addUrlInput}
                          onChange={(e) => setAddUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (addUrlInput.trim()) {
                                const nextImgs = [...formData.images, addUrlInput.trim()];
                                setFormData({
                                  ...formData,
                                  images: nextImgs,
                                  imageUrl: nextImgs[0] || '',
                                });
                                setAddUrlInput('');
                              }
                            }
                          }}
                          placeholder="Paste image URL..."
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (addUrlInput.trim()) {
                            const nextImgs = [...formData.images, addUrlInput.trim()];
                            setFormData({
                              ...formData,
                              images: nextImgs,
                              imageUrl: nextImgs[0] || '',
                            });
                            setAddUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition shrink-0"
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty state multiple images dropzone */
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-xl p-4 cursor-pointer transition group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleMultipleFilesUpload(e.target.files, (newUrls) => {
                              const nextImgs = [...formData.images, ...newUrls];
                              setFormData({
                                ...formData,
                                images: nextImgs,
                                imageUrl: nextImgs[0] || '',
                              });
                            });
                          }
                        }}
                      />
                      {isUploadingImage ? (
                        <div className="flex items-center gap-2 text-teal-700 text-xs font-bold py-1">
                          <Loader2 size={16} className="animate-spin" />
                          Uploading photos...
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                            <Upload size={18} />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Click or drag to upload multiple photos</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Front packaging, back label, blister pack, carton • PNG, JPG, WEBP
                          </p>
                        </div>
                      )}
                    </label>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={addUrlInput}
                          onChange={(e) => setAddUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (addUrlInput.trim()) {
                                const nextImgs = [...formData.images, addUrlInput.trim()];
                                setFormData({
                                  ...formData,
                                  images: nextImgs,
                                  imageUrl: nextImgs[0] || '',
                                });
                                setAddUrlInput('');
                              }
                            }
                          }}
                          placeholder="Or paste external image URL (e.g. https://...)"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (addUrlInput.trim()) {
                            const nextImgs = [...formData.images, addUrlInput.trim()];
                            setFormData({
                              ...formData,
                              images: nextImgs,
                              imageUrl: nextImgs[0] || '',
                            });
                            setAddUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition shrink-0"
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Description */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  Indications &amp; Clinical Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary clinical uses, indications, or treatment summary..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-black text-white shadow-md shadow-teal-700/20 transition active:scale-95"
                >
                  Save &amp; Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 6. EDIT MEDICINE MODAL                                              */}
      {/* ------------------------------------------------------------------- */}
      {editingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Formulation Details</h3>
                  <p className="text-xs text-slate-500">SKU Code: {editingMed.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMed(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Medicine / Brand Name
                  </label>
                  <input
                    required
                    value={editingMed.name}
                    onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Generic Salt Composition
                  </label>
                  <input
                    value={editingMed.genericName}
                    onChange={(e) => setEditingMed({ ...editingMed, genericName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    value={editingMed.manufacturer}
                    onChange={(e) => setEditingMed({ ...editingMed, manufacturer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Therapeutic Category
                  </label>
                  <select
                    value={editingMed.category}
                    onChange={(e) => setEditingMed({ ...editingMed, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold"
                  >
                    {MEDICINE_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">Dosage Form</label>
                    <select
                      value={editingMed.dosageForm}
                      onChange={(e) =>
                        setEditingMed({ ...editingMed, dosageForm: e.target.value as MedicineForm })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                    >
                      {DOSAGE_FORMS.map((df) => (
                        <option key={df} value={df}>
                          {df}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">Strength</label>
                    <input
                      value={editingMed.strength || ''}
                      onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                      placeholder="e.g. 500mg"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Pack Size</label>
                  <input
                    value={editingMed.packSize}
                    onChange={(e) => setEditingMed({ ...editingMed, packSize: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Batch No &amp; Expiry Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editingMed.batchNumber}
                      onChange={(e) => setEditingMed({ ...editingMed, batchNumber: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono font-bold"
                    />
                    <input
                      value={editingMed.expiryDate}
                      onChange={(e) => setEditingMed({ ...editingMed, expiryDate: e.target.value })}
                      placeholder="YYYY-MM"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Selling Price (INR) &amp; MRP (INR)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editingMed.price}
                      onChange={(e) => setEditingMed({ ...editingMed, price: Number(e.target.value) })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                    />
                    <input
                      type="number"
                      value={editingMed.mrp}
                      onChange={(e) => setEditingMed({ ...editingMed, mrp: Number(e.target.value) })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Stock Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingMed.stockCount}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        stockCount: Number(e.target.value),
                        inStock: Number(e.target.value) > 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer bg-purple-50 px-3 py-2 rounded-xl border border-purple-200">
                  <input
                    type="checkbox"
                    checked={editingMed.isRx}
                    onChange={(e) => setEditingMed({ ...editingMed, isRx: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-900">Prescription Required (Schedule H / Rx)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={editingMed.inStock}
                    onChange={(e) => setEditingMed({ ...editingMed, inStock: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-900">In Stock for Dispensing</span>
                </label>
              </div>

              {/* Image Upload & Packaging Photos (Multiple) */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-teal-600" />
                    <label className="text-[11px] font-black text-slate-700">
                      Medicine &amp; Packaging Photos
                    </label>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-md">
                      Upload Multiple
                    </span>
                  </div>
                  {editingMed.images && editingMed.images.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-bold">
                      {editingMed.images.length} photo{editingMed.images.length > 1 ? 's' : ''} attached
                    </span>
                  )}
                </div>

                {editingMed.images && editingMed.images.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {editingMed.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-2xs flex flex-col justify-between"
                        >
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-1.5">
                            <div className="flex items-center justify-between">
                              {idx === 0 ? (
                                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                  Cover
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentImgs = editingMed.images || [];
                                    const target = currentImgs[idx];
                                    const remaining = currentImgs.filter((_, i) => i !== idx);
                                    const nextImgs = [target, ...remaining];
                                    setEditingMed({
                                      ...editingMed,
                                      images: nextImgs,
                                      imageUrl: nextImgs[0] || '',
                                    });
                                  }}
                                  className="bg-white/90 hover:bg-white text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow transition"
                                >
                                  Set Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextImgs = (editingMed.images || []).filter((_, i) => i !== idx);
                                  setEditingMed({
                                    ...editingMed,
                                    images: nextImgs,
                                    imageUrl: nextImgs[0] || '',
                                  });
                                }}
                                className="w-5 h-5 rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition"
                                title="Remove photo"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <p className="text-[9px] text-white font-medium truncate">
                              Photo {idx + 1} {idx === 0 && '• Cover'}
                            </p>
                          </div>
                          {idx === 0 && (
                            <span className="group-hover:hidden absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Add More Tile */}
                      <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition p-2 text-center group">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleMultipleFilesUpload(e.target.files, (newUrls) => {
                                const nextImgs = [...(editingMed.images || []), ...newUrls];
                                setEditingMed({
                                  ...editingMed,
                                  images: nextImgs,
                                  imageUrl: nextImgs[0] || '',
                                });
                              });
                            }
                          }}
                        />
                        {isUploadingImage ? (
                          <Loader2 size={16} className="text-teal-600 animate-spin" />
                        ) : (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                              <Plus size={14} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">Add More</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Or Paste URL */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={editUrlInput}
                          onChange={(e) => setEditUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (editUrlInput.trim()) {
                                const nextImgs = [...(editingMed.images || []), editUrlInput.trim()];
                                setEditingMed({
                                  ...editingMed,
                                  images: nextImgs,
                                  imageUrl: nextImgs[0] || '',
                                });
                                setEditUrlInput('');
                              }
                            }
                          }}
                          placeholder="Paste image URL..."
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (editUrlInput.trim()) {
                            const nextImgs = [...(editingMed.images || []), editUrlInput.trim()];
                            setEditingMed({
                              ...editingMed,
                              images: nextImgs,
                              imageUrl: nextImgs[0] || '',
                            });
                            setEditUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition shrink-0"
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty state multiple images dropzone */
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-xl p-4 cursor-pointer transition group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleMultipleFilesUpload(e.target.files, (newUrls) => {
                              const nextImgs = [...(editingMed.images || []), ...newUrls];
                              setEditingMed({
                                ...editingMed,
                                images: nextImgs,
                                imageUrl: nextImgs[0] || '',
                              });
                            });
                          }
                        }}
                      />
                      {isUploadingImage ? (
                        <div className="flex items-center gap-2 text-teal-700 text-xs font-bold py-1">
                          <Loader2 size={16} className="animate-spin" />
                          Uploading photos...
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                            <Upload size={18} />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Click or drag to upload multiple photos</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Front packaging, back label, blister pack, carton • PNG, JPG, WEBP
                          </p>
                        </div>
                      )}
                    </label>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={editUrlInput}
                          onChange={(e) => setEditUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (editUrlInput.trim()) {
                                const nextImgs = [...(editingMed.images || []), editUrlInput.trim()];
                                setEditingMed({
                                  ...editingMed,
                                  images: nextImgs,
                                  imageUrl: nextImgs[0] || '',
                                });
                                setEditUrlInput('');
                              }
                            }
                          }}
                          placeholder="Or paste external image URL (e.g. https://...)"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (editUrlInput.trim()) {
                            const nextImgs = [...(editingMed.images || []), editUrlInput.trim()];
                            setEditingMed({
                              ...editingMed,
                              images: nextImgs,
                              imageUrl: nextImgs[0] || '',
                            });
                            setEditUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition shrink-0"
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  Indications / Uses
                </label>
                <textarea
                  rows={2}
                  value={editingMed.description}
                  onChange={(e) => setEditingMed({ ...editingMed, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-black text-white shadow-md shadow-teal-700/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 7. VIEW DETAILS MODAL                                               */}
      {/* ------------------------------------------------------------------- */}
      {viewingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${getFormBadgeStyle(
                    viewingMed.dosageForm
                  )}`}
                >
                  {getFormIcon(viewingMed.dosageForm)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900">{viewingMed.name}</h3>
                    {viewingMed.isRx ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black">
                        Rx Required
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                        OTC Drug
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-800 font-semibold mt-0.5">{viewingMed.genericName}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingMed(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Packaging / Product Photos Gallery */}
              {(() => {
                const viewImages =
                  viewingMed.images && viewingMed.images.length > 0
                    ? viewingMed.images
                    : viewingMed.imageUrl
                    ? [viewingMed.imageUrl]
                    : [];

                if (viewImages.length === 0) return null;

                const currentActive = viewImages[activeViewImageIndex] || viewImages[0];

                return (
                  <div className="space-y-2">
                    <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner group">
                      <img
                        src={currentActive}
                        alt={viewingMed.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-xl bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                        <ImageIcon size={13} className="text-teal-400" />
                        Photo {activeViewImageIndex + 1} of {viewImages.length}
                        {activeViewImageIndex === 0 && ' (Cover)'}
                      </div>

                      {viewImages.length > 1 && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveViewImageIndex((prev) =>
                                prev === 0 ? viewImages.length - 1 : prev - 1
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/90 text-white font-bold flex items-center justify-center backdrop-blur-xs transition shadow"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveViewImageIndex((prev) =>
                                prev === viewImages.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/90 text-white font-bold flex items-center justify-center backdrop-blur-xs transition shadow"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Thumbnails row */}
                    {viewImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {viewImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveViewImageIndex(idx)}
                            className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                              activeViewImageIndex === idx
                                ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                                : 'border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Commercials Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase">Selling Price</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">₹{viewingMed.price}</p>
                  <p className="text-[10px] text-slate-400 line-through">MRP ₹{viewingMed.mrp}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase">Stock Status</p>
                  <p
                    className={`text-lg font-black mt-0.5 ${
                      !viewingMed.inStock || viewingMed.stockCount === 0
                        ? 'text-rose-600'
                        : viewingMed.stockCount <= 20
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {viewingMed.stockCount} units
                  </p>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {viewingMed.inStock ? 'Available for Dispatch' : 'Out of Stock'}
                  </span>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase">Discount Margin</p>
                  <p className="text-lg font-black text-teal-700 mt-0.5">
                    {viewingMed.mrp > viewingMed.price
                      ? Math.round(((viewingMed.mrp - viewingMed.price) / viewingMed.mrp) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">Direct Customer Savings</p>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Manufacturer</span>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingMed.manufacturer}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Category</span>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingMed.category}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Form &amp; Packaging
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewingMed.dosageForm} • {viewingMed.packSize}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Batch &amp; Expiry</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewingMed.batchNumber} (Exp: {viewingMed.expiryDate})
                  </p>
                </div>
              </div>

              {/* Indications */}
              {viewingMed.description && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Clinical Uses &amp; Indications
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">{viewingMed.description}</p>
                </div>
              )}

              {/* Storage */}
              {viewingMed.storageConditions && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Storage</span>
                  <p className="text-slate-700 font-medium">{viewingMed.storageConditions}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  const toEdit = viewingMed;
                  setViewingMed(null);
                  setEditingMed(toEdit);
                }}
                className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition"
              >
                Edit All Details
              </button>

              <button
                onClick={() => setViewingMed(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 8. DELETE CONFIRMATION MODAL                                        */}
      {/* ------------------------------------------------------------------- */}
      {deletingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Remove Medicine SKU?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove{' '}
                <strong className="text-slate-800 font-black">{deletingMed.name}</strong> from the catalog and inventory?
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span className="font-semibold">SKU ID:</span>
                <span className="font-mono font-bold text-slate-800">{deletingMed.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-semibold">Current Stock:</span>
                <span className="text-amber-600 font-bold">{deletingMed.stockCount} units</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-semibold">Selling Price:</span>
                <span className="text-slate-900 font-bold">₹{deletingMed.price}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-600 text-center font-bold">
              This will remove this formulation from prescription dispensing and patient search.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMed(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white shadow-xs transition active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
