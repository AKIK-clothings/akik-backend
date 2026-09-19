"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";

export const Footer: React.FC = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-[#1A1918] text-[#FAF9F6] font-sans border-t border-[#33312E] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Main Compact Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand Info */}
          <div className="space-y-2 max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#C47D5A]/60 bg-white shrink-0 shadow-sm">
                <Image
                  src="/logo.jpeg"
                  alt="AKIK by Hafsa Khatri"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="leading-tight">
                <span className="font-serif text-xl font-bold tracking-[0.16em] uppercase text-white group-hover:text-[#C47D5A] transition-colors">
                  AKIK
                </span>
                <span className="block font-sans text-[10px] uppercase tracking-[0.22em] text-[#C47D5A] font-semibold">
                  By Hafsa Khatri
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#A8A49F] leading-relaxed">
              Factory-direct luxury ethnic couture featuring pure cotton satin ensembles, opulent resham embroidery, artisanal dupattas, and heritage Lucknowi Chikankari needlework.
            </p>
          </div>

          {/* Contact, WhatsApp & Instagram Links */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-[#C47D5A] text-white text-xs font-medium transition-all duration-200 border border-white/10 hover:border-[#C47D5A]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C47D5A]" />
              <span>Contact Us</span>
            </Link>

            <a
              href={CONTACT_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with AKIK on WhatsApp"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white text-xs font-medium transition-all duration-200 border border-[#25D366]/30"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" />
            </a>

            <a
              href={CONTACT_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit AKIK on Instagram"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#E1306C]/15 hover:bg-[#E1306C] text-[#F37299] hover:text-white text-xs font-medium transition-all duration-200 border border-[#E1306C]/30"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Instagram</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Divider and Bottom Row: Copyright + Builder Info */}
        <div className="pt-4 border-t border-[#2D2B28] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#8A857F]">
          {/* Exact Copyright line */}
          <p className="text-[#A8A49F]">
            © 2026 AKIK by Hafsa Khatri. All rights reserved.
          </p>

          {/* Builder Info */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-[#A8A49F]">
            <span>Designed &amp; Built by</span>
            <span className="text-white font-medium">Vaseena Labs (Vaseem)</span>
            <span className="text-[#4A4845]">·</span>
            <a
              href="tel:+919738176663"
              className="hover:text-[#C47D5A] transition-colors"
            >
              +91 97381 76663
            </a>
            <span className="text-[#4A4845]">·</span>
            <a
              href="mailto:vaseemdange.ac.in@gmail.com"
              className="hover:text-[#C47D5A] transition-colors"
            >
              vaseemdange.ac.in@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
