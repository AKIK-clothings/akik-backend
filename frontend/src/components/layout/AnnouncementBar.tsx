"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Globe2, AlertCircle, PackageCheck, Sparkles } from "lucide-react";

const MARQUEE_ITEMS = [
  {
    id: "shipping-info",
    type: "shipping",
    badge: "GLOBAL & DOMESTIC",
    text: "INTERNATIONAL SHIPPING AVAILABLE AND WE SHIP ALL OVER INDIA",
    icon: Globe2,
  },
  {
    id: "disclaimer-color",
    type: "disclaimer",
    badge: "DISCLAIMER",
    text: "Colour variations may occur due to differences in lighting, photography, and screen settings.",
    icon: AlertCircle,
  },
  {
    id: "disclaimer-shipping-cost",
    type: "notice",
    badge: "POLICY",
    text: "Shipping charges are applicable separately.",
    icon: PackageCheck,
  },
];

export const AnnouncementBar: React.FC = () => {
  const pathname = usePathname();

  // Do not show on admin portal
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Render 4 repetitions per half so wide screens never have gaps
  const repeatedItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div
      role="region"
      aria-label="Shipping Announcements and Disclaimers"
      className="relative z-50 bg-[#141312] text-[#FAF9F6] border-b border-[#2D2A26] overflow-hidden select-none py-1.5 text-[11px] font-sans"
    >
      <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused] cursor-default">
        {/* Track Half 1 */}
        <div className="flex items-center shrink-0">
          {repeatedItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`track1-${item.id}-${idx}`}
                className="inline-flex items-center gap-2.5 px-6 whitespace-nowrap"
              >
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    item.type === "shipping"
                      ? "bg-[#C47D5A] text-white"
                      : item.type === "disclaimer"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-white/10 text-white/90 border border-white/15"
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {item.badge}
                </span>

                <span
                  className={`tracking-wide ${
                    item.type === "shipping"
                      ? "font-bold text-white tracking-widest uppercase"
                      : "text-[#E6E2DC] font-normal"
                  }`}
                >
                  {item.text}
                </span>

                <Sparkles className="w-2.5 h-2.5 text-[#C47D5A]/70 ml-2" />
              </div>
            );
          })}
        </div>

        {/* Track Half 2 (Exact Duplicate for Seamless 100%->50% Loop) */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {repeatedItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`track2-${item.id}-${idx}`}
                className="inline-flex items-center gap-2.5 px-6 whitespace-nowrap"
              >
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    item.type === "shipping"
                      ? "bg-[#C47D5A] text-white"
                      : item.type === "disclaimer"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-white/10 text-white/90 border border-white/15"
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {item.badge}
                </span>

                <span
                  className={`tracking-wide ${
                    item.type === "shipping"
                      ? "font-bold text-white tracking-widest uppercase"
                      : "text-[#E6E2DC] font-normal"
                  }`}
                >
                  {item.text}
                </span>

                <Sparkles className="w-2.5 h-2.5 text-[#C47D5A]/70 ml-2" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AnnouncementBar;
