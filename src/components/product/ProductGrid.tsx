import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { getThumbnailUrl, getBlurUrl } from '@/services/cloudinaryService';

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="product-grid">
      {products.map(product => {
        const img1 = product.images[0];
        const img2 = product.images[1];
        const href = `/categories/${product.categoryId}/${product.id}`;

        return (
          <Link key={product.id} href={href} className="product-card">
            <div className="product-card__image">
              {img1 ? (
                <>
                  <Image
                    src={getThumbnailUrl(img1.publicId, 500)}
                    alt={img1.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover product-card__img"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={getBlurUrl(img1.publicId)}
                    unoptimized
                  />
                  {img2 && (
                    <Image
                      src={getThumbnailUrl(img2.publicId, 500)}
                      alt={img2.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover product-card__img product-card__img--hover"
                      loading="lazy"
                      unoptimized
                    />
                  )}
                </>
              ) : (
                <div className="product-card__placeholder" aria-label="No image" />
              )}
              {product.videos.length > 0 && (
                <span className="product-card__badge">Video</span>
              )}
            </div>
            <div className="product-card__body">
              <h3 className="product-card__name">{product.productName}</h3>
              {product.description && (
                <p className="product-card__desc">
                  {product.description.length > 80
                    ? product.description.slice(0, 80) + '…'
                    : product.description}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
