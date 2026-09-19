import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ToastContainer } from "@/components/ui/Toast";
import { WhatsAppWidget } from "@/components/ui/WhatsAppWidget";
import { CartProvider } from "@/context/CartContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AKIK | Luxury Ethnic Boutique | Kurti Sets, Sarees & Co-ords",
  description:
    "Discover handcrafted Indian luxury ethnic wear. Explore tailored Kurti sets, Chanderi silks, Banarasi sarees, contemporary co-ords, and harmonious twinning sets.",
  keywords: [
    "AKIK boutique",
    "kurti sets with dupatta",
    "banarasi saree",
    "co-ord sets",
    "ethnic boutique",
    "twinning sets",
    "designer indian wear",
  ],
  openGraph: {
    title: "AKIK | Luxury Ethnic Boutique",
    description:
      "Handcrafted Indian luxury apparel tailored in pure Chanderi silk, Banarasi weaves, and breathable combed cottons.",
    siteName: "AKIK Boutique",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <body className="bg-[#FAF9F6] text-[#1F1E1D] min-h-screen flex flex-col antialiased">
        <CartProvider>
          {/* Global Header & Navigation */}
          <Header />

          {/* Page Content */}
          <div className="flex-1">{children}</div>

          {/* Global Footer */}
          <Footer />

          {/* Slide-over Shopping Bag Drawer */}
          <CartDrawer />

          {/* Undo Action & Cart Notifications */}
          <ToastContainer />

          {/* Floating WhatsApp Concierge */}
          <WhatsAppWidget />
        </CartProvider>
      </body>
    </html>
  );
}
