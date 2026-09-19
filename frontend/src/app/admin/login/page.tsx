"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { adminApi } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { token, admin } = await adminApi.login(email, password);
      if (token) {
        sessionStorage.setItem("akik_admin_token", token);
      }
      sessionStorage.setItem("akik_admin_info", JSON.stringify(admin));
      router.push("/admin");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1918] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#C47D5A]/60 bg-white shadow-xl">
              <Image src="/logo.jpeg" alt="AKIK" fill className="object-cover" sizes="64px" />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-[0.16em] uppercase text-white">AKIK</h1>
          <p className="text-[#C47D5A] text-xs uppercase tracking-[0.25em] font-semibold mt-1">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#262422] rounded-2xl border border-[#3D3A36] p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#C47D5A]" />
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Sign In to Continue</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A8A49F] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="hafsa@akikbyhafsakhatri.in"
                className="w-full px-4 py-3 bg-[#1A1918] border border-[#3D3A36] rounded-lg text-white placeholder:text-[#4A4845] text-sm focus:outline-none focus:border-[#C47D5A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A8A49F] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#1A1918] border border-[#3D3A36] rounded-lg text-white placeholder:text-[#4A4845] text-sm focus:outline-none focus:border-[#C47D5A] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4845] hover:text-[#A8A49F] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#C47D5A] hover:bg-[#A86947] text-white text-sm font-semibold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#4A4845] text-xs mt-6">
          © 2026 AKIK by Hafsa Khatri. Admin access only.
        </p>
      </div>
    </div>
  );
}
