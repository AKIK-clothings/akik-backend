"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Package, ChevronDown } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  final_total: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: Array<{ product_name: string; quantity: number; selected_size: string }>;
}

const STATUS_OPTIONS = ["new", "confirmed", "dispatched", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  confirmed: "bg-yellow-100 text-yellow-700",
  dispatched: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = statusFilter !== "all" ? `status=${statusFilter}` : "";
      const { orders: data } = (await adminApi.getOrders(params)) as { orders: Order[] };
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders. Please check backend connection and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) { alert("Failed to update status"); console.error(err); }
    finally { setUpdatingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1918]">Orders</h1>
          <p className="text-sm text-[#75706B] mt-1">{orders.length} orders</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#75706B] font-medium uppercase tracking-wider">Filter:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A]">
            <option value="all">All Orders</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={loadOrders}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-[#C47D5A] animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-[#EAE5DE] mx-auto mb-3" />
          <p className="text-[#75706B] text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-[#EAE5DE] p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-[#1A1918] font-mono">{order.order_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                    {order.payment_status === "paid" && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid ✓</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#1A1918]">{order.customer_name}</p>
                  <p className="text-xs text-[#75706B]">{order.customer_phone}</p>
                  <p className="text-xs text-[#A8A49F]">{new Date(order.created_at).toLocaleString("en-IN")}</p>
                  {order.order_items?.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {order.order_items.map((item, i) => (
                        <p key={i} className="text-xs text-[#75706B]">
                          {item.product_name} — {item.selected_size} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <p className="text-lg font-bold text-[#1A1918]">₹{order.final_total.toLocaleString("en-IN")}</p>
                  <div className="relative">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className="pl-3 pr-8 py-2 bg-[#F5F3F0] border border-[#EAE5DE] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C47D5A] disabled:opacity-60 appearance-none cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    {updatingId === order.id
                      ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-[#C47D5A]" />
                      : <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#75706B] pointer-events-none" />
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
