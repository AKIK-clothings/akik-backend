import { Metadata } from "next";
import { Suspense } from "react";
import { MenCollectionContent } from "@/components/plp/MenCollectionContent";

export const metadata: Metadata = {
  title: "Men's Shirt Fabric — Unstitched Premium Cotton | AKIK by Hafsa Khatri",
  description:
    "Shop Men's unstitched Shirt Fabrics in premium breathable cotton and artisanal textures at AKIK.",
  openGraph: {
    title: "Men's Shirt Fabric | AKIK by Hafsa Khatri",
    description: "Shop Men's unstitched Shirt Fabrics in premium breathable cotton and artisanal textures.",
    images: ["/images/men/men-kurta-set.jpg"],
  },
};

export default function MenShirtFabricPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="font-serif text-lg text-[#C47D5A] animate-pulse">
            Loading Shirt Fabric...
          </div>
        </div>
      }
    >
      <MenCollectionContent defaultCategory="shirt-fabric" />
    </Suspense>
  );
}
