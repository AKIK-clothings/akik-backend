export interface AnnouncementItem {
  id: string;
  text: string;
  code?: string;
  highlightText?: string;
  badge?: string;
  link?: string;
}

export interface SubCategoryItem {
  title: string;
  href: string;
  description?: string;
  badge?: string;
  imageSrc?: string;
  isNew?: boolean;
}

export interface MegaMenuFeaturedCard {
  title: string;
  subtitle: string;
  tag?: string;
  imageSrc: string;
  ctaText: string;
  href: string;
}

export interface MegaMenuCategory {
  id: string;
  title: string;
  href: string;
  badge?: string;
  isHighlighted?: boolean;
  sections?: {
    heading: string;
    items: SubCategoryItem[];
  }[];
  subcategories: SubCategoryItem[];
  featuredCard?: MegaMenuFeaturedCard;
}

export interface NavUtilityAction {
  id: "search" | "wishlist" | "cart" | "account";
  label: string;
  iconName: string;
  badgeCount?: number;
  onClick?: () => void;
}
