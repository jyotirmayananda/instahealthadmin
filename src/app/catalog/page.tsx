'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { HeartPulse, Pill, TestTube, ArrowRight, Trash2, X, Plus } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import type { CatalogType } from '@/lib/types';
import { ActionButton, FilterBar, PageHeader, StatusBadge } from '@/components/ui';

export default function CatalogPage() {
  const { catalog, setCatalogPrice, toggleCatalogStock, addCatalogItem, deleteCatalogItem } = useAdmin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('OTC');
  const [type, setType] = useState<CatalogType>('medicine');
  const [price, setPrice] = useState('99');
  const [mrp, setMrp] = useState('149');
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);

  const rows = useMemo(() => {
    return catalog.filter((item) => {
      const match = item.name.toLowerCase().includes(query.toLowerCase());
      if (!match) return false;
      if (filter === 'all') return true;
      return item.type === filter;
    });
  }, [catalog, query, filter]);

  const save = (id: string) => {
    const val = parseInt(tempPrice, 10);
    if (!Number.isNaN(val) && val > 0) setCatalogPrice(id, val);
    setEditingId(null);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCatalogItem({
      name: name.trim(),
      category,
      type,
      price: Number(price) || 0,
      mrp: Number(mrp) || Number(price) || 0,
      inStock: true,
    });
    setName('');
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteCatalogItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic & Clinical Catalog & Rates"
        subtitle="Manage master clinical tariffs, lab investigation packages, and procedure fees."
        right={
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold font-mono shadow-xs">
            {catalog.length} ACTIVE TARIFFS
          </span>
        }
      />

      {/* Banner for Detailed Medicine Inventory */}
      <div className="bg-gradient-to-r from-teal-700 to-slate-800 text-white rounded-3xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <Pill size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Dedicated Medicine Inventory &amp; Formulations</h4>
            <p className="text-xs text-teal-100">
              Manage generic compositions, batches, expiry dates, manufacturers, and stock counts.
            </p>
          </div>
        </div>
        <Link
          href="/medicines"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-teal-800 text-xs font-bold shadow-xs shrink-0 hover:bg-teal-50 transition"
        >
          <span>Open Medicines Desk</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Quick Add SKU Form */}
      <form
        onSubmit={add}
        className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New SKU / Test Name"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CatalogType)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        >
          <option value="medicine">Medicine</option>
          <option value="lab_test">Lab Test</option>
          <option value="procedure">Clinical Procedure</option>
        </select>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price ₹"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add SKU</span>
        </button>
      </form>

      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search catalog items, tests, procedures…"
        active={filter}
        onFilter={setFilter}
        filters={[
          { id: 'all', label: 'All' },
          { id: 'medicine', label: 'Medicines' },
          { id: 'lab_test', label: 'Lab Tests' },
          { id: 'procedure', label: 'Procedures' },
        ]}
      />

      <div className="space-y-3">
        {rows.map((item) => {
          const Icon = item.type === 'procedure' ? HeartPulse : item.type === 'lab_test' ? TestTube : Pill;
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>{item.category}</span>
                    {item.turnaroundHours && <span>• TAT: {item.turnaroundHours}h</span>}
                    <StatusBadge value={item.inStock ? 'active' : 'suspended'} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="w-20 bg-slate-50 border border-teal-600 rounded-xl px-2.5 py-1 text-sm font-bold text-slate-900 text-center"
                    />
                    <ActionButton tone="primary" onClick={() => save(item.id)}>
                      Save
                    </ActionButton>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-slate-900">₹{item.price}</span>
                    <span className="text-xs text-slate-400 line-through ml-2">MRP ₹{item.mrp}</span>
                  </div>
                )}
                {!isEditing && (
                  <>
                    <ActionButton
                      onClick={() => {
                        setEditingId(item.id);
                        setTempPrice(String(item.price));
                      }}
                    >
                      Edit Price
                    </ActionButton>
                    <ActionButton tone={item.inStock ? 'warn' : 'good'} onClick={() => toggleCatalogStock(item.id)}>
                      {item.inStock ? 'Mark OOS' : 'Restock'}
                    </ActionButton>
                    <ActionButton
                      tone="danger"
                      onClick={() => setDeletingItem({ id: item.id, name: item.name })}
                    >
                      Remove
                    </ActionButton>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Remove Item from Catalog?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong className="text-slate-800">{deletingItem.name}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
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
