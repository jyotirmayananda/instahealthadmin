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
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { AdminMedicine, MedicineForm } from '@/lib/types';
import { ActionButton, PageHeader, StatusBadge } from '@/components/ui';

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

  // Search and filters
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'rx' | 'otc'>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingMed, setViewingMed] = useState<AdminMedicine | null>(null);
  const [editingMed, setEditingMed] = useState<AdminMedicine | null>(null);
  const [deletingMed, setDeletingMed] = useState<AdminMedicine | null>(null);

  // New Medicine Form State
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
  };
  const [formData, setFormData] = useState(initialFormState);

  // Filtered rows
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const q = query.toLowerCase();
      const matchesQuery =
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
  }, [medicines, query, categoryFilter, statusFilter]);

  // Handle Add Medicine Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addMedicine({
      name: formData.name.trim(),
      genericName: formData.genericName.trim() || formData.name.trim(),
      manufacturer: formData.manufacturer.trim() || 'Generic Pharma',
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
    });

    setIsAddOpen(false);
    setFormData(initialFormState);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !editingMed.name.trim()) return;

    updateMedicine(editingMed.id, {
      ...editingMed,
      price: Number(editingMed.price) || 0,
      mrp: Number(editingMed.mrp) || 0,
      stockCount: Number(editingMed.stockCount) || 0,
      inStock: Number(editingMed.stockCount) > 0 && editingMed.inStock,
    });

    setEditingMed(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (deletingMed) {
      deleteMedicine(deletingMed.id);
      setDeletingMed(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pharmacy & Medicine Inventory"
        subtitle="Add, remove, and manage all medicine formulations, batch codes, pricing, and stock levels."
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus size={16} />
              <span>Add New Medicine</span>
            </button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <Pill size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Medicines</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.totalMedicines}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">In Stock SKUs</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {counts.totalMedicines - counts.outOfStockMedicines}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Low Stock (&lt;20)</p>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">{counts.lowStockMedicines}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Rx Required</p>
            <p className="text-xl font-extrabold text-purple-700 mt-0.5">{counts.rxMedicines}</p>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by brand name, salt/composition, manufacturer, batch number…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'low_stock', label: 'Low Stock (<20)' },
              { id: 'out_of_stock', label: 'Out of Stock' },
              { id: 'rx', label: 'Rx Only' },
              { id: 'otc', label: 'OTC (Non-Rx)' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st.id
                    ? 'bg-white text-teal-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          {MEDICINE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-900 font-bold">{filteredMedicines.length}</strong> of{' '}
            {medicines.length} medicines
          </span>
          {query || categoryFilter !== 'All' || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setQuery('');
                setCategoryFilter('All');
                setStatusFilter('all');
              }}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <RefreshCw size={12} /> Reset filters
            </button>
          ) : null}
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Pill size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-800">No medicines found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or add a new medicine.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="py-3.5 px-4">Medicine &amp; Composition</th>
                  <th className="py-3.5 px-4">Manufacturer &amp; Batch</th>
                  <th className="py-3.5 px-4">Category &amp; Form</th>
                  <th className="py-3.5 px-4">Pricing (₹)</th>
                  <th className="py-3.5 px-4">Stock Units</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
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
                    <tr key={med.id} className="hover:bg-slate-50/60 transition group">
                      {/* Name & Composition */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                            <Pill size={16} />
                          </div>
                          <div>
                            <p
                              className="font-bold text-slate-900 text-sm hover:text-teal-700 transition cursor-pointer"
                              onClick={() => setViewingMed(med)}
                            >
                              {med.name}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 font-mono">
                              {med.genericName}
                            </p>
                            <span className="text-[10px] text-slate-400">{med.packSize}</span>
                          </div>
                        </div>
                      </td>

                      {/* Manufacturer & Batch */}
                      <td className="py-4 px-4 text-slate-700">
                        <div className="font-semibold text-slate-800">{med.manufacturer}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Batch: {med.batchNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">Exp: {med.expiryDate}</div>
                      </td>

                      {/* Category & Form */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                          {med.category}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                          {med.dosageForm} {med.strength ? `• ${med.strength}` : ''}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-slate-900">₹{med.price}</span>
                          {med.mrp > med.price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{med.mrp}
                            </span>
                          )}
                        </div>
                        {discount > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {discount}% OFF
                          </span>
                        )}
                      </td>

                      {/* Stock Units & Controls */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {med.stockCount} units
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? 'OOS' : isLowStock ? 'Low' : 'In Stock'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <button
                            title="Decrease Stock (-5)"
                            onClick={() => updateMedicineStockCount(med.id, Math.max(0, med.stockCount - 5))}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200"
                          >
                            -
                          </button>
                          <button
                            title="Increase Stock (+10)"
                            onClick={() => updateMedicineStockCount(med.id, med.stockCount + 10)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200"
                          >
                            +
                          </button>
                          <button
                            onClick={() => toggleMedicineStock(med.id)}
                            className="text-[10px] text-teal-700 hover:text-teal-800 ml-1 font-semibold underline"
                          >
                            {med.inStock ? 'Mark OOS' : 'Restock'}
                          </button>
                        </div>
                      </td>

                      {/* Type (Rx vs OTC) */}
                      <td className="py-4 px-4">
                        {med.isRx ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                            <ShieldAlert size={11} /> Rx
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                            OTC
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="View Full Details"
                            onClick={() => setViewingMed(med)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            title="Edit Medicine Details"
                            onClick={() => setEditingMed({ ...med })}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            title="Remove Medicine"
                            onClick={() => setDeletingMed(med)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                          >
                            <Trash2 size={14} />
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

      {/* 1. ADD MEDICINE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-modal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                  <Pill size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Medicine</h3>
                  <p className="text-xs text-slate-500">Register new medicine SKU with complete clinical details</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Medicine / Brand Name *
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Augmentin 625 Duo Tablet"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Generic Name / Salt Composition *
                  </label>
                  <input
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Manufacturer / Brand
                  </label>
                  <input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. GlaxoSmithKline / Cipla"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Therapeutic Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Dosage Form</label>
                    <select
                      value={formData.dosageForm}
                      onChange={(e) =>
                        setFormData({ ...formData, dosageForm: e.target.value as MedicineForm })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      {DOSAGE_FORMS.map((df) => (
                        <option key={df} value={df}>
                          {df}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Strength</label>
                    <input
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="e.g. 625mg"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Packaging / Pack Size
                  </label>
                  <input
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    placeholder="e.g. 10 Tablets / Strip"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Batch Number &amp; Expiry
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="Batch code"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                    />
                    <input
                      type="month"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selling Price (₹) &amp; MRP (₹)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="Price ₹"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                      placeholder="MRP ₹"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Stock Units Available
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRx}
                    onChange={(e) => setFormData({ ...formData, isRx: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Prescription Required (Schedule H / Rx)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">In Stock for Dispensing</span>
                </label>
              </div>

              {/* Clinical Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Indications &amp; Clinical Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary clinical uses, indications, or treatment summary..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-xs"
                >
                  Save &amp; Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT MEDICINE MODAL */}
      {editingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-modal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Medicine Details</h3>
                  <p className="text-xs text-slate-500">SKU: {editingMed.id}</p>
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Medicine / Brand Name
                  </label>
                  <input
                    required
                    value={editingMed.name}
                    onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Generic Composition / Salt
                  </label>
                  <input
                    value={editingMed.genericName}
                    onChange={(e) => setEditingMed({ ...editingMed, genericName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    value={editingMed.manufacturer}
                    onChange={(e) => setEditingMed({ ...editingMed, manufacturer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Therapeutic Category
                  </label>
                  <select
                    value={editingMed.category}
                    onChange={(e) => setEditingMed({ ...editingMed, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Dosage Form</label>
                    <select
                      value={editingMed.dosageForm}
                      onChange={(e) =>
                        setEditingMed({ ...editingMed, dosageForm: e.target.value as MedicineForm })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    >
                      {DOSAGE_FORMS.map((df) => (
                        <option key={df} value={df}>
                          {df}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Strength</label>
                    <input
                      value={editingMed.strength || ''}
                      onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                      placeholder="e.g. 500mg"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pack Size</label>
                  <input
                    value={editingMed.packSize}
                    onChange={(e) => setEditingMed({ ...editingMed, packSize: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Batch No &amp; Expiry Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editingMed.batchNumber}
                      onChange={(e) => setEditingMed({ ...editingMed, batchNumber: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                    />
                    <input
                      value={editingMed.expiryDate}
                      onChange={(e) => setEditingMed({ ...editingMed, expiryDate: e.target.value })}
                      placeholder="YYYY-MM"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selling Price (₹) &amp; MRP (₹)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editingMed.price}
                      onChange={(e) => setEditingMed({ ...editingMed, price: Number(e.target.value) })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                    <input
                      type="number"
                      value={editingMed.mrp}
                      onChange={(e) => setEditingMed({ ...editingMed, mrp: Number(e.target.value) })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMed.isRx}
                    onChange={(e) => setEditingMed({ ...editingMed, isRx: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Prescription Required (Rx)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMed.inStock}
                    onChange={(e) => setEditingMed({ ...editingMed, inStock: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">In Stock for Dispensing</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Indications / Uses
                </label>
                <textarea
                  rows={2}
                  value={editingMed.description}
                  onChange={(e) => setEditingMed({ ...editingMed, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. VIEW DETAILS MODAL */}
      {viewingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 my-8 shadow-modal">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                  <Pill size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{viewingMed.name}</h3>
                    {viewingMed.isRx ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                        Rx Required
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        OTC Drug
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-700 font-mono mt-0.5">{viewingMed.genericName}</p>
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
              {/* Commercials Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Selling Price</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">₹{viewingMed.price}</p>
                  <p className="text-[10px] text-slate-400 line-through">MRP ₹{viewingMed.mrp}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Stock Level</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">
                    {viewingMed.stockCount} units
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {viewingMed.inStock ? 'Available' : 'Out of stock'}
                  </span>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Margin / Off</p>
                  <p className="text-base font-black text-teal-700 mt-0.5">
                    {viewingMed.mrp > viewingMed.price
                      ? Math.round(((viewingMed.mrp - viewingMed.price) / viewingMed.mrp) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-[10px] text-slate-500">Direct Patient Saving</p>
                </div>
              </div>

              {/* Formulation & Regulatory specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Manufacturer</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingMed.manufacturer}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingMed.category}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Form &amp; Packaging
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {viewingMed.dosageForm} • {viewingMed.packSize}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Batch &amp; Expiry</span>
                  <p className="font-semibold text-slate-800 mt-0.5 font-mono">
                    {viewingMed.batchNumber} (Exp: {viewingMed.expiryDate})
                  </p>
                </div>
              </div>

              {/* Indications */}
              {viewingMed.description && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Clinical Uses &amp; Indications
                  </span>
                  <p className="text-slate-700 leading-relaxed">{viewingMed.description}</p>
                </div>
              )}

              {/* Storage & Side effects */}
              <div className="grid grid-cols-2 gap-3">
                {viewingMed.storageConditions && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Storage</span>
                    <p className="text-slate-600 text-[11px]">{viewingMed.storageConditions}</p>
                  </div>
                )}
                {viewingMed.sideEffects && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Common Side Effects</span>
                    <p className="text-slate-600 text-[11px]">{viewingMed.sideEffects}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const toEdit = viewingMed;
                  setViewingMed(null);
                  setEditingMed(toEdit);
                }}
                className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold"
              >
                Edit All Details
              </button>

              <button
                onClick={() => setViewingMed(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deletingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Remove Medicine SKU?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove{' '}
                <strong className="text-slate-800">{deletingMed.name}</strong> from the catalog and inventory?
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>SKU ID:</span>
                <span className="font-mono font-bold text-slate-800">{deletingMed.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Stock Units:</span>
                <span className="text-amber-600 font-bold">{deletingMed.stockCount} units</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Selling Price:</span>
                <span className="text-slate-900 font-bold">₹{deletingMed.price}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-600 text-center font-medium">
              This will remove this item from prescription dispensing and patient search.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMed(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-xs"
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
