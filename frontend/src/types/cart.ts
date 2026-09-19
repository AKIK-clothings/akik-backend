import { ApparelSize } from "./product";

export interface CartItem {
  id: string; // unique composite key: `${productId}-${variantColor}-${size}`
  productId: string;
  slug: string;
  name: string;
  category: string;
  selectedColor: {
    name: string;
    hexCode: string;
    imageSrc: string;
  };
  selectedSize: ApparelSize;
  regularPrice: number;
  discountedPrice: number;
  quantity: number;
  maxInventory: number;
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  description: string;
  minOrderValue?: number;
}

export interface OrderSummary {
  subtotal: number;
  discountSavings: number;
  couponDiscount: number;
  shippingFee: number;
  finalTotal: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  hasFreeShipping: boolean;
}
