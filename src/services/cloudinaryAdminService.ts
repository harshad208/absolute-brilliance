// ============================================================
// CLOUDINARY ADMIN SERVICE  — server-only
// ============================================================
// Fetches all assets under Jewellery/ using the Search API.
// 2 API calls total (images + videos). Groups by asset_folder.
//
// Confirmed working:
//   public_id    = "cover_dpocvu"
//   asset_folder = "Jewellery/Anklets/Adjustable Anklets"

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
  public_id:    string;
  asset_folder: string;
  format:       string;
  width?:       number;
  height?:      number;
}

interface SearchResponse {
  resources:    CResource[];
  next_cursor?: string;
  total_count:  number;
}

// ─── Search API ───────────────────────────────────────────────

async function searchAssets(
  resourceType: 'image' | 'video'
): Promise<CResource[]> {
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
      console.error(
        `[Cloudinary] search(${resourceType}) → ${res.status}: ${text}`
      );
      break;
    }

    const data = (await res.json()) as SearchResponse;
    all.push(...(data.resources ?? []));
    nextCursor = data.next_cursor;
    console.log(
      `[Cloudinary] ${resourceType}s: ${all.length}/${data.total_count}`
    );
  } while (nextCursor);

  return all;
}

// ─── Parse asset_folder ───────────────────────────────────────
// "Jewellery/Anklets/Adjustable Anklets" → { categoryName, productName }

interface FolderParts {
  categoryName: string;
  productName:  string;
}

function parseAssetFolder(assetFolder: string): FolderParts | null {
  if (!assetFolder) return null;
  const parts = assetFolder.split('/');
  if (parts.length !== 3)       return null;
  if (parts[0] !== ROOT_FOLDER) return null;
  return { categoryName: parts[1], productName: parts[2] };
}

// ─── Slug helpers ─────────────────────────────────────────────

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

// ─── Resource → model ─────────────────────────────────────────

function toImage(
  r: CResource,
  productName: string,
  index: number
): CloudinaryImage {
  return {
    publicId: r.public_id,
    alt:      `${productName} – photo ${index + 1}`,
    width:    r.width,
    height:   r.height,
    format:   r.format,
  };
}

function toVideo(r: CResource): CloudinaryVideo {
  return { publicId: r.public_id, title: '360° view' };
}

// ─── Map helpers ──────────────────────────────────────────────

type ResourceMap = Map<string, Map<string, CResource[]>>;

function addToMap(map: ResourceMap, r: CResource): void {
  const parsed = parseAssetFolder(r.asset_folder);
  if (!parsed) return;
  const { categoryName, productName } = parsed;
  if (!map.has(categoryName)) {
    map.set(categoryName, new Map<string, CResource[]>());
  }
  const catMap = map.get(categoryName)!;
  if (!catMap.has(productName)) {
    catMap.set(productName, []);
  }
  catMap.get(productName)!.push(r);
}

// ─── Main export ──────────────────────────────────────────────

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

    console.log(
      `[Cloudinary] Total: ${images.length} images, ${videos.length} videos`
    );

    if (images.length === 0 && videos.length === 0) {
      console.warn(`[Cloudinary] No assets found under "${ROOT_FOLDER}/"`);
      return { categories: [], fetchedAt };
    }

    // ── Group by asset_folder ─────────────────────────────────
    const imageMap: ResourceMap = new Map();
    const videoMap: ResourceMap = new Map();
    let skipped = 0;

    for (const r of images) {
      if (parseAssetFolder(r.asset_folder)) {
        addToMap(imageMap, r);
      } else {
        skipped++;
      }
    }
    for (const r of videos) {
      if (parseAssetFolder(r.asset_folder)) {
        addToMap(videoMap, r);
      } else {
        skipped++;
      }
    }

    if (skipped > 0) {
      console.log(
        `[Cloudinary] Skipped ${skipped} assets (wrong folder depth)`
      );
    }

    // ── Build Category → Product tree ─────────────────────────
    const categoryNames = new Set<string>([
      ...imageMap.keys(),
      ...videoMap.keys(),
    ]);

    const categories: Category[] = [];

    for (const categoryName of categoryNames) {
      const categoryId = toSlug(categoryName);
      const catImages  = imageMap.get(categoryName) ?? new Map<string, CResource[]>();
      const catVideos  = videoMap.get(categoryName) ?? new Map<string, CResource[]>();

      const productNames = new Set<string>([
        ...catImages.keys(),
        ...catVideos.keys(),
      ]);

      const products: Product[] = [];

      for (const productName of productNames) {
        const productId = buildProductId(categoryName, productName);
        const override  = productOverrides[productId] ?? {};
        const imgRes    = catImages.get(productName) ?? [];
        const vidRes    = catVideos.get(productName) ?? [];

        imgRes.sort((a: CResource, b: CResource) =>
          a.public_id.localeCompare(b.public_id)
        );
        vidRes.sort((a: CResource, b: CResource) =>
          a.public_id.localeCompare(b.public_id)
        );

        products.push({
          id:           productId,
          productName,
          categoryId,
          categoryName,
          folderPath:   `${ROOT_FOLDER}/${categoryName}/${productName}`,
          images:       imgRes.map((r: CResource, i: number) =>
                          toImage(r, productName, i)
                        ),
          videos:       vidRes.map((r: CResource) => toVideo(r)),
          ...override,
        });
      }

      products.sort((a: Product, b: Product) =>
        a.productName.localeCompare(b.productName)
      );

      categories.push({
        id:         categoryId,
        name:       categoryName,
        folderPath: `${ROOT_FOLDER}/${categoryName}`,
        products,
      });
    }

    categories.sort((a: Category, b: Category) =>
      a.name.localeCompare(b.name)
    );

    const totalProducts = categories.reduce(
      (n: number, c: Category) => n + c.products.length,
      0
    );
    const totalImages = categories.reduce(
      (n: number, c: Category) =>
        n + c.products.reduce(
          (m: number, p: Product) => m + p.images.length,
          0
        ),
      0
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