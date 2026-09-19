"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { adminApi } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/promos", label: "Promo Codes", icon: Tag },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    // Auth guard
    if (pathname === "/admin/login") return;
    
    // Check session data and token
    const adminData = sessionStorage.getItem("akik_admin_info");
    const adminToken = sessionStorage.getItem("akik_admin_token");
    if (!adminData && !adminToken) {
      router.push("/admin/login");
      return;
    }
    
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        setAdminName(parsed.name || "Admin");
      } catch { /* ignore */ }
    }

    // Server-side token validation
    adminApi
      .request<{ admin?: { name?: string } }>("/api/admin/me")
      .then((res) => {
        if (res.admin?.name) {
          setAdminName(res.admin.name);
        }
      })
      .catch((err) => {
        console.warn("Session check warning:", err);
      });
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // ignore
    }
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex font-sans">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1A1918] text-white z-40 flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C47D5A] rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold tracking-widest uppercase">AKIK</p>
              <p className="text-[10px] text-[#C47D5A] uppercase tracking-widest font-semibold">Admin Panel</p>
            </div>
          </div>
          <p className="text-xs text-[#8A857F] mt-3">Welcome, {adminName}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#C47D5A] text-white"
                    : "text-[#A8A49F] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#A8A49F] hover:bg-white/10 hover:text-white transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#4A4845] hover:text-[#A8A49F] transition-all mt-1"
          >
            ↗ View Live Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#EAE5DE] sticky top-0 z-20">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[#F5F3F0] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif text-lg font-bold tracking-widest uppercase text-[#1A1918]">AKIK Admin</span>
          <div className="w-9" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
