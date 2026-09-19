"use client";

import React, { useState } from "react";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";
import { X, MessageCircle } from "lucide-react";

export const WhatsAppWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 font-sans print:hidden">
      {/* Expanded Quick Message Prompt Card */}
      {isOpen && (
        <div className="w-80 max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-[#EAE5DE] overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#075E54] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-white border border-white/20">
                <WhatsAppIcon className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#075E54]" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight tracking-wide">
                  {CONTACT_INFO.brandName}
                </h4>
                <p className="text-[10.5px] text-white/80">Typically replies instantly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat prompt"
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#F4EFEA]/50 space-y-3">
            <div className="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm border border-[#EAE5DE] text-xs text-[#1F1E1D] space-y-1">
              <p className="font-medium">
                Hello! Welcome to <strong>AKIK by Hafsa Khatri</strong> ✨
              </p>
              <p className="text-[#75706B] text-[11px] leading-relaxed">
                Have questions about our Embroidered Satin, Cotton Satin, or Lucknowi catalogues? Ask us directly on WhatsApp!
              </p>
            </div>

            <div className="text-[11px] text-[#75706B] px-1 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-[#1F1E1D]">
                <span>Direct Line:</span>
                <span className="text-[#C47D5A]">{CONTACT_INFO.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Instagram:</span>
                <a
                  href={CONTACT_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C47D5A] hover:underline font-medium"
                >
                  {CONTACT_INFO.instagramHandle}
                </a>
              </div>
            </div>

            {/* Direct CTA */}
            <a
              href={`https://wa.me/${CONTACT_INFO.phoneRaw}?text=${encodeURIComponent(
                "Hello AKIK by Hafsa Khatri! I am browsing your online store and would like to enquire about your luxury collections."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Start WhatsApp Chat</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Chat on WhatsApp with AKIK"
        className="group relative flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95"
      >
        <WhatsAppIcon className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Chat with Us
        </span>
        {/* Pulsing indicator */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
        </span>
      </button>
    </div>
  );
};
