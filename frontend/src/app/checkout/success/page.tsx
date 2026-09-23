"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ShoppingBag, MessageCircle } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { InstagramIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order");
  const waUrl = searchParams.get("wa");

  useEffect(() => {
    if (!orderNumber) {
      router.replace("/collections");
    }
  }, [orderNumber, router]);

  if (!orderNumber) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] font-sans flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#C47D5A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] font-sans flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md">
              <Image src="/logo.jpeg" alt="AKIK" fill className="object-cover" sizes="32px" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl text-[#1F1E1D] font-normal">Order Placed! 🎉</h1>
          <p className="text-sm text-[#75706B] leading-relaxed">
            Your payment was successful. Your beautiful AKIK ensemble is now being prepared with love.
          </p>
          <div className="inline-block bg-[#1F1E1D] text-white px-6 py-3 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-[#C47D5A] font-semibold mb-0.5">Order Number</p>
            <p className="font-mono font-bold text-lg tracking-widest">{orderNumber}</p>
          </div>
        </div>

        {/* WhatsApp Receipt CTA — shown when wa param present (popup may have been blocked) */}
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-4 px-6 bg-[#25D366] hover:bg-[#1DAD58] text-white font-bold text-sm rounded-xl shadow-lg transition-colors"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Send My Order Confirmation on WhatsApp
          </a>
        )}

        {/* What happens next */}
        <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 text-left shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1F1E1D] text-sm">What happens next?</h2>
          <div className="space-y-3 text-sm text-[#75706B]">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-[#C47D5A]/15 text-[#C47D5A] rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <p>You&apos;ll receive an <strong className="text-[#1F1E1D]">order receipt on WhatsApp</strong> with full details on your mobile number.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-[#C47D5A]/15 text-[#C47D5A] rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <p>Your order will be <strong className="text-[#1F1E1D]">dispatched within 24-48 hours</strong> with a tracking number.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 bg-[#C47D5A]/15 text-[#C47D5A] rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <p>Questions? WhatsApp Hafsa at <a href={CONTACT_INFO.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-semibold hover:underline">{CONTACT_INFO.phone}</a>.</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/collections"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1F1E1D] text-white text-sm font-semibold rounded-xl hover:bg-[#C47D5A] transition-colors">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
          <a href={CONTACT_INFO.whatsappLink} target="_blank" rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#EAE5DE] text-[#1F1E1D] text-sm font-semibold rounded-xl hover:border-[#25D366] hover:text-[#25D366] transition-colors">
            <MessageCircle className="w-4 h-4" /> Contact Us
          </a>
        </div>

        <a href={CONTACT_INFO.instagramUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-[#A8A49F] hover:text-[#E1306C] transition-colors">
          <InstagramIcon className="w-3.5 h-3.5" />
          <span>Follow {CONTACT_INFO.instagramHandle} for new arrivals</span>
        </a>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C47D5A] border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}

