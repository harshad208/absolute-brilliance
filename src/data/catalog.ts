// ============================================================
// CATALOG  — the single import point for all page files
// ============================================================
// How auto-refresh works:
//
//   Each page exports: export const revalidate = REVALIDATE_SECONDS
//
//   This tells Next.js: "after 3600 seconds, the next request
//   should re-run this server component". Next.js re-calls
//   getCatalog() which calls Cloudinary again, rebuilds the
//   page in the background, and serves the fresh version to
//   the visitor after that.
//
//   Result: upload a new image to Cloudinary → it appears on
//   the site automatically within 60 minutes. No manual rebuild.
//
// To change the interval, edit REVALIDATE_SECONDS below.

import { fetchCatalog } from '@/services/cloudinaryAdminService';
import type { Catalog, Category, Product } from '@/types';

// ── Refresh interval ─────────────────────────────────────────
// All three page files import and use this value.
// 3600 = 60 minutes. Change to 1800 for 30 min, 300 for 5 min.
export const REVALIDATE_SECONDS = 3600;

// ── Memory cache (within one server render) ──────────────────
// During a single page render, generateStaticParams() and the
// page component both call getCatalog(). The memory cache ensures
// only one Cloudinary fetch happens per render, not two.
// This cache does NOT persist between ISR revalidations —
// that's intentional, so each revalidation gets fresh data.

let _cache: Catalog | null = null;
let _inflight: Promise<Catalog> | null = null;

export async function getCatalog(): Promise<Catalog> {
  if (_cache && _cache.categories.length > 0) return _cache;

  if (!_inflight) {
    _inflight = fetchCatalog().then(catalog => {
      if (catalog.categories.length > 0) _cache = catalog;
      _inflight = null;
      return catalog;
    });
  }
  return _inflight;
}

// ── Helpers ───────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { categories } = await getCatalog();
  return categories;
}

export async function getCategory(id: string): Promise<Category | undefined> {
  const { categories } = await getCatalog();
  return categories.find(c => c.id === id);
}

export async function getAllProducts(): Promise<Product[]> {
  const { categories } = await getCatalog();
  return categories.flatMap(c => c.products);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const { categories } = await getCatalog();
  for (const cat of categories) {
    const found = cat.products.find(p => p.id === id);
    if (found) return found;
  }
  return undefined;
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const all      = await getAllProducts();
  const featured = all.filter(p => p.featured);
  const rest     = all.filter(p => !p.featured);
  return [...featured, ...rest].slice(0, limit);
}

// Used by generateStaticParams() in page files
export async function getAllCategoryPaths(): Promise<{ category: string }[]> {
  const categories = await getCategories();
  return categories.map(c => ({ category: c.id }));
}

export async function getAllProductPaths(): Promise<
  { category: string; product: string }[]
> {
  const { categories } = await getCatalog();
  return categories.flatMap(cat =>
    cat.products.map(p => ({ category: cat.id, product: p.id }))
  );
}
