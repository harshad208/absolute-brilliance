// ============================================================
// PRODUCT OVERRIDES  — optional manual enrichment
// ============================================================
// The catalog discovers everything from Cloudinary automatically.
// Use this file to add descriptions, featured flags, or tags.
//
// Key = "{category-slug}--{product-slug}"
// Slug rule: lowercase, spaces → hyphens, special chars stripped
//
// Examples:
//   Anklets / Adjustable Anklets  →  "anklets--adjustable-anklets"
//   Rings   / Stackable Rings     →  "rings--stackable-rings"

import type { ProductOverride } from '@/types';

export const productOverrides: Record<string, ProductOverride> = {

  'anklets--adjustable-anklets': {
    description: 'Delicate adjustable anklet in 925 sterling silver.',
    featured: true,
    tags: ['silver', 'adjustable', 'daily wear'],
  },

  'rings--stackable-rings': {
    description: 'Mix-and-match stackable rings in gold and silver.',
    featured: true,
    tags: ['stackable', 'gold', 'silver'],
  },

  // Add more below as needed:
  // 'bangles--bridal-bangles': {
  //   description: '...',
  //   featured: true,
  //   tags: ['bridal'],
  // },

};
