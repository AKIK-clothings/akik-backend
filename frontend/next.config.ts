import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const backendOrigin = process.env.NEXT_PUBLIC_API_URL || "";

const connectOrigins = ["'self'", "https://*.supabase.co", "https://api.razorpay.com", "https://lumberjack.razorpay.com"];
if (backendOrigin) {
  connectOrigins.push(backendOrigin);
}
if (!isProd) {
  connectOrigins.push("http://localhost:5000", "http://127.0.0.1:5000");
}

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Note: Next.js requires 'unsafe-inline' for its internal hydration scripts.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://*.razorpay.com https://images.unsplash.com",
      "media-src 'self' blob: data:",
      `connect-src ${connectOrigins.join(" ")}`,
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
