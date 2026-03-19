// ============================================================
// CLOUDINARY ADMIN SERVICE  — server-only
// ============================================================
// Uses the Cloudinary Search API to fetch all assets under
// Jewellery/ in exactly 2 API calls (images + videos).
//
// Confirmed working for this account type:
//   - public_id   = bare filename:  "cover_dpocvu"
//   - asset_folder = full path:     "Jewellery/Anklets/Adjustable Anklets"
//   - asset_folder is returned automatically on every resource
//   - Search expression "folder:Jewellery/*" returns exactly the
//     right assets (verified: 35 images, matching Cloudinary dashboard)
//
// With ISR, this runs automatically every REVALIDATE_SECONDS.
// Rate limit: 500 Admin API calls/hour (free tier).
// This approach uses 2 calls per revalidation cycle.

import type {
  Catalog,
  Category,
  Product,
  CloudinaryImage,
  CloudinaryVideo,
} from '@/types';
import { productOverrides } from '@/data/productOverrides';

// ─── Config ──────────────────────────────────────────────────

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
  ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ?? '';
const API_KEY    = process.env.CLOUDINARY_API_KEY    ?? '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? '';

const ROOT_FOLDER = 'Jewellery';

// ─── Auth ─────────────────────────────────────────────────────

function auth(): string {
  return 'Basic ' + Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
}

