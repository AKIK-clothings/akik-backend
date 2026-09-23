"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Package, ChevronDown, MapPin, Phone, Mail, StickyNote, Calendar } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pin_code: string;
  delivery_notes?: string;
  final_total: number;
  subtotal: number;
  shipping_fee: number;
  coupon_discount: number;
  promo_code?: string;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: Array<{ product_name: string; quantity: number; selected_size: string; unit_price: number }>;
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
  const [dateFilter, setDateFilter] = useState(""); // "" = all, "YYYY-MM-DD" = specific day
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Helper: today's date as YYYY-MM-DD in local time
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, dateFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const parts: string[] = [];
      if (statusFilter !== "all") parts.push(`status=${statusFilter}`);
      if (dateFilter) parts.push(`date=${dateFilter}`);
      const { orders: data } = (await adminApi.getOrders(parts.join("&"))) as { orders: Order[] };
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1918]">Orders</h1>
          <p className="text-sm text-[#75706B] mt-1">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
            {dateFilter ? ` on ${new Date(dateFilter + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date shortcuts */}
          <button
            onClick={() => setDateFilter(todayStr())}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              dateFilter === todayStr()
                ? "bg-[#C47D5A] text-white border-[#C47D5A]"
                : "bg-white border-[#EAE5DE] text-[#75706B] hover:border-[#C47D5A] hover:text-[#C47D5A]"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter("")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              dateFilter === ""
                ? "bg-[#1A1918] text-white border-[#1A1918]"
                : "bg-white border-[#EAE5DE] text-[#75706B] hover:border-[#1A1918] hover:text-[#1A1918]"
            }`}
          >
            All
          </button>

          {/* Date picker */}
          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-[#A8A49F] pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white border border-[#EAE5DE] rounded-lg text-xs focus:outline-none focus:border-[#C47D5A] text-[#1A1918] cursor-pointer"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EAE5DE] rounded-lg text-xs focus:outline-none focus:border-[#C47D5A]"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <button
            onClick={loadOrders}
            className="px-3 py-2 bg-white border border-[#EAE5DE] rounded-lg text-xs font-medium text-[#75706B] hover:border-[#C47D5A] hover:text-[#C47D5A] transition-colors"
          >
            Refresh
          </button>
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
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-[#C47D5A] animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-[#EAE5DE] mx-auto mb-3" />
          <p className="text-[#75706B] text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const fullAddress = [
              order.address_line1,
              order.address_line2,
              order.city,
              order.state,
              order.pin_code,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-[#EAE5DE] shadow-sm hover:shadow-md transition-shadow"
              >
                {/* ── Top Row ── */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Order ID + Status badges */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-[#1A1918] font-mono">{order.order_number}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.payment_status === "paid" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Paid ✓
                          </span>
                        )}
                      </div>

                      {/* Customer name */}
                      <p className="text-sm font-semibold text-[#1A1918]">{order.customer_name}</p>

                      {/* Contact row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#75706B]">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone}
                        </span>
                        {order.customer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {order.customer_email}
                          </span>
                        )}
                      </div>

                      {/* Compact address */}
                      <p className="text-xs text-[#75706B] flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-[#C47D5A]" />
                        <span className="line-clamp-1">{fullAddress}</span>
                      </p>

                      {/* Date */}
                      <p className="text-xs text-[#A8A49F]">
                        {new Date(order.created_at).toLocaleString("en-IN")}
                      </p>

                      {/* Items compact */}
                      {order.order_items?.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {order.order_items.map((item, i) => (
                            <p key={i} className="text-xs text-[#75706B]">
                              {item.product_name} — {item.selected_size} × {item.quantity}
                              {item.unit_price ? ` @ ₹${item.unit_price.toLocaleString("en-IN")}` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Total + Status changer */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <p className="text-lg font-bold text-[#1A1918]">
                        ₹{order.final_total.toLocaleString("en-IN")}
                      </p>
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className="pl-3 pr-8 py-2 bg-[#F5F3F0] border border-[#EAE5DE] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C47D5A] disabled:opacity-60 appearance-none cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        {updatingId === order.id ? (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-[#C47D5A]" />
                        ) : (
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#75706B] pointer-events-none" />
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="text-xs text-[#C47D5A] hover:underline"
                      >
                        {isExpanded ? "Hide details ▲" : "Full address ▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Expanded: Full Address + Order Summary ── */}
                {isExpanded && (
                  <div className="border-t border-[#EAE5DE] bg-[#FAFAF8] px-5 py-4 rounded-b-xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Delivery Address */}
                      <div className="space-y-1">
                        <p className="font-semibold text-[#1A1918] uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#C47D5A]" /> Delivery Address
                        </p>
                        <p className="text-[#1A1918] font-medium">{order.customer_name}</p>
                        <p className="text-[#75706B]">{order.address_line1}</p>
                        {order.address_line2 && (
                          <p className="text-[#75706B]">{order.address_line2}</p>
                        )}
                        <p className="text-[#75706B]">
                          {order.city}, {order.state} — {order.pin_code}
                        </p>
                        <p className="flex items-center gap-1 text-[#75706B] mt-1">
                          <Phone className="w-3 h-3" /> {order.customer_phone}
                        </p>
                        {order.customer_email && (
                          <p className="flex items-center gap-1 text-[#75706B]">
                            <Mail className="w-3 h-3" /> {order.customer_email}
                          </p>
                        )}
                        {order.delivery_notes && (
                          <p className="flex items-start gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                            <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{order.delivery_notes}</span>
                          </p>
                        )}
                      </div>

                      {/* Order Summary */}
                      <div className="space-y-1">
                        <p className="font-semibold text-[#1A1918] uppercase tracking-wider text-[10px]">
                          Order Summary
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[#75706B]">
                            <span>Subtotal</span>
                            <span>₹{(order.subtotal || 0).toLocaleString("en-IN")}</span>
                          </div>
                          {order.coupon_discount > 0 && (
                            <div className="flex justify-between text-green-700">
                              <span>Discount {order.promo_code && `(${order.promo_code})`}</span>
                              <span>−₹{order.coupon_discount.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[#75706B]">
                            <span>Shipping</span>
                            <span>
                              {order.shipping_fee === 0 ? (
                                <span className="text-green-700">FREE</span>
                              ) : (
                                `₹${order.shipping_fee.toLocaleString("en-IN")}`
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-[#1A1918] border-t border-[#EAE5DE] pt-1 mt-1">
                            <span>Total Paid</span>
                            <span>₹{order.final_total.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Items detail */}
                        {order.order_items?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#EAE5DE] space-y-1">
                            <p className="font-semibold text-[#1A1918] uppercase tracking-wider text-[10px]">
                              Items
                            </p>
                            {order.order_items.map((item, i) => (
                              <div key={i} className="flex justify-between text-[#75706B]">
                                <span>
                                  {item.product_name} ({item.selected_size}) × {item.quantity}
                                </span>
                                {item.unit_price && (
                                  <span>₹{(item.unit_price * item.quantity).toLocaleString("en-IN")}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
