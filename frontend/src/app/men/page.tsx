import { Metadata } from "next";
import { Suspense } from "react";
import { MenCollectionContent } from "@/components/plp/MenCollectionContent";

export const metadata: Metadata = {
  title: "Men's Collection — Unstitched Kurta Sets | AKIK by Hafsa Khatri",
  description:
    "Explore AKIK's Men's collection: luxury unstitched kurta sets in Premium Cotton Plain and Self Designed weaves.",
  openGraph: {
    title: "Men's Collection | AKIK by Hafsa Khatri",
    description: "Bespoke unstitched kurta sets for men crafted in premium cotton.",
  },
};

export default function MenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="font-serif text-lg text-[#C47D5A] animate-pulse">
            Loading Men&apos;s Collection...
          </div>
        </div>
      }
    >
      <MenCollectionContent defaultCategory="kurta-sets" />
    </Suspense>
  );
}
