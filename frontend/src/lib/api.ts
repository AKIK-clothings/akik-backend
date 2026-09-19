/**
 * Central API client for AKIK backend.
 * All frontend components should use these functions instead of direct fetches.
 */

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;

if (typeof window !== "undefined" && !RAW_API_URL && process.env.NODE_ENV === "production") {
  console.error(
    "⚠️ Configuration Warning: NEXT_PUBLIC_API_URL is missing in production environment. API requests may fail."
  );
}

const BASE_URL = RAW_API_URL ? RAW_API_URL.replace(/\/$/, "") : "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  regular_price: number;
  discounted_price: number;
  is_sold_out: boolean;
  sizes: string[];
  size_stock_map: Record<string, boolean>;
  color_variants: Array<{
    name: string;
    hexCode: string;
    imageSrc: string;
    secondaryImageSrc?: string;
  }>;
  primary_image: string;
  secondary_image: string;
  gallery_images: string[];
  sku: string;
  rating: number;
  review_count: number;
  description: string;
  fabric_details: string;
  dimensions?: string;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  accordions?: {
    fabricCare: string;
    stitchingDetails: string;
    shippingReturns: string;
  };
  is_active: boolean;
  created_at: string;
}

export interface CheckoutItem {
  productId: string;
  name: string;
  selectedColor: { name: string; hexCode: string; imageSrc: string };
  selectedSize: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  deliveryNotes?: string;
}

// ─── Product helpers ──────────────────────────────────────────────────────────

/** Convert snake_case API product to camelCase frontend Product type */
export function mapApiProduct(p: ApiProduct) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category as never,
    subcategory: p.subcategory,
    regularPrice: p.regular_price,
    discountedPrice: p.discounted_price,
    isSoldOut: p.is_sold_out,
    sizes: p.sizes as never,
    sizeStockMap: p.size_stock_map,
    colorVariants: p.color_variants,
    primaryImage: p.primary_image,
    secondaryImage: p.secondary_image,
    galleryImages: p.gallery_images,
    sku: p.sku,
    rating: p.rating,
    reviewCount: p.review_count,
    description: p.description,
    fabricDetails: p.fabric_details,
    dimensions: p.dimensions,
    isNewArrival: p.is_new_arrival,
    isBestSeller: p.is_best_seller,
    isFeatured: p.is_featured,
    accordions: p.accordions,
  };
}

// ─── Public API Functions ─────────────────────────────────────────────────────

export const api = {
  /** Fetch products with optional filters */
  async getProducts(params?: Record<string, string | string[]>): Promise<ApiProduct[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else if (value) {
          searchParams.set(key, value);
        }
      }
    }
    const res = await fetch(`${BASE_URL}/api/products?${searchParams}`, {
      next: { revalidate: 60 }, // Cache for 60s (Next.js ISR)
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return data.products;
  },

  /** Fetch a single product by slug */
  async getProduct(slug: string): Promise<ApiProduct | null> {
    const res = await fetch(`${BASE_URL}/api/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch product");
    const data = await res.json();
    return data.product;
  },

  /** Fetch featured/bestseller products for homepage */
  async getFeaturedProducts(): Promise<{ bestsellers: ApiProduct[]; newArrivals: ApiProduct[] }> {
    const res = await fetch(`${BASE_URL}/api/products/featured`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) throw new Error("Failed to fetch featured products");
    return res.json();
  },

  /** Validate a promo code */
  async validatePromo(
    code: string,
    subtotal: number
  ): Promise<{ valid: boolean; message: string; promo?: { code: string; discountPercentage: number; discountAmount: number; description: string } }> {
    const res = await fetch(`${BASE_URL}/api/promos/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    });
    return res.json();
  },

  /** Submit a contact enquiry */
  async submitEnquiry(data: {
    name: string;
    phone?: string;
    topic?: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /** Step 1: Create Razorpay order */
  async createCheckoutOrder(data: {
    items: CheckoutItem[];
    subtotal: number;
    couponDiscount?: number;
    shippingFee?: number;
    promoCode?: string;
  }): Promise<{ razorpayOrderId: string; amount: number; currency: string; keyId?: string; calculated?: { subtotal: number; couponDiscount: number; shippingFee: number; finalTotal: number } }> {
    const res = await fetch(`${BASE_URL}/api/checkout/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to create checkout order" }));
      throw new Error(err.error || "Failed to create checkout order");
    }
    return res.json();
  },

  /** Step 2: Verify payment and save order */
  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    items: CheckoutItem[];
    customer: CustomerAddress;
    subtotal: number;
    couponDiscount?: number;
    shippingFee?: number;
    promoCode?: string;
  }): Promise<{ success: boolean; orderNumber: string; adminWhatsAppUrl?: string }> {
    const res = await fetch(`${BASE_URL}/api/checkout/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Payment verification failed" }));
      throw new Error(err.error || "Payment verification failed");
    }
    return res.json();
  },
};

// ─── Admin API Functions ──────────────────────────────────────────────────────

export const adminApi = {
  /** Login and get JWT token */
  async login(email: string, password: string): Promise<{ token: string; admin: { id: string; name: string; email: string } }> {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return res.json();
  },

  /** Logout admin */
  async logout(): Promise<void> {
    await fetch(`${BASE_URL}/api/admin/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("akik_admin_info");
      sessionStorage.removeItem("akik_admin_token");
    }
  },

  /** Generic authenticated request helper (MED-03) */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("akik_admin_token")
        : null;
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("akik_admin_token");
        sessionStorage.removeItem("akik_admin_info");
        window.location.href = "/admin/login";
      }
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  },

  getStats: () => adminApi.request<{ totalProducts: number; totalOrders: number; newOrders: number; totalRevenue: number; unreadEnquiries: number }>("/api/admin/orders/stats/overview"),
  getProducts: () => adminApi.request<{ products: ApiProduct[] }>("/api/admin/products"),
  getProduct: (id: string) => adminApi.request<{ product: ApiProduct }>(`/api/admin/products/${id}`),
  createProduct: (data: object) => adminApi.request("/api/admin/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: object) => adminApi.request(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: string) => adminApi.request(`/api/admin/products/${id}`, { method: "DELETE" }),

  uploadImages: async (productId: string, files: File[]) => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("akik_admin_token")
        : null;
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    const res = await fetch(`${BASE_URL}/api/admin/products/${productId}/images`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error("Image upload failed");
    return res.json();
  },

  getOrders: (params?: string) => adminApi.request<{ orders: unknown[]; total: number }>(`/api/admin/orders${params ? `?${params}` : ""}`),
  updateOrderStatus: (id: string, status: string, notes?: string) => adminApi.request(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, notes }) }),
  getPromos: () => adminApi.request<{ promos: unknown[] }>("/api/admin/promos"),
  createPromo: (data: object) => adminApi.request("/api/admin/promos", { method: "POST", body: JSON.stringify(data) }),
  updatePromo: (id: string, data: object) => adminApi.request(`/api/admin/promos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePromo: (id: string) => adminApi.request(`/api/admin/promos/${id}`, { method: "DELETE" }),
  getEnquiries: () => adminApi.request<{ enquiries: unknown[] }>("/api/admin/enquiries"),
  markEnquiryRead: (id: string) => adminApi.request(`/api/admin/enquiries/${id}/read`, { method: "PATCH" }),
};
