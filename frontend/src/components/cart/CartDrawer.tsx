"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles,
  Tag,
  CheckCircle,
  Truck,
  CreditCard,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    orderSummary,
    totalItemCount,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = await applyPromoCode(promoInput);
    if (res.success) {
      setPromoMessage({ text: res.message, isError: false });
      setPromoInput("");
    } else {
      setPromoMessage({ text: res.message, isError: true });
    }
  };

  const progressPercent = Math.min(
    100,
    Math.round(
      (orderSummary.subtotal / orderSummary.freeShippingThreshold) * 100
    )
  );

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="fixed inset-0 bg-[#1F1E1D]/60 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#FAF9F6] text-[#1F1E1D] shadow-2xl z-50 flex flex-col justify-between overflow-hidden font-sans border-l border-[#EAE5DE]"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Bag Drawer"
          >
            {/* 1. Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAE5DE] bg-white">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#C47D5A]" />
                <h2 className="font-serif text-xl font-normal text-[#1F1E1D] tracking-wide">
                  Your Bag
                </h2>
                <span className="text-xs font-bold font-sans bg-[#F4EFEA] text-[#1F1E1D] px-2 py-0.5 rounded-full">
                  {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
                </span>
              </div>

              <button
                type="button"
                onClick={closeCart}
                aria-label="Close shopping bag"
                className="p-1.5 text-[#75706B] hover:text-[#1F1E1D] hover:bg-[#F4EFEA] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Free Shipping Progress Bar */}
            {cart.length > 0 && (
              <div className="bg-[#F4EFEA] border-b border-[#EAE5DE] px-6 py-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-[#1F1E1D]">
                    <Truck className="w-4 h-4 text-[#C47D5A]" />
                    {orderSummary.hasFreeShipping ? (
                      <span className="text-emerald-700 font-semibold">
                        You unlocked Free Express Shipping!
                      </span>
                    ) : (
                      <span>
                        Add{" "}
                        <strong className="text-[#C47D5A]">
                          ₹{orderSummary.amountNeededForFreeShipping.toLocaleString()}
                        </strong>{" "}
                        more to unlock Free Shipping!
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[#75706B]">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-1.5 bg-[#EAE5DE] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="h-full bg-[#C47D5A] rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Main Body: Cart Item List OR Empty State */}
            {cart.length === 0 ? (
              /* 5. Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F6]">
                <div className="w-20 h-20 rounded-full bg-white border border-[#EAE5DE] flex items-center justify-center shadow-sm mb-4">
                  <ShoppingBag className="w-9 h-9 text-[#C47D5A]/70" />
                </div>
                <h3 className="font-serif text-xl text-[#1F1E1D] mb-1.5 font-normal">
                  Your shopping bag is empty
                </h3>
                <p className="text-xs text-[#75706B] max-w-xs mb-6 leading-relaxed">
                  Discover our timeless luxury cotton satin suits, embroidered dupattas, and handcrafted ensembles.
                </p>

                <div className="flex flex-col gap-2.5 w-full max-w-xs">
                  <Link
                    href="/collections?collection=embroidered-satin"
                    onClick={closeCart}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1F1E1D] text-[#FAF9F6] text-xs font-semibold uppercase tracking-wider rounded-md hover:bg-[#C47D5A] transition-colors"
                  >
                    <span>Shop Embroidered Satin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/collections"
                    onClick={closeCart}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#EAE5DE] text-[#1F1E1D] text-xs font-semibold uppercase tracking-wider rounded-md hover:border-[#C47D5A] hover:text-[#C47D5A] transition-colors"
                  >
                    <span>Explore All Collections</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* 3. Cart Item List */
              <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#EAE5DE]">
                {cart.map((item) => {
                  const hasDiscount = item.regularPrice > item.discountedPrice;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="py-4 flex gap-4 first:pt-0 last:pb-0"
                    >
                      {/* Product Thumbnail (3:4 ratio) */}
                      <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded bg-[#F4EFEA] border border-[#EAE5DE]">
                        <Image
                          src={item.selectedColor.imageSrc}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover object-top"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={closeCart}
                              className="font-serif text-sm font-medium text-[#1F1E1D] hover:text-[#C47D5A] line-clamp-1 transition-colors"
                            >
                              {item.name}
                            </Link>

                            {/* Remove Action with quick undo toast */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              aria-label={`Remove ${item.name} from cart`}
                              className="text-[#75706B] hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Selected Variant: Color + Size */}
                          <div className="mt-1 flex items-center gap-2 text-xs text-[#75706B]">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                style={{
                                  backgroundColor: item.selectedColor.hexCode,
                                }}
                              />
                              {item.selectedColor.name}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-[#1F1E1D]">
                              Size: {item.selectedSize}
                            </span>
                          </div>

                          {/* Unit Price with strikethrough discount */}
                          <div className="mt-1.5 flex items-baseline gap-2">
                            <span className="font-sans text-sm font-bold text-[#1F1E1D]">
                              ₹{item.discountedPrice.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="font-sans text-xs text-[#75706B] line-through">
                                ₹{item.regularPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper Buttons (Capped at inventory limit) */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center border border-[#EAE5DE] rounded bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                              className="p-1.5 text-[#75706B] hover:text-[#1F1E1D] hover:bg-[#F4EFEA] transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="px-3 text-xs font-semibold text-[#1F1E1D]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              disabled={item.quantity >= item.maxInventory}
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                              className="p-1.5 text-[#75706B] hover:text-[#1F1E1D] hover:bg-[#F4EFEA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-xs font-bold text-[#1F1E1D]">
                            ₹{(item.discountedPrice * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* 4. Summary & Checkout Section */}
            {cart.length > 0 && (
              <div className="border-t border-[#EAE5DE] bg-white p-6 shadow-inner space-y-4">
                {/* Promo Code / Coupon collapsible field */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsPromoOpen((prev) => !prev)}
                    className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-[#C47D5A] hover:text-[#A8623E]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {appliedPromo
                        ? `Promo: ${appliedPromo.code} (${appliedPromo.discountPercentage}% OFF)`
                        : "Have a coupon code? Click to apply"}
                    </span>
                    <span className="text-xs font-mono">
                      {isPromoOpen ? "−" : "+"}
                    </span>
                  </button>

                  {/* Collapsible Coupon Input */}
                  {isPromoOpen && (
                    <div className="mt-2.5">
                      {appliedPromo ? (
                        <div className="flex items-center justify-between p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>
                              <strong>{appliedPromo.code}</strong> applied (-₹
                              {orderSummary.couponDiscount.toLocaleString()})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removePromoCode}
                            className="text-xs text-red-600 font-semibold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyPromo} className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            placeholder="e.g. FESTIVE15"
                            className="flex-1 text-xs px-3 py-2 border border-[#EAE5DE] rounded uppercase font-mono tracking-wider focus:outline-none focus:border-[#C47D5A]"
                          />
                          <button
                            type="submit"
                            className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#1F1E1D] text-white rounded hover:bg-[#C47D5A] transition-colors"
                          >
                            Apply
                          </button>
                        </form>
                      )}

                      {promoMessage && !appliedPromo && (
                        <p
                          className={`text-[11px] mt-1.5 ${
                            promoMessage.isError ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {promoMessage.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtotal, Shipping, and Savings Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#75706B]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#1F1E1D]">
                      ₹{orderSummary.subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#75706B]">
                    <span>Estimated Shipping</span>
                    <span>
                      {orderSummary.hasFreeShipping ? (
                        <span className="text-emerald-700 font-semibold uppercase">
                          FREE
                        </span>
                      ) : (
                        `₹${orderSummary.shippingFee}`
                      )}
                    </span>
                  </div>

                  {orderSummary.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon Discount</span>
                      <span>-₹{orderSummary.couponDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Calculated savings display (Prompt 5 requirement) */}
                  {orderSummary.discountSavings > 0 && (
                    <div className="p-2 rounded bg-[#F7EDE8] border border-[#C47D5A]/30 text-[#A8623E] text-[11px] font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#C47D5A]" />
                      <span>
                        You are saving{" "}
                        <strong className="font-bold">
                          ₹{orderSummary.discountSavings.toLocaleString()}
                        </strong>{" "}
                        on this order!
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-[#1F1E1D] pt-2 border-t border-[#EAE5DE]">
                    <span>Estimated Total</span>
                    <span>₹{orderSummary.finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* High-Contrast Checkout Button with Lock Icon */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#1F1E1D] hover:bg-[#C47D5A] text-[#FAF9F6] text-xs font-semibold uppercase tracking-wider rounded-md shadow-lg transition-all active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4 text-[#C47D5A]" />
                  <span>Proceed to Checkout</span>
                  <span>•</span>
                  <span>₹{orderSummary.finalTotal.toLocaleString()}</span>
                </Link>

                {/* Accepted Payment Method Badges (UPI, Cards, NetBanking, COD) */}
                <div className="pt-2 text-center">
                  <div className="flex items-center justify-center gap-3 text-[#75706B] text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#C47D5A]" /> UPI
                    </span>
                    <span>•</span>
                    <span>Cards (Visa/MC)</span>
                    <span>•</span>
                    <span>NetBanking</span>
                    <span>•</span>
                    <span>COD Available</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
