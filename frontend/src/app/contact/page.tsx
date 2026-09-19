"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Clock,
  MapPin,
  Sparkles,
  Send,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/Icons";
import { CONTACT_INFO } from "@/data/contactInfo";
import { api } from "@/lib/api";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    topic: "Product Enquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitEnquiry({
        name: formData.name,
        phone: formData.phone,
        topic: formData.topic,
        message: formData.message,
      });
      setSubmitted(true);
      const text = `Hello AKIK by Hafsa Khatri,\n\n*Name:* ${formData.name}\n*Contact:* ${formData.phone}\n*Inquiry Topic:* ${formData.topic}\n*Message:* ${formData.message}`;
      setFormData({ name: "", phone: "", topic: "Product Enquiry", message: "" });
      window.open(
        `https://wa.me/${CONTACT_INFO.phoneRaw}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err: unknown) {
      console.warn("Backend enquiry submission fallback:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to record enquiry. Please message us on WhatsApp directly.";
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-24">
      {/* Header Banner */}
      <div className="border-b border-[#EAE5DE] bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#C47D5A]">
            Client Concierge & Ateliers
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1F1E1D] font-normal tracking-wide mt-2">
            Contact AKIK by Hafsa Khatri
          </h1>
          <p className="text-xs sm:text-sm text-[#75706B] mt-3 max-w-xl mx-auto leading-relaxed">
            Have questions regarding our catalogue, styling, or custom tailoring? Connect directly with us via WhatsApp, Instagram, or phone.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Three Primary Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: WhatsApp (Featured) */}
          <div className="relative p-6 rounded-2xl bg-white border-2 border-[#25D366]/40 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
                <WhatsAppIcon className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-full mb-1">
                  Fastest Response
                </span>
                <h3 className="font-serif text-lg text-[#1F1E1D] font-semibold">
                  WhatsApp Concierge
                </h3>
                <p className="text-xs text-[#75706B] mt-1 leading-relaxed">
                  Chat directly with designer Hafsa Khatri for live product videos, fabric drape queries, and quick checkout assistance.
                </p>
              </div>
              <p className="text-sm font-bold text-[#1F1E1D]">{CONTACT_INFO.phone}</p>
            </div>

            <div className="pt-5">
              <a
                href={`https://wa.me/${CONTACT_INFO.phoneRaw}?text=${encodeURIComponent(
                  "Hello AKIK by Hafsa Khatri! I am reaching out from your website and would love to enquire about your collections."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-all active:scale-95"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Instagram */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAE5DE] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C]">
                <InstagramIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-[#E1306C] bg-[#E1306C]/10 px-2 py-0.5 rounded-full mb-1">
                  Official Profile
                </span>
                <h3 className="font-serif text-lg text-[#1F1E1D] font-semibold">
                  Instagram
                </h3>
                <p className="text-xs text-[#75706B] mt-1 leading-relaxed">
                  Follow us for new catalogue drops, customer style stories, and behind-the-scenes embroidery craftsmanship.
                </p>
              </div>
              <p className="text-sm font-bold text-[#1F1E1D]">{CONTACT_INFO.instagramHandle}</p>
            </div>

            <div className="pt-5">
              <a
                href={CONTACT_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1F1E1D] hover:bg-[#E1306C] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-all active:scale-95"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Visit Instagram</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 3: Direct Phone & Hours */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAE5DE] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#C47D5A]/15 flex items-center justify-center text-[#C47D5A]">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-[#C47D5A] bg-[#C47D5A]/10 px-2 py-0.5 rounded-full mb-1">
                  Telephone
                </span>
                <h3 className="font-serif text-lg text-[#1F1E1D] font-semibold">
                  Direct Call
                </h3>
                <p className="text-xs text-[#75706B] mt-1 leading-relaxed">
                  Speak directly with our boutique styling team for bulk bridal or celebratory attire consultations.
                </p>
              </div>
              <p className="text-sm font-bold text-[#1F1E1D]">{CONTACT_INFO.phone}</p>
            </div>

            <div className="pt-5">
              <a
                href={CONTACT_INFO.telLink}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-[#F4EFEA] border-2 border-[#1F1E1D] text-[#1F1E1D] text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>

        {/* Quick WhatsApp Inquiry Form & Atelier Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-[#EAE5DE] shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C47D5A] mb-2">
              <MessageSquare className="w-4 h-4" />
              <span>Send An Instant Enquiry</span>
            </div>
            <h2 className="font-serif text-2xl text-[#1F1E1D] font-normal mb-2">
              How can we assist you today?
            </h2>
            <p className="text-xs text-[#75706B] mb-6">
              Fill in your details below. Clicking "Send Enquiry on WhatsApp" will prepare your message instantly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {submitted && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Enquiry Sent Successfully!</p>
                    <p className="text-green-700 mt-0.5 text-xs">
                      Thank you! Hafsa Khatri & the AKIK team will connect with you on WhatsApp shortly.
                    </p>
                  </div>
                </div>
              )}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <span className="font-semibold">Notice:</span> {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1F1E1D] mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ayesha Patel"
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C47D5A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1F1E1D] mb-1.5">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={20}
                    pattern="[\d\s\+\-\(\)]+"
                    title="Please enter a valid phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C47D5A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1F1E1D] mb-1.5">
                  Enquiry Topic
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C47D5A]"
                >
                  <option value="Embroidered Satin Collection (₹2,500)">
                    Embroidered Satin Collection (₹2,500)
                  </option>
                  <option value="Luxury Cotton Satin Catalogue (₹2,000)">
                    Luxury Cotton Satin Catalogue (₹2,000)
                  </option>
                  <option value="Satin Lucknowi Collection (₹2,250)">
                    Satin Lucknowi Collection (₹2,250)
                  </option>
                  <option value="Size & Tailoring Guidance">Size & Tailoring Guidance</option>
                  <option value="Order Tracking & Delivery">Order Tracking & Delivery</option>
                  <option value="Custom Bridal & Bulk Order">Custom Bridal & Bulk Order</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1F1E1D] mb-1.5">
                  Your Message or Product SKU
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={1000}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share details about the piece you're interested in, preferred size, or any styling questions..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE5DE] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C47D5A]"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-[0.99]"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span>Send Enquiry on WhatsApp</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Atelier Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1F1E1D] text-white p-6 sm:p-7 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C47D5A]">
                <Sparkles className="w-4 h-4" />
                <span>Atelier Information</span>
              </div>
              <h3 className="font-serif text-xl font-normal">
                {CONTACT_INFO.brandName}
              </h3>
              <p className="text-xs text-[#A8A49F] leading-relaxed">
                Every ensemble is crafted under the artisanal direction of {CONTACT_INFO.designer}, ensuring exquisite needlework, breathable cotton satin textures, and generous tailoring margins.
              </p>

              <div className="space-y-3 pt-2 text-xs border-t border-white/15">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#C47D5A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Boutique Hours:</span>
                    <p className="text-[#A8A49F]">{CONTACT_INFO.workingHours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#C47D5A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Direct Line:</span>
                    <p className="text-[#A8A49F]">{CONTACT_INFO.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#C47D5A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Quality Guarantee:</span>
                    <p className="text-[#A8A49F]">100% Authentic Handloom with 7-day easy exchange across India.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Collections Link Box */}
            <div className="p-5 rounded-xl bg-white border border-[#EAE5DE] space-y-2 text-xs">
              <span className="font-semibold text-[#1F1E1D]">Looking to browse our collections first?</span>
              <p className="text-[#75706B] leading-relaxed">
                Explore our three master edits with direct factory pricing:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/collections?collection=embroidered-satin"
                  className="px-3 py-1.5 rounded bg-[#FAF9F6] border border-[#EAE5DE] text-[#1F1E1D] hover:border-[#C47D5A] hover:text-[#C47D5A] font-medium"
                >
                  Embroidered Satin (₹2,500)
                </Link>
                <Link
                  href="/collections?collection=luxury-cotton-satin"
                  className="px-3 py-1.5 rounded bg-[#FAF9F6] border border-[#EAE5DE] text-[#1F1E1D] hover:border-[#C47D5A] hover:text-[#C47D5A] font-medium"
                >
                  Cotton Satin (₹2,000)
                </Link>
                <Link
                  href="/collections?collection=satin-lucknowi"
                  className="px-3 py-1.5 rounded bg-[#FAF9F6] border border-[#EAE5DE] text-[#1F1E1D] hover:border-[#C47D5A] hover:text-[#C47D5A] font-medium"
                >
                  Satin Lucknowi (₹2,250)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
