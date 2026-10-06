import { Metadata } from "next";
import { Suspense } from "react";
import { MenCollectionContent } from "@/components/plp/MenCollectionContent";

export const metadata: Metadata = {
  title: "Men's Kurta Sets — Unstitched Premium Cotton | AKIK by Hafsa Khatri",
  description:
    "Shop Men's unstitched Kurta Sets in Premium Cotton Plain and Self Designed textures at AKIK.",
  openGraph: {
    title: "Men's Kurta Sets | AKIK by Hafsa Khatri",
    description: "Shop Men's unstitched Kurta Sets in Premium Cotton Plain and Self Designed textures.",
    images: ["/images/men/men-kurta-set.jpg"],
  },
};

export default function MenKurtaSetsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="font-serif text-lg text-[#C47D5A] animate-pulse">
            Loading Kurta Sets...
          </div>
        </div>
      }
    >
      <MenCollectionContent defaultCategory="kurta-sets" />
    </Suspense>
  );
}
