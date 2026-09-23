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
    id: "stitched",
    title: "Stitched",
    href: "/collections?collection=stitched",
    subcategories: [
      {
        title: "Embroidered Satin with Dupatta",
        href: "/collections?collection=stitched&sub=Embroidered+Satin+with+Dupatta",
        description: "Readymade designer ensembles tailored to perfection",
      },
      {
        title: "Luxury Cotton Satin",
        href: "/collections?collection=stitched&sub=Luxury+Cotton+Satin",
        description: "Bespoke ready-to-wear silhouettes in breathable premium satin",
      },
      {
        title: "Satin Lucknowi Collection",
        href: "/collections?collection=stitched&sub=Satin+Lucknowi+Collection",
        description: "Exquisite handcrafted Chikankari stitched sets",
      },
      {
        title: "Rose Royale Collection",
        href: "/collections?collection=stitched&sub=Rose+Royale+Collection",
        description: "Signature royal floral motifs with luxury drape",
        badge: "Exclusive",
      },
    ],
    featuredCard: {
      title: "Stitched Collection",
      subtitle: "Tailored elegance with precision cuts & artisanal detailing",
      imageSrc: "/images/embroidered-satin/blue-lavish-model.png",
      ctaText: "Shop Stitched",
      href: "/collections?collection=stitched",
      tag: "Ready To Wear",
    },
  },
  {
    id: "unstitched",
    title: "Unstitched",
    href: "/collections?collection=unstitched",
    isHighlighted: true,
    subcategories: [
      {
        title: "Embroidered Satin with Dupatta",
        href: "/collections?collection=unstitched&sub=Embroidered+Satin+with+Dupatta",
        description: "Complete 3-piece unstitched fabric with artisanal dupatta",
        badge: "Bestseller",
      },
      {
        title: "Luxury Cotton Satin",
        href: "/collections?collection=unstitched&sub=Luxury+Cotton+Satin",
        description: "Pure breathable unstitched satin fabric cuts for custom tailoring",
      },
      {
        title: "Satin Lucknowi Collection",
        href: "/collections?collection=unstitched&sub=Satin+Lucknowi+Collection",
        description: "Heritage Chikankari needlecraft unstitched suit lengths",
      },
      {
        title: "Rose Royale Collection",
        href: "/collections?collection=unstitched&sub=Rose+Royale+Collection",
        description: "Premium unstitched ensembles with rose botanical motifs",
        badge: "New",
      },
    ],
    featuredCard: {
      title: "Unstitched Collection",
      subtitle: "Complete fabric lengths crafted for bespoke personal tailoring",
      imageSrc: "/images/luxury-cotton-satin/gilded-noir.jpeg",
      ctaText: "Shop Unstitched",
      href: "/collections?collection=unstitched",
      tag: "Bespoke Fabric",
    },
  },
  {
    id: "kids",
    title: "Kids",
    href: "/collections?collection=kids",
    subcategories: [
      {
        title: "Embroidered Satin with Dupatta",
        href: "/collections?collection=kids&sub=Embroidered+Satin+with+Dupatta",
        description: "Delightful festive celebration attire for little ones",
      },
      {
        title: "Luxury Cotton Satin",
        href: "/collections?collection=kids&sub=Luxury+Cotton+Satin",
        description: "Soft, gentle and comfortable luxury fabrics for kids",
      },
      {
        title: "Satin Lucknowi Collection",
        href: "/collections?collection=kids&sub=Satin+Lucknowi+Collection",
        description: "Traditional artisanal Chikankari outfits for junior elegance",
      },
      {
        title: "Rose Royale Collection",
        href: "/collections?collection=kids&sub=Rose+Royale+Collection",
        description: "Charming festive floral collection for kids",
        badge: "Festive",
      },
    ],
    featuredCard: {
      title: "Kids Collection",
      subtitle: "Comfortable, festive and royal ensembles for children",
      imageSrc: "/images/satin-lucknowi/seafoam-whisper-ferozi.jpeg",
      ctaText: "Shop Kids",
      href: "/collections?collection=kids",
      tag: "Festive Kids",
    },
  },
];
