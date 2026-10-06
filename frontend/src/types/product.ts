export type ApparelSize = "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | "Unstitched" | "Free Size";

export interface ColorVariant {
  name: string;
  hexCode: string;
  imageSrc: string;
  secondaryImageSrc?: string;
  isSoldOut?: boolean;
}

export interface SizeStock {
  size: ApparelSize;
  inStock: boolean;
  stockCount?: number;
}

export interface ProductVariant {
  id: string;
  color: ColorVariant;
  sizes: SizeStock[];
  sku: string;
  images: string[];
}

export type ProductSection = "women" | "men";

export type MainCategory =
  | "stitched"
  | "unstitched"
  | "kids"
  | "kurta-sets"
  | string;

export type SubCategory =
  | "Embroidered Satin with Dupatta"
  | "Luxury Cotton Satin"
  | "Satin Lucknowi Collection"
  | "Rose Royale Collection"
  | "Premium Cotton Plain"
  | "Premium Cotton Self Designed"
  | string;

export interface SubCategoryItem {
  id: string;
  section: ProductSection;
  name: string;
  slug: string;
  created_at?: string;
}

export interface ProductAccordionItem {
  title: string;
  content: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  section?: ProductSection;
  category: MainCategory;
  subcategory: SubCategory;
  subcategoryId?: string | null;
  regularPrice: number;
  discountedPrice: number;
  isSoldOut: boolean;
  sizes: ApparelSize[];
  sizeStockMap?: Partial<Record<ApparelSize | string, boolean | number>>;
  colorVariants: ColorVariant[];
  primaryImage: string;
  secondaryImage: string;
  galleryImages: string[];
  sku: string;
  rating: number;
  reviewCount: number;
  description: string;
  fabricDetails: string;
  dimensions?: string; // For Unstitched: e.g. "5.5m Saree + 0.8m Blouse Piece"
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  accordions?: {
    fabricCare: string;
    stitchingDetails: string;
    shippingReturns: string;
  };
}

export type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "discount";

export interface FilterState {
  collection: MainCategory | "all";
  subcategories: string[];
  sizes: ApparelSize[];
  colors: string[];
  inStockOnly: boolean;
  priceRange: [number, number];
  sortBy: SortOption;
}