function adminUrl(path: string): string {
  return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}${path}`;
}

// ─── Resource type ────────────────────────────────────────────

interface CResource {
  public_id:    string;  // "cover_dpocvu"
  asset_folder: string;  // "Jewellery/Anklets/Adjustable Anklets"
  format:       string;
  width?:       number;
  height?:      number;
}

// ─── Search API ───────────────────────────────────────────────
// POST /resources/search
// expression "folder:Jewellery/*" filters to our root folder only.
// asset_folder field returns automatically — no with_field needed.
// Paginates via next_cursor for catalogs larger than 500 assets.

async function searchAssets(resourceType: 'image' | 'video'): Promise<CResource[]> {
  const all: CResource[] = [];
  let nextCursor: string | undefined;

  do {
    const body: Record<string, unknown> = {
      expression: `folder:${ROOT_FOLDER}/* AND resource_type:${resourceType}`,
      max_results: 500,
      sort_by: [{ public_id: 'asc' }],
    };
    if (nextCursor) body.next_cursor = nextCursor;

    const res = await fetch(adminUrl('/resources/search'), {
      method: 'POST',
      headers: {
        Authorization: auth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[Cloudinary] search(${resourceType}) → ${res.status}: ${text}`);
      break;
    }

    const data = await res.json() as {
      resources:    CResource[];
      next_cursor?: string;
      total_count:  number;
    };

    all.push(...(data.resources ?? []));
    nextCursor = data.next_cursor;
    console.log(`[Cloudinary] ${resourceType}s: ${all.length}/${data.total_count}`);

  } while (nextCursor);

  return all;
}

// ─── Parse asset_folder ───────────────────────────────────────
// "Jewellery/Anklets/Adjustable Anklets"
//  ROOT       CAT     PRODUCT

function parseAssetFolder(assetFolder: string): {
  categoryName: string;
  productName:  string;
} | null {
  if (!assetFolder) return null;
  const parts = assetFolder.split('/');
  if (parts.length !== 3)       return null;
  if (parts[0] !== ROOT_FOLDER) return null;
  return { categoryName: parts[1], productName: parts[2] };
}

// ─── Slugs ────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function buildProductId(cat: string, prod: string): string {
  return `${toSlug(cat)}--${toSlug(prod)}`;
}

// ─── Models ───────────────────────────────────────────────────

function toImage(r: CResource, productName: string, i: number): CloudinaryImage {
  return {
    publicId: r.public_id,
    alt:      `${productName} – photo ${i + 1}`,
    width:    r.width,
    height:   r.height,
    format:   r.format,
  };
}

function toVideo(r: CResource): CloudinaryVideo {
  return { publicId: r.public_id, title: '360° view' };
}

// ─── Main ─────────────────────────────────────────────────────

export async function fetchCatalog(): Promise<Catalog> {
  const fetchedAt = new Date().toISOString();

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error(
      '[Cloudinary] Missing env vars: CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    );
    return { categories: [], fetchedAt };
  }

  try {
    console.log(`[Cloudinary] Fetching catalog under "${ROOT_FOLDER}/"…`);

    const [images, videos] = await Promise.all([
      searchAssets('image'),
      searchAssets('video'),
    ]);

    console.log(`[Cloudinary] Total: ${images.length} images, ${videos.length} videos`);

    if (images.length === 0 && videos.length === 0) {
      console.warn(`[Cloudinary] No assets found under "${ROOT_FOLDER}/"`);
      return { categories: [], fetchedAt };
    }

    // Group by category → product using asset_folder
    const imageMap = new Map<string, Map<string, CResource[]>>();
    const videoMap = new Map<string, Map<string, CResource[]>>();
    let skipped = 0;

    function addToMap(map: Map<string, Map<string, CResource[]>>, r: CResource) {
      const parsed = parseAssetFolder(r.asset_folder);
      if (!parsed) { skipped++; return; }
      const { categoryName, productName } = parsed;
      if (!map.has(categoryName)) map.set(categoryName, new Map());
      const catMap = map.get(categoryName)!;
      if (!catMap.has(productName)) catMap.set(productName, []);
      catMap.get(productName)!.push(r);
    }

    for (const r of images) addToMap(imageMap, r);
    for (const r of videos) addToMap(videoMap, r);

    if (skipped > 0) {
      console.log(`[Cloudinary] Skipped ${skipped} assets (wrong folder depth)`);
    }

    // Build Category → Product tree
    const categoryNames = new Set([...imageMap.keys(), ...videoMap.keys()]);
    const categories: Category[] = [];

    for (const categoryName of categoryNames) {
      const categoryId   = toSlug(categoryName);
      const catImages    = imageMap.get(categoryName) ?? new Map();
      const catVideos    = videoMap.get(categoryName) ?? new Map();
      const productNames = new Set([...catImages.keys(), ...catVideos.keys()]);
      const products: Product[] = [];

      for (const productName of productNames) {
        const productId = buildProductId(categoryName, productName);
        const override  = productOverrides[productId] ?? {};
        const imgRes    = catImages.get(productName) ?? [];
        const vidRes    = catVideos.get(productName) ?? [];

        imgRes.sort((a: CResource, b: CResource) => a.public_id.localeCompare(b.public_id));
        vidRes.sort((a: CResource, b: CResource) => a.public_id.localeCompare(b.public_id));

        products.push({
          id:           productId,
          productName,
          categoryId,
          categoryName,
          folderPath:   `${ROOT_FOLDER}/${categoryName}/${productName}`,
          images:       imgRes.map((r, i) => toImage(r, productName, i)),
          videos:       vidRes.map(toVideo),
          ...override,
        });
      }

      products.sort((a: Product, b: Product) => a.productName.localeCompare(b.productName));
      categories.push({
        id:         categoryId,
        name:       categoryName,
        folderPath: `${ROOT_FOLDER}/${categoryName}`,
        products,
      });
    }

    categories.sort((a: Category, b: Category) => a.name.localeCompare(b.name));

    const totalProducts = categories.reduce((n, c) => n + c.products.length, 0);
    const totalImages   = categories.reduce(
      (n, c) => n + c.products.reduce((m, p) => m + p.images.length, 0), 0
    );

    console.log(
      `[Cloudinary] ✓ ${categories.length} categories, ` +
      `${totalProducts} products, ${totalImages} images`
    );

    return { categories, fetchedAt };

  } catch (err) {
    console.error('[Cloudinary] Error building catalog:', err);
    return { categories: [], fetchedAt };
  }
}