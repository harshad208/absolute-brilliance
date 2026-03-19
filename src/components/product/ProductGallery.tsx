'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CloudinaryImage } from '@/types';
import { getThumbnailUrl, getBlurUrl } from '@/services/cloudinaryService';

interface Props {
  images:      CloudinaryImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <div className="gallery__empty">No images available</div>;
  }

  const active = images[activeIndex];

  return (
    <div className="gallery">
      {/* Main image */}
      <div className="gallery__main">
        <Image
          key={active.publicId}
          src={getThumbnailUrl(active.publicId, 800)}
          alt={active.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain gallery__main-img"
          priority={activeIndex === 0}
          placeholder="blur"
          blurDataURL={getBlurUrl(active.publicId)}
          unoptimized
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="gallery__thumbs" role="list" aria-label={`${productName} images`}>
          {images.map((img, i) => (
            <button
              key={img.publicId}
              role="listitem"
              className={`gallery__thumb${i === activeIndex ? ' gallery__thumb--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
              aria-pressed={i === activeIndex}
            >
              <Image
                src={getThumbnailUrl(img.publicId, 120)}
                alt={img.alt}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
