import { AnnouncementItem, MegaMenuCategory } from "@/types/navigation";

export const ANNOUNCEMENT_ITEMS: AnnouncementItem[] = [
  {
    id: "promo-1",
    text: "Use code FESTIVE15 for 15% OFF on orders above ₹2,999",
    code: "FESTIVE15",
    highlightText: "FESTIVE15",
    badge: "Limited Period",
    link: "/collections",
  },
  {
    id: "promo-2",
    text: "Complimentary Express Shipping across India on all prepaid orders",
    highlightText: "Free Shipping",
    badge: "Site-wide",
    link: "/collections",
  },
  {
    id: "promo-3",
    text: "New In: Embroidered Satin Collections & Handcrafted Dupattas",
    highlightText: "Explore Now",
    badge: "New Launch",
    link: "/collections?collection=embroidered-satin",
  },
  {
    id: "contact-whatsapp",
    text: "WhatsApp Concierge & Custom Sizing Enquiries: +91 98330 88958",
    highlightText: "+91 98330 88958",
    badge: "WhatsApp",
    link: "https://wa.me/919833088958",
  },
  {
    id: "contact-instagram",
    text: "Follow @akikbyhafsakhatri on Instagram for daily catalogue drops & BTS reels",
    highlightText: "@akikbyhafsakhatri",
    badge: "Instagram",
    link: "https://www.instagram.com/akikbyhafsakhatri?stkn=MXI1cGlpN3Z3cGhrMQ==",
  },
];

export const NAVIGATION_CATEGORIES: MegaMenuCategory[] = [
  {
    id: "embroidered-satin",
    title: "Embroidered Satin with Dupatta",
    href: "/collections?collection=embroidered-satin",
    subcategories: [
      {
        title: "Blue Lavish on Noir",
        href: "/product/blue-lavish-satin-embroidered-suit",
        description: "Opulent blue floral embroidery on midnight black satin",
        badge: "Bestseller",
      },
      {
        title: "Rose Noir with Pink Dupatta",
        href: "/product/rose-noir-satin-embroidered-suit",
        description: "Vibrant pink rose needlework with scalloped organza drape",
        badge: "New",
      },
      {
        title: "Pastel Flora Ivory",
        href: "/product/pastel-ivory-satin-embroidered-suit",
        description: "Luminous pearl ivory canvas with multi-color botanical stitching",
      },
      {
        title: "Scarlet Bloom Noir Flare",
        href: "/product/scarlet-bloom-satin-embroidered-suit",
        description: "Regal flared silhouette with cascading terracotta threadwork",
      },
    ],
    featuredCard: {
      title: "Embroidered Satin Edit",
      subtitle: "3-piece ensembles with artisanal dupatta at ₹2,500",
      imageSrc: "/images/embroidered-satin/blue-lavish-model.png",
      ctaText: "Shop ₹2,500 Collection",
      href: "/collections?collection=embroidered-satin",
      tag: "Factory Direct",
    },
  },
  {
    id: "luxury-cotton-satin",
    title: "Luxury Cotton Satin",
    href: "/collections?collection=luxury-cotton-satin",
    subcategories: [
      {
        title: "Gilded Noir Edition",
        href: "/product/gilded-noir-luxury-cotton-satin",
        description: "Jet black combed satin with golden zari floral needlework",
        badge: "Popular",
      },
      {
        title: "Turquoise Rosé",
        href: "/product/turquoise-rose-luxury-cotton-satin",
        description: "Oceanic turquoise satin with delicate pink rose sprigs",
      },
      {
        title: "Amethyst After Dark",
        href: "/product/amethyst-after-dark-luxury-cotton-satin",
        description: "Royal violet jewel tones with contrast embroidery",
      },
      {
        title: "View All 18 Designs",
        href: "/collections?collection=luxury-cotton-satin",
        description: "Explore the complete Luxury Cotton Satin catalogue",
        badge: "Full Catalogue",
      },
    ],
    featuredCard: {
      title: "Cotton Satin Catalogue",
      subtitle: "18 bespoke shades in breathable 55\" satin fabric at ₹2,000",
      imageSrc: "/images/luxury-cotton-satin/gilded-noir.jpeg",
      ctaText: "Explore ₹2,000 Collection",
      href: "/collections?collection=luxury-cotton-satin",
      tag: "18 Exclusive Shades",
    },
  },
  {
    id: "satin-lucknowi",
    title: "Satin Lucknowi Collection",
    href: "/collections?collection=satin-lucknowi",
    isHighlighted: true,
    subcategories: [
      {
        title: "Seafoam Whisper on Ferozi",
        href: "/product/seafoam-whisper-ferozi-satin-lucknowi",
        description: "Authentic Chikankari paisley jaal on luminous ferozi satin",
        badge: "Bestseller",
      },
      {
        title: "Moonlight on Sapphire",
        href: "/product/moonlight-sapphire-satin-lucknowi",
        description: "Deep sapphire base with shimmering silver-white threadwork",
      },
      {
        title: "Sage Éclat on Forest",
        href: "/product/sage-eclat-forest-satin-lucknowi",
        description: "Subtle forest tones with scalloped border embroidery",
      },
      {
        title: "View All 9 Lucknowi Designs",
        href: "/collections?collection=satin-lucknowi",
        description: "Heritage threadcraft on fluid high-luster satin",
        badge: "Heritage",
      },
    ],
    featuredCard: {
      title: "Lucknowi Artisanal Edit",
      subtitle: "Heritage Chikankari needlecraft in 9 curated colors at ₹2,250",
      imageSrc: "/images/satin-lucknowi/seafoam-whisper-ferozi.jpeg",
      ctaText: "Shop ₹2,250 Collection",
      href: "/collections?collection=satin-lucknowi",
      tag: "Artisanal Chikankari",
    },
  },
];
