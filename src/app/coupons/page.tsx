'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { ActionButton, PageHeader, StatusBadge } from '@/components/ui';
import { Ticket, Plus, Tag } from 'lucide-react';

export default function CouponsPage() {
  const { coupons, toggleCoupon, addCoupon } = useAdmin();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState('50');
  const [minOrderValue, setMinOrderValue] = useState('199');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    addCoupon({
      code: code.trim().toUpperCase(),
      description: description.trim() || 'Clinical promo coupon',
      discountType,
      discountValue: Number(discountValue) || 0,
      minOrderValue: Number(minOrderValue) || 0,
      active: true,
    });
    setCode('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions & Coupon Codes"
        subtitle="Create clinical discount codes, seasonal offers, and pause promo rules across checkout."
        right={
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold font-mono shadow-xs">
            {coupons.filter((c) => c.active).length} ACTIVE CODES
          </span>
        }
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="PROMO CODE"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Discount description"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as 'flat' | 'percent')}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        >
          <option value="flat">Flat ₹ Discount</option>
          <option value="percent">Percentage % Off</option>
        </select>
        <input
          type="number"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          placeholder="Discount value"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 shadow-xs transition flex items-center justify-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add Code</span>
        </button>
        <div className="sm:col-span-2 lg:col-span-6 flex items-center gap-2">
          <span className="text-xs text-slate-400">Min Order Value (₹):</span>
          <input
            type="number"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(e.target.value)}
            placeholder="Min order value ₹"
            className="w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>
      </form>

      <div className="space-y-3">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card hover:border-slate-300 transition"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                <Ticket size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 tracking-wider font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    {c.code}
                  </h3>
                  <StatusBadge value={c.active ? 'active' : 'suspended'} />
                </div>
                <p className="text-xs text-slate-600 mt-1">{c.description}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`} off • Minimum Order: ₹{c.minOrderValue}
                </p>
              </div>
            </div>

            <ActionButton tone={c.active ? 'warn' : 'good'} onClick={() => toggleCoupon(c.id)}>
              {c.active ? 'Pause Code' : 'Activate Code'}
            </ActionButton>
          </div>
        ))}
      </div>
    </div>
  );
}
