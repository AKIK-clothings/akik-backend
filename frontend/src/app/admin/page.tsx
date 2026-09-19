"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, Package, Tag, MessageSquare, TrendingUp, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  newOrders: number;
  totalRevenue: number;
  unreadEnquiries: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = () => {
    setIsLoading(true);
    setError(null);
    adminApi
      .getStats()
      .then(setStats)
      .catch((err) => {
        console.error("Dashboard stats error:", err);
        setError("Could not load dashboard stats. Is the backend server online?");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = stats
    ? [
        { label: "Active Products", value: stats.totalProducts, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Total Orders", value: stats.totalOrders, icon: Package, color: "text-[#C47D5A]", bg: "bg-[#C47D5A]/10" },
        { label: "New Orders", value: stats.newOrders, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", badge: stats.newOrders > 0 },
        { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: Tag, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Unread Enquiries", value: stats.unreadEnquiries, icon: MessageSquare, color: "text-yellow-500", bg: "bg-yellow-500/10" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1918]">Dashboard</h1>
        <p className="text-sm text-[#75706B] mt-1">AKIK by Hafsa Khatri — Store Overview</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={loadStats}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-[#C47D5A] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-[#EAE5DE] p-5 shadow-sm">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-[#1A1918]">{value}</p>
              <p className="text-xs text-[#75706B] mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm">
        <h2 className="font-semibold text-[#1A1918] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/products/new" className="px-4 py-2 bg-[#C47D5A] text-white text-sm font-medium rounded-lg hover:bg-[#A86947] transition-colors">
            + Add New Product
          </a>
          <a href="/admin/orders" className="px-4 py-2 bg-[#1A1918] text-white text-sm font-medium rounded-lg hover:bg-[#2D2B28] transition-colors">
            View Orders
          </a>
          <a href="/admin/promos" className="px-4 py-2 bg-white border border-[#EAE5DE] text-[#1A1918] text-sm font-medium rounded-lg hover:bg-[#F5F3F0] transition-colors">
            Manage Promos
          </a>
          <a href="/admin/enquiries" className="px-4 py-2 bg-white border border-[#EAE5DE] text-[#1A1918] text-sm font-medium rounded-lg hover:bg-[#F5F3F0] transition-colors">
            View Enquiries
          </a>
        </div>
      </div>
    </div>
  );
}
