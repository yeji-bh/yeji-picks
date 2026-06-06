export const ITEM_TYPE_GROUPS = {
  hat: ["hat_cap", "hat_beanie", "hat_other"],
  top: [
    "top_shortsleeve",
    "top_longsleeve",
    "top_shirt",
    "top_hoodie",
    "top_knit",
    "top_jacket",
    "top_sleeveless",
    "top_other",
  ],
  onepiece: ["onepiece"],
  bottom: ["bottom_pants", "bottom_shorts", "bottom_skirt", "bottom_other"],
  shoes: [
    "shoes_sneakers",
    "shoes_boots",
    "shoes_heels",
    "shoes_sandals",
    "shoes_other",
  ],
  bag: ["bag"],
  jewelry: [
    "jewelry_necklace",
    "jewelry_earring",
    "jewelry_ring",
    "jewelry_bracelet",
    "jewelry_other",
  ],
  eyewear: ["eyewear_glasses", "eyewear_sunglasses"],
  other: ["other"],
} as const;

export type ItemTypeGroup = keyof typeof ITEM_TYPE_GROUPS;

export type ItemType = {
  [K in ItemTypeGroup]: (typeof ITEM_TYPE_GROUPS)[K][number];
}[ItemTypeGroup];

export const ITEM_TYPES = Object.values(ITEM_TYPE_GROUPS).flat() as ItemType[];

export const FILTER_TYPES = Object.keys(ITEM_TYPE_GROUPS) as ItemTypeGroup[];

const LEGACY_TYPE_MAP: Record<string, ItemType> = {
  hat: "hat_other",
  top: "top_other",
  bottom: "bottom_other",
  shoes: "shoes_other",
  bag: "bag",
  bag_handbag: "bag",
  bag_shoulder: "bag",
  bag_backpack: "bag",
  bag_clutch: "bag",
  bag_other: "bag",
  top_tshirt: "top_shortsleeve",
  top_vest: "top_sleeveless",
  top_blazer: "top_other",
  shoes_loafers: "shoes_other",
  jewelry: "jewelry_other",
  eyewear: "eyewear_glasses",
  belt: "other",
  socks: "other",
  scarf: "other",
  accessory: "other",
};

export function normalizeItemType(type: string): ItemType {
  if ((ITEM_TYPES as readonly string[]).includes(type)) {
    return type as ItemType;
  }
  return LEGACY_TYPE_MAP[type] ?? "other";
}

export function isItemTypeGroup(filter: string): filter is ItemTypeGroup {
  return (FILTER_TYPES as readonly string[]).includes(filter);
}

export function getFilterGroup(filter: string): ItemTypeGroup | null {
  if (!filter) return null;
  if (isItemTypeGroup(filter)) return filter;
  const normalized = normalizeItemType(filter);
  for (const group of FILTER_TYPES) {
    if ((ITEM_TYPE_GROUPS[group] as readonly string[]).includes(normalized)) {
      return group;
    }
  }
  return null;
}

export function matchesTypeFilter(itemType: string, filter: string): boolean {
  if (!filter) return true;
  const normalized = normalizeItemType(itemType);
  if ((ITEM_TYPES as readonly string[]).includes(filter)) {
    return normalized === filter;
  }
  if (filter === "other") return normalized === "other";
  return normalized.startsWith(`${filter}_`);
}

export type SubmissionItem = {
  type: ItemType;
  brand?: string;
  productName?: string;
  image?: string;
  officialLink?: string;
  notes?: string;
};

export type SubmissionPayload = {
  eventName: string;
  date: string;
  mainImage: string;
  items: SubmissionItem[];
};

export type SubmissionStatus = "pending" | "approved" | "rejected";
