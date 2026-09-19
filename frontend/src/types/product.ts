export type ApparelSize = "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | "Unstitched" | "Free Size";

export interface ColorVariant {
  name: string;
  hexCode: string;
  imageSrc: string;
  secondaryImageSrc?: string;
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

export type MainCategory =
  | "stitched"
  | "unstitched"
  | "twinning"
  | "embroidered-satin"
  | "luxury-cotton-satin"
  | "satin-lucknowi";

export type StitchedSubCategory =
  | "Kurti Sets"
  | "Kurti Sets with Dupatta"
  | "Co-ord Sets"
  | "Neck Tops"
  | "Embroidered Satin with Dupatta"
  | "Luxury Cotton Satin"
  | "Satin Lucknowi";

export type UnstitchedSubCategory =
  | "Saree Collection"
  | "Rayon Collection"
  | "Cotton Collection"
  | "Unstitched Suit Sets";

export type TwinningSubCategory =
  | "Mother & Daughter"
  | "Festive Duo Sets"
  | "Couple Coordinates";

export type SubCategory =
  | StitchedSubCategory
  | UnstitchedSubCategory
  | TwinningSubCategory
  | string;

export interface ProductAccordionItem {
  title: string;
  content: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: MainCategory;
  subcategory: SubCategory;
  regularPrice: number;
  discountedPrice: number;
  isSoldOut: boolean;
  sizes: ApparelSize[];
  sizeStockMap?: Partial<Record<ApparelSize, boolean>>;
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
