"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, OrderSummary, PromoCode } from "@/types/cart";
import { Product, ApparelSize, ColorVariant } from "@/types/product";
import { api } from "@/lib/api";

interface ToastItem {
  id: string;
  message: string;
  undoAction?: () => void;
  undoLabel?: string;
  type: "info" | "success" | "cart";
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (
    product: Product,
    size: ApparelSize,
    color?: ColorVariant,
    quantity?: number
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  appliedPromo: PromoCode | null;
  applyPromoCode: (codeStr: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  orderSummary: OrderSummary;
  totalItemCount: number;

  // Wishlist
  wishlist: string[]; // product IDs / slugs
  toggleWishlist: (productIdOrSlug: string, slug?: string) => void;
  isInWishlist: (productIdOrSlug: string, slug?: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
  isHydrated: boolean;

  // Toasts
  toasts: ToastItem[];
  showToast: (
    message: string,
    undoAction?: () => void,
    undoLabel?: string
  ) => void;
  dismissToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 3000;
const STANDARD_SHIPPING_FEE = 150;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Rehydrate cart and wishlist from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("akik_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedWishlist = localStorage.getItem("akik_wishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (err) {
      console.warn("Storage hydration failed:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist cart updates to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("akik_cart", JSON.stringify(cart));
    } catch (err) {
      console.warn("Cart storage write failed:", err);
    }
  }, [cart, isHydrated]);

  // Persist wishlist updates to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("akik_wishlist", JSON.stringify(wishlist));
    } catch (err) {
      console.warn("Wishlist storage write failed:", err);
    }
  }, [wishlist, isHydrated]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const showToast = (
    message: string,
    undoAction?: () => void,
    undoLabel = "Undo"
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastItem = { id, message, undoAction, undoLabel, type: "cart" };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToCart = (
    product: Product,
    size: ApparelSize,
    color?: ColorVariant,
    quantity = 1
  ) => {
    const selectedColorVariant = color || product.colorVariants[0] || {
      name: "Default",
      hexCode: "#C47D5A",
      imageSrc: product.primaryImage,
    };

    const itemId = `${product.id}-${selectedColorVariant.name}-${size}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === itemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = Math.min(
          updated[existingIndex].quantity + quantity,
          updated[existingIndex].maxInventory
        );
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          category: product.subcategory || "Curated Suits",
          selectedColor: selectedColorVariant,
          selectedSize: size,
          regularPrice: product.regularPrice,
          discountedPrice: product.discountedPrice,
          quantity,
          maxInventory: 5,
        };
        return [...prevCart, newItem];
      }
    });

    showToast(`Added "${product.name}" (${size}) to your bag`);
    openCart();
  };

  const removeFromCart = (itemId: string) => {
    const itemToRemove = cart.find((item) => item.id === itemId);
    if (!itemToRemove) return;

    setCart((prev) => prev.filter((item) => item.id !== itemId));

    // Offer quick undo toast notification (Prompt 5 requirement)
    showToast(
      `Removed "${itemToRemove.name}" from your bag`,
      () => {
        setCart((prev) => [...prev, itemToRemove]);
      },
      "Undo"
    );
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === itemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: Math.min(nextQty, item.maxInventory),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const applyPromoCode = async (
    codeStr: string
  ): Promise<{ success: boolean; message: string }> => {
    const normalized = codeStr.trim().toUpperCase();
    if (!normalized) {
      return { success: false, message: "Please enter a promo code" };
    }

    const currentSubtotal = cart.reduce(
      (sum, item) => sum + item.discountedPrice * item.quantity,
      0
    );

    try {
      const res = await api.validatePromo(normalized, currentSubtotal);
      if (res.valid && res.promo) {
        setAppliedPromo({
          code: res.promo.code,
          discountPercentage: res.promo.discountPercentage,
          description: res.promo.description,
          minOrderValue: 0,
        });
        return { success: true, message: res.message || `Promo applied: ${res.promo.description}` };
      }
      return { success: false, message: res.message || "Invalid promo code" };
    } catch {
      return { success: false, message: "Failed to validate promo code" };
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  const toggleWishlist = (productIdOrSlug: string, slug?: string) => {
    const targetKey = slug || productIdOrSlug;
    setWishlist((prev) => {
      const isAlreadyIn = prev.some(
        (item) => item === targetKey || item === productIdOrSlug || (slug && item === slug)
      );
      if (isAlreadyIn) {
        showToast("Removed item from your wishlist");
        return prev.filter(
          (item) => item !== targetKey && item !== productIdOrSlug && (slug ? item !== slug : true)
        );
      } else {
        showToast("Added item to your wishlist");
        return [...prev, targetKey];
      }
    });
  };

  const isInWishlist = (productIdOrSlug: string, slug?: string) => {
    return wishlist.some(
      (item) => item === productIdOrSlug || (slug && item === slug)
    );
  };

  const clearWishlist = () => {
    setWishlist([]);
    showToast("Cleared your wishlist");
  };

  // Calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + item.discountedPrice * item.quantity,
    0
  );

  const regularPriceTotal = cart.reduce(
    (acc, item) => acc + item.regularPrice * item.quantity,
    0
  );

  const baseDiscountSavings = Math.max(0, regularPriceTotal - subtotal);

  const couponDiscount = appliedPromo
    ? Math.round((subtotal * appliedPromo.discountPercentage) / 100)
    : 0;

  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || cart.length === 0;
  const shippingFee = cart.length === 0 ? 0 : hasFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee);
  const totalDiscountSavings = baseDiscountSavings + couponDiscount;

  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  );

  const totalItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const orderSummary: OrderSummary = {
    subtotal,
    discountSavings: totalDiscountSavings,
    couponDiscount,
    shippingFee,
    finalTotal,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountNeededForFreeShipping,
    hasFreeShipping,
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        orderSummary,
        totalItemCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
        isHydrated,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
