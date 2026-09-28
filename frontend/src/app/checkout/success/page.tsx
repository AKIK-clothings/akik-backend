"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { InstagramIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";
import { api } from "@/lib/api";
import { OrderReceiptCard, OrderReceiptData } from "@/components/checkout/OrderReceiptCard";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order");
  const phone = searchParams.get("phone");
  const waUrl = searchParams.get("wa");

  const [orderData, setOrderData] = useState<OrderReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      router.replace("/collections");
      return;
    }

    if (phone) {
      api
        .trackOrder(orderNumber, phone)
        .then((res) => {
          if (res?.order) {
            setOrderData(res.order);
          }
        })
        .catch((err) => {
          console.error("Order fetch error on success page:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderNumber, phone, router]);

  if (!orderNumber) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] font-sans flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#C47D5A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] font-sans py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#EAE5DE] p-12 text-center shadow-sm space-y-3">
            <Loader2 className="w-7 h-7 text-[#C47D5A] animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#75706B] font-semibold">
              Generating Official Bill & Order Receipt...
            </p>
          </div>
        ) : orderData ? (
          /* Exact Reference Image Receipt & Invoice View */
          <OrderReceiptCard order={orderData} showTrackerLink={true} />
        ) : (
          /* Fallback view if phone wasn't passed in URL */
          <div className="bg-white rounded-2xl border border-[#EAE5DE] p-6 sm:p-8 text-center shadow-sm space-y-6">
            <div className="w-12 h-12 rounded-full border-2 border-[#1E6091] flex items-center justify-center text-[#1E6091] mx-auto bg-blue-50/40">
              <span className="text-xl font-bold">✓</span>
            </div>
            <div>
              <p className="text-xs text-[#75706B] uppercase tracking-wider font-semibold">
                Confirmation #{orderNumber}
              </p>
              <h1 className="text-2xl font-bold text-[#1F1E1D] mt-1">Thank you!</h1>
              <p className="text-xs sm:text-sm text-[#75706B] mt-2">
                Your order is confirmed and logged in our system.
              </p>
            </div>

            <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#EAE5DE] text-left text-xs space-y-2">
              <p className="font-bold text-[#1F1E1D]">Track Your Order Anytime</p>
              <p className="text-[#75706B]">
                Enter your Order Number (<strong>{orderNumber}</strong>) and your registered 10-digit mobile number to view live tailoring and dispatch status.
              </p>
            </div>

            <Link
              href={`/track-order?order=${encodeURIComponent(orderNumber)}`}
              className="w-full py-3.5 px-6 bg-[#1F1E1D] hover:bg-[#C47D5A] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              <span>Track Order Live</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Continue Shopping Footer */}
        <div className="text-center pt-2 print:hidden space-y-3">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#1F1E1D] hover:text-[#C47D5A] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping Collections</span>
          </Link>
          <div>
            <a
              href={CONTACT_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-[#A8A49F] hover:text-[#E1306C] transition-colors"
            >
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>Follow {CONTACT_INFO.instagramHandle} for bespoke styling</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C47D5A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
