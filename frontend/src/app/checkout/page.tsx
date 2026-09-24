"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Lock, Truck, Tag, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, orderSummary, appliedPromo, applyPromoCode, removePromoCode, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    addressLine1: "", addressLine2: "", city: "", state: "", pinCode: "", deliveryNotes: "",
  });
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Redirect to collections if cart is empty
  useEffect(() => {
    if (cart.length === 0) router.push("/collections");
  }, [cart, router]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        return "";
      case "phone": {
        const cleanPhone = value.replace(/\s/g, "");
        if (!cleanPhone) return "Mobile number is required";
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) return "Enter a valid 10-digit Indian mobile number";
        return "";
      }
      case "email":
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Please enter a valid email address";
        }
        return "";
      case "addressLine1":
        if (!value.trim()) return "Street address is required";
        if (value.trim().length < 5) return "Please enter a complete street address";
        return "";
      case "city":
        if (!value.trim()) return "City is required";
        return "";
      case "state":
        if (!value.trim()) return "Please select a state";
        return "";
      case "pinCode":
        if (!value.trim()) return "PIN code is required";
        if (!/^\d{6}$/.test(value.trim())) return "Enter a valid 6-digit PIN code";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const errorMsg = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    try {
      const result = await api.validatePromo(promoInput, orderSummary.subtotal);
      if (result.valid && result.promo) {
        applyPromoCode(promoInput);
        setPromoMsg({ text: result.message, isError: false });
      } else {
        setPromoMsg({ text: result.message, isError: true });
      }
    } catch {
      setPromoMsg({ text: "Failed to validate promo code", isError: true });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (cart.length === 0) return;

    const errors: Record<string, string> = {
      name: validateField("name", form.name),
      phone: validateField("phone", form.phone),
      email: validateField("email", form.email),
      addressLine1: validateField("addressLine1", form.addressLine1),
      city: validateField("city", form.city),
      state: validateField("state", form.state),
      pinCode: validateField("pinCode", form.pinCode),
    };

    const hasErrors = Object.values(errors).some((err) => Boolean(err));
    if (hasErrors) {
      setFieldErrors(errors);
      setTouched({
        name: true,
        phone: true,
        email: true,
        addressLine1: true,
        city: true,
        state: true,
        pinCode: true,
      });
      setError("Please review and complete all required fields below.");
      return;
    }

    setIsProcessing(true);
    try {
      const checkoutItems = cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        unitPrice: item.discountedPrice,
      }));

      // Step 1: Create Razorpay order
      const { razorpayOrderId, amount, currency, keyId } = await api.createCheckoutOrder({
        items: checkoutItems,
        subtotal: orderSummary.subtotal,
        couponDiscount: orderSummary.couponDiscount,
        shippingFee: orderSummary.shippingFee,
        promoCode: appliedPromo?.code,
      });

      const clientKeyId =
        keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

      if (!clientKeyId) {
        throw new Error("Payment gateway is temporarily unconfigured. Please contact support.");
      }

      // Step 2: Open Razorpay popup
      const rzp = new window.Razorpay({
        key: clientKeyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "AKIK by Hafsa Khatri",
        description: `${cart.length} item(s) — Ethnic Couture`,
        image: "/logo.jpeg",
        prefill: {
          name: form.name,
          contact: form.phone,
          email: form.email,
        },
        theme: { color: "#C47D5A" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // Step 3: Verify payment & save order
            const { orderNumber, customerWhatsAppUrl } = await api.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items: checkoutItems,
              customer: form,
              subtotal: orderSummary.subtotal,
              couponDiscount: orderSummary.couponDiscount,
              shippingFee: orderSummary.shippingFee,
              promoCode: appliedPromo?.code,
            });

            // Open WA on the customer's own number with their order receipt
            if (customerWhatsAppUrl) {
              window.open(customerWhatsAppUrl, "_blank", "noopener,noreferrer");
            }

            // Clear cart and redirect to success (pass wa URL as fallback for blocked popups)
            clearCart();
            const waParam = customerWhatsAppUrl ? `&wa=${encodeURIComponent(customerWhatsAppUrl)}` : "";
            router.push(`/checkout/success?order=${orderNumber}${waParam}`);
          } catch (err) {
            setError("Payment was successful but we couldn't save your order. Please WhatsApp us immediately with your payment ID: " + response.razorpay_payment_id);
            console.error(err);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) return null;

  const FREE_SHIPPING_THRESHOLD = 3000;

  return (
    <main className="min-h-screen bg-[#FAF9F6] font-sans py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/collections" className="text-xs text-[#75706B] hover:text-[#C47D5A] transition-colors">← Continue Shopping</Link>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1F1E1D] font-normal mt-2">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT: Delivery Form ── */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handlePayment} id="checkout-form" className="space-y-6">
              {/* Contact */}
              <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-[#1F1E1D] flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#C47D5A] text-white text-xs rounded-full flex items-center justify-center font-bold">1</span>
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-invalid={!!(touched.name && fieldErrors.name)}
                      placeholder="Priya Sharma"
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors bg-[#FAFAF8] ${
                        touched.name && fieldErrors.name
                          ? "border-red-400 focus:border-red-500 bg-red-50/20"
                          : "border-[#EAE5DE] focus:border-[#C47D5A]"
                      }`}
                    />
                    {touched.name && fieldErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Mobile Number *</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      type="tel"
                      aria-invalid={!!(touched.phone && fieldErrors.phone)}
                      placeholder="9876543210"
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors bg-[#FAFAF8] ${
                        touched.phone && fieldErrors.phone
                          ? "border-red-400 focus:border-red-500 bg-red-50/20"
                          : "border-[#EAE5DE] focus:border-[#C47D5A]"
                      }`}
                    />
                    {touched.phone && fieldErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Email (Optional)</label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      type="email"
                      aria-invalid={!!(touched.email && fieldErrors.email)}
                      placeholder="priya@email.com"
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors bg-[#FAFAF8] ${
                        touched.email && fieldErrors.email
                          ? "border-red-400 focus:border-red-500 bg-red-50/20"
                          : "border-[#EAE5DE] focus:border-[#C47D5A]"
                      }`}
                    />
                    {touched.email && fieldErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-xl border border-[#EAE5DE] p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-[#1F1E1D] flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#C47D5A] text-white text-xs rounded-full flex items-center justify-center font-bold">2</span>
                  Delivery Address
                </h2>
                <div>
                  <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">House No., Building & Street *</label>
                  <input
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={!!(touched.addressLine1 && fieldErrors.addressLine1)}
                    placeholder="Flat 4B, Sunshine Apartments, MG Road"
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors bg-[#FAFAF8] ${
                      touched.addressLine1 && fieldErrors.addressLine1
                        ? "border-red-400 focus:border-red-500 bg-red-50/20"
                        : "border-[#EAE5DE] focus:border-[#C47D5A]"
                    }`}
                  />
                  {touched.addressLine1 && fieldErrors.addressLine1 && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.addressLine1}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Area / Landmark (Optional)</label>
                  <input
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    placeholder="Near Central Park, Andheri West"
                    className="w-full px-4 py-3 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] bg-[#FAFAF8] transition-colors"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">City *</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-invalid={!!(touched.city && fieldErrors.city)}
                      placeholder="Mumbai"
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors bg-[#FAFAF8] ${
                        touched.city && fieldErrors.city
                          ? "border-red-400 focus:border-red-500 bg-red-50/20"
                          : "border-[#EAE5DE] focus:border-[#C47D5A]"
                      }`}
                    />
                    {touched.city && fieldErrors.city && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">State *</label>
                    <div className="relative">
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        aria-invalid={!!(touched.state && fieldErrors.state)}
                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none appearance-none transition-colors bg-[#FAFAF8] ${
                          touched.state && fieldErrors.state
                            ? "border-red-400 focus:border-red-500 bg-red-50/20"
                            : "border-[#EAE5DE] focus:border-[#C47D5A]"
                        }`}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49F] pointer-events-none" />
                    </div>
                    {touched.state && fieldErrors.state && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">PIN Code *</label>
                    <input
                      name="pinCode"
                      value={form.pinCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      maxLength={6}
                      aria-invalid={!!(touched.pinCode && fieldErrors.pinCode)}
                      placeholder="400001"
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors bg-[#FAFAF8] ${
                        touched.pinCode && fieldErrors.pinCode
                          ? "border-red-400 focus:border-red-500 bg-red-50/20"
                          : "border-[#EAE5DE] focus:border-[#C47D5A]"
                      }`}
                    />
                    {touched.pinCode && fieldErrors.pinCode && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.pinCode}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#75706B] mb-1.5 uppercase tracking-wider">Delivery Notes (Optional)</label>
                  <textarea name="deliveryNotes" value={form.deliveryNotes} onChange={handleChange} rows={2}
                    placeholder="E.g. Please call before delivery, leave with neighbor if not home..."
                    className="w-full px-4 py-3 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] bg-[#FAFAF8] resize-none transition-colors" />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
            </form>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Items */}
            <div className="bg-white rounded-xl border border-[#EAE5DE] p-5 shadow-sm">
              <h2 className="font-semibold text-[#1F1E1D] mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#C47D5A]" />
                Your Items ({cart.length})
              </h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#F5F3F0] border border-[#EAE5DE] shrink-0">
                      <Image src={item.selectedColor.imageSrc} alt={item.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1F1E1D] line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-xs text-[#75706B] mt-0.5">{item.selectedColor.name} · {item.selectedSize} · Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#1F1E1D] shrink-0">₹{(item.discountedPrice * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Code */}
            <div className="bg-white rounded-xl border border-[#EAE5DE] p-5 shadow-sm">
              {appliedPromo ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs font-semibold text-green-700">{appliedPromo.code} applied</p>
                      <p className="text-xs text-[#75706B]">{appliedPromo.description}</p>
                    </div>
                  </div>
                  <button onClick={removePromoCode} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A49F]" />
                    <input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo code (e.g. FESTIVE15)"
                      className="w-full pl-9 pr-3 py-2.5 border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] font-mono uppercase tracking-wider transition-colors" />
                  </div>
                  <button type="submit" className="px-4 py-2.5 bg-[#1F1E1D] text-white text-xs font-semibold rounded-lg hover:bg-[#C47D5A] transition-colors">
                    Apply
                  </button>
                </form>
              )}
              {promoMsg && (
                <p className={`text-xs mt-2 ${promoMsg.isError ? "text-red-600" : "text-green-600"}`}>{promoMsg.text}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl border border-[#EAE5DE] p-5 shadow-sm space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#75706B]">Subtotal</span>
                <span className="font-medium text-[#1F1E1D]">₹{orderSummary.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {orderSummary.discountSavings > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Savings</span>
                  <span className="font-medium text-green-600">−₹{orderSummary.discountSavings.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#75706B] flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                <span className={orderSummary.hasFreeShipping ? "text-green-600 font-medium" : "font-medium text-[#1F1E1D]"}>
                  {orderSummary.hasFreeShipping ? "FREE ✓" : `₹${orderSummary.shippingFee}`}
                </span>
              </div>
              {!orderSummary.hasFreeShipping && (
                <p className="text-xs text-[#A8A49F]">Add ₹{orderSummary.amountNeededForFreeShipping.toLocaleString("en-IN")} more for free shipping</p>
              )}
              <div className="border-t border-[#EAE5DE] pt-2.5 flex justify-between">
                <span className="font-bold text-[#1F1E1D]">Total</span>
                <span className="font-bold text-xl text-[#1F1E1D]">₹{orderSummary.finalTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              form="checkout-form"
              disabled={isProcessing}
              className="w-full py-4 bg-[#C47D5A] hover:bg-[#A86947] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><Lock className="w-4 h-4" /> Pay ₹{orderSummary.finalTotal.toLocaleString("en-IN")} Securely</>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-[#A8A49F]">
              <Lock className="w-3 h-3" />
              <span>Secured by Razorpay · UPI · Cards · Net Banking · Wallets</span>
            </div>

            {/* Free Shipping Banner */}
            {orderSummary.subtotal < FREE_SHIPPING_THRESHOLD && (
              <div className="flex items-center gap-2 p-3 bg-[#F5F3F0] rounded-lg border border-[#EAE5DE]">
                <Truck className="w-4 h-4 text-[#C47D5A] shrink-0" />
                <p className="text-xs text-[#75706B]">
                  Add ₹{(FREE_SHIPPING_THRESHOLD - orderSummary.subtotal).toLocaleString("en-IN")} more to unlock <strong>Free Shipping</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
