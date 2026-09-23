"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Search } from "lucide-react";
import { adminApi, ApiProduct } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [filtered, setFiltered] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(products); return; }
    const q = search.toLowerCase();
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)));
  }, [search, products]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { products: data } = (await adminApi.getProducts()) as { products: ApiProduct[] };
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load products. Please check backend connection and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (product: ApiProduct) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      await adminApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) { alert("Failed to delete product"); console.error(err); }
    finally { setDeletingId(null); }
  };

  const handleToggleActive = async (product: ApiProduct) => {
    try {
      await adminApi.updateProduct(product.id, { isActive: !product.is_active });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    } catch (err) { alert("Failed to update product"); console.error(err); }
  };

  const CATEGORY_LABELS: Record<string, string> = {
    "stitched": "Stitched",
    "unstitched": "Unstitched",
    "kids": "Kids",
    "embroidered-satin": "Embroidered Satin",
    "luxury-cotton-satin": "Luxury Cotton Satin",
    "satin-lucknowi": "Satin Lucknowi",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1918]">Products</h1>
          <p className="text-sm text-[#75706B] mt-1">{products.length} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C47D5A] text-white text-sm font-semibold rounded-lg hover:bg-[#A86947] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={loadProducts}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49F]" />
        <input
          type="text"
          placeholder="Search by name, category, or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE5DE] rounded-lg text-sm focus:outline-none focus:border-[#C47D5A] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#EAE5DE] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-[#C47D5A] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F3F0] border-b border-[#EAE5DE]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider hidden sm:table-cell">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#75706B] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DE]">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#F5F3F0] shrink-0 border border-[#EAE5DE]">
                          {product.primary_image && (
                            <Image src={product.primary_image} alt={product.name} fill className="object-cover" sizes="40px"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1918] leading-tight line-clamp-1">{product.name}</p>
                          <p className="text-xs text-[#A8A49F] mt-0.5">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-[#75706B]">{CATEGORY_LABELS[product.category] || product.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1A1918]">₹{product.discounted_price.toLocaleString("en-IN")}</p>
                      {product.regular_price > product.discounted_price && (
                        <p className="text-xs text-[#A8A49F] line-through">₹{product.regular_price.toLocaleString("en-IN")}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.is_sold_out ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {product.is_sold_out ? "Sold Out" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(product)} title={product.is_active ? "Click to deactivate" : "Click to activate"}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${product.is_active ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-[#F5F3F0] text-[#75706B] hover:bg-[#EAE5DE]"}`}
                      >
                        {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {product.is_active ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}/edit`}
                          className="p-1.5 rounded-lg text-[#75706B] hover:bg-[#F5F3F0] hover:text-[#1A1918] transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(product)} disabled={deletingId === product.id}
                          className="p-1.5 rounded-lg text-[#75706B] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete product"
                        >
                          {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#A8A49F]">
                <p className="text-sm">No products found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
