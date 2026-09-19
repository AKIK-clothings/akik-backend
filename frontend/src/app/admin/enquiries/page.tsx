"use client";

import React, { useEffect, useState } from "react";
import { Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  topic: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnread, setShowUnread] = useState(false);

  useEffect(() => { loadEnquiries(); }, [showUnread]);

  const loadEnquiries = async () => {
    setIsLoading(true);
    try {
      const { enquiries: data } = await adminApi.getEnquiries() as { enquiries: Enquiry[] };
      setEnquiries(showUnread ? data.filter((e) => !e.is_read) : data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await adminApi.markEnquiryRead(id);
      setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, is_read: true } : e));
    } catch (err) { console.error(err); }
  };

  const unreadCount = enquiries.filter((e) => !e.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1918]">Enquiries</h1>
          <p className="text-sm text-[#75706B] mt-1">{unreadCount} unread of {enquiries.length} total</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showUnread} onChange={(e) => setShowUnread(e.target.checked)} className="w-4 h-4 accent-[#C47D5A]" />
          <span className="text-sm text-[#1A1918] font-medium">Show unread only</span>
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-[#C47D5A] animate-spin" /></div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-12 text-center shadow-sm">
          <MessageSquare className="w-12 h-12 text-[#EAE5DE] mx-auto mb-3" />
          <p className="text-[#75706B] text-sm">No enquiries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((enquiry) => (
            <div key={enquiry.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${enquiry.is_read ? "border-[#EAE5DE] opacity-70" : "border-[#C47D5A]/40 ring-1 ring-[#C47D5A]/20"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-[#1A1918]">{enquiry.name}</span>
                    {enquiry.topic && (
                      <span className="px-2 py-0.5 bg-[#F5F3F0] text-[#75706B] text-xs rounded-full">{enquiry.topic}</span>
                    )}
                    {!enquiry.is_read && (
                      <span className="px-2 py-0.5 bg-[#C47D5A]/15 text-[#C47D5A] text-xs rounded-full font-semibold">New</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#75706B]">
                    {enquiry.phone && (
                      <a href={`tel:${enquiry.phone}`} className="hover:text-[#C47D5A] transition-colors">{enquiry.phone}</a>
                    )}
                    <span>{new Date(enquiry.created_at).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-sm text-[#1A1918] leading-relaxed bg-[#FAFAF8] px-4 py-3 rounded-lg border border-[#EAE5DE]">
                    {enquiry.message}
                  </p>
                  {enquiry.phone && (
                    <a
                      href={`https://wa.me/${enquiry.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${enquiry.name}! Thank you for reaching out to AKIK by Hafsa Khatri.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#25D366] hover:underline font-medium"
                    >
                      Reply on WhatsApp ↗
                    </a>
                  )}
                </div>
                {!enquiry.is_read && (
                  <button onClick={() => handleMarkRead(enquiry.id)} title="Mark as read"
                    className="shrink-0 p-2 text-[#75706B] hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
