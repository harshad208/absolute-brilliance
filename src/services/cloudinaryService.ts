// ============================================================
// CLOUDINARY DELIVERY SERVICE  — client-safe
// ============================================================
// Builds Cloudinary delivery URLs for images and videos.
// public_ids are bare filenames like "cover_dpocvu" with no
// folder path — encodePublicId handles both this and any
// legacy paths that might contain slashes.

import type { CloudinaryTransformOptions } from '@/types';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const BASE_URL   = `https://res.cloudinary.com/${CLOUD_NAME}`;

function encodePublicId(publicId: string): string {
  // Encode each path segment so spaces → %20, slashes preserved
  return publicId.split('/').map(encodeURIComponent).join('/');
}

// ─── Image URL ────────────────────────────────────────────────

export function getImageUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  const {
    width,
    height,
    quality   = 'auto',
    format    = 'auto',
    crop      = 'fill',
    gravity   = 'auto',
    aspectRatio,
    blur,
  } = options;

  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    `c_${crop}`,
    `g_${gravity}`,
    width       && `w_${width}`,
    height      && `h_${height}`,
    aspectRatio && `ar_${aspectRatio}`,
    blur        && `e_blur:${blur}`,
  ]
    .filter(Boolean)
    .join(',');

  return `${BASE_URL}/image/upload/${transforms}/${encodePublicId(publicId)}`;
}

// ─── Thumbnail (square crop) ──────────────────────────────────

export function getThumbnailUrl(publicId: string, size = 400): string {
  return getImageUrl(publicId, {
    width: size, height: size,
    crop: 'fill', gravity: 'auto',
    quality: 'auto', format: 'auto',
  });
}

// ─── Blur placeholder (for next/image blurDataURL) ────────────

export function getBlurUrl(publicId: string): string {
  return getImageUrl(publicId, {
    width: 20, quality: 30,
    format: 'auto', blur: 1000, crop: 'fill',
  });
}

// ─── Video ────────────────────────────────────────────────────

export function getVideoUrl(publicId: string, format = 'auto'): string {
  return `${BASE_URL}/video/upload/f_${format},q_auto/${encodePublicId(publicId)}`;
}

export function getVideoPosterUrl(publicId: string, width = 800): string {
  return `${BASE_URL}/video/upload/f_jpg,q_auto,w_${width},so_0/${encodePublicId(publicId)}.jpg`;
}
