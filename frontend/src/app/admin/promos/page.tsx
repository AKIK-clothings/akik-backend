"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { adminApi } from "@/lib/api";

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  description: string;
  min_order_value: number;
  is_active: boolean;
  usage_count: number;
  usage_limit: number | null;
  expires_at: string | null;
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", discountPercentage: "", description: "", minOrderValue: "", usageLimit: "", expiresAt: "", isActive: true });

  useEffect(() => { loadPromos(); }, []);

  const loadPromos = async () => {
    setIsLoading(true);
    try {
      const { promos: data } = await adminApi.getPromos() as { promos: PromoCode[] };
      setPromos(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      code: form.code, discountPercentage: Number(form.discountPercentage),
      description: form.description, minOrderValue: Number(form.minOrderValue) || 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      expiresAt: form.expiresAt || null, isActive: form.isActive,
    };
    try {
      if (editingId) { await adminApi.updatePromo(editingId, data); }
      else { await adminApi.createPromo(data); }
      await loadPromos();
      setShowForm(false); setEditingId(null);
      setForm({ code: "", discountPercentage: "", description: "", minOrderValue: "", usageLimit: "", expiresAt: "", isActive: true });
    } catch (err) { alert("Failed to save promo code"); console.error(err); }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    try { await adminApi.deletePromo(id); setPromos((prev) => prev.filter((p) => p.id !== id)); }
    catch (err) { alert("Failed to delete"); console.error(err); }
  };

  const startEdit = (promo: PromoCode) => {
    setForm({
      code: promo.code, discountPercentage: String(promo.discount_percentage),
      description: promo.description || "", minOrderValue: String(promo.min_order_value || ""),
      usageLimit: promo.usage_limit ? String(promo.usage_limit) : "",
      expiresAt: promo.expires_at ? promo.expires_at.split("T")[0] : "",
      isActive: promo.is_active,
    });
    setEditingId(promo.id); setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1918]">Promo Codes</h1>
          <p className="text-sm text-[#75706B] mt-1">{promos.length} codes</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C47D5A] text-white text-sm font-semibold rounded-lg hover:bg-[#A86947] transition-colors">
          <Plus className="w-4 h-4" /> New Code
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#C47D5A]/30 p-6 shadow-sm">
          <h2 className="font-semibold text-[#1A1918] mb-4">{editingId ? "Edit Promo Code" : "Create New Promo Code"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1 uppercase tracking-wider">Code *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required disabled={!!editingId}
                placeholder="FESTIVE15" className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] font-mono disabled:bg-[#F5F3F0]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1 uppercase tracking-wider">Discount % *</label>
              <input type="number" min="1" max="100" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} required
                placeholder="15" className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#75706B] mb-1 uppercase tracking-wider">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="15% off festive celebration discount" className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1 uppercase tracking-wider">Min Order (₹)</label>
              <input type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                placeholder="2500" className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1 uppercase tracking-wider">Usage Limit</label>
              <input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="100 (leave blank for unlimited)" className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#75706B] mb-1 uppercase tracking-wider">Expires On</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]" />
            </div>
            <div className="flex items-center gap-2 self-end pb-2">
              <input type="checkbox" id="promoActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-[#C47D5A]" />
              <label htmlFor="promoActive" className="text-sm text-[#1A1918]">Active</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-[#C47D5A] text-white text-sm font-semibold rounded-lg hover:bg-[#A86947] transition-colors flex items-center gap-2"><Check className="w-4 h-4" /> Save</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 py-2.5 bg-white border border-[#EAE5DE] text-[#1A1918] text-sm font-medium rounded-lg hover:bg-[#F5F3F0] transition-colors flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Promos Table */}
      <div className="bg-white rounded-xl border border-[#EAE5DE] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-[#C47D5A] animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F3F0] border-b border-[#EAE5DE]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider hidden md:table-cell">Min Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider hidden sm:table-cell">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DE]">
              {promos.map((promo) => (
                <tr key={promo.id} className="hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3"><span className="font-mono font-bold text-[#1A1918]">{promo.code}</span><p className="text-xs text-[#A8A49F] mt-0.5">{promo.description}</p></td>
                  <td className="px-4 py-3 font-semibold text-[#C47D5A]">{promo.discount_percentage}% off</td>
                  <td className="px-4 py-3 hidden md:table-cell text-[#75706B]">{promo.min_order_value ? `₹${promo.min_order_value.toLocaleString("en-IN")}` : "None"}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[#75706B]">{promo.usage_count}{promo.usage_limit ? ` / ${promo.usage_limit}` : ""}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${promo.is_active ? "bg-green-100 text-green-700" : "bg-[#F5F3F0] text-[#75706B]"}`}>{promo.is_active ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(promo)} className="p-1.5 rounded-lg text-[#75706B] hover:bg-[#F5F3F0] transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(promo.id, promo.code)} className="p-1.5 rounded-lg text-[#75706B] hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
