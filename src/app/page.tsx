// src/app/page.tsx  —  Route: /
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCategories, getFeaturedProducts } from '@/data/catalog';
import { getThumbnailUrl, getBlurUrl } from '@/services/cloudinaryService';

// ISR: re-fetch Cloudinary every 60 min automatically.
// Must be a static number literal in Next.js 16.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Golden Leaf Jewels — Handcrafted Jewellery Catalog',
  description: 'Browse our collection of handcrafted jewellery.',
};

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(6),
  ]);

  return (
    <main>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Handcrafted with love</p>
          <h1 className="hero-title">Golden Leaf Jewels</h1>
          <p className="hero-subtitle">
            Explore our curated collections of handcrafted jewellery
          </p>
          <Link href="#categories" className="btn-primary">
            Browse Catalog
          </Link>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="section" id="categories">
        <div className="container">
          <h2 className="section-title">Collections</h2>

          {categories.length === 0 ? (
            <p className="empty-state">
              No collections found. Check Cloudinary setup.
            </p>
          ) : (
            <div className="category-grid">
              {categories.map(cat => {
                const coverPublicId = cat.products[0]?.images[0]?.publicId ?? null;
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.id}`}
                    className="category-card"
                  >
                    <div className="category-card__image">
                      {coverPublicId ? (
                        <Image
                          src={getThumbnailUrl(coverPublicId, 600)}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL={getBlurUrl(coverPublicId)}
                          unoptimized
                        />
                      ) : (
                        <div className="category-card__placeholder" />
                      )}
                    </div>
                    <div className="category-card__body">
                      <h3 className="category-card__name">{cat.name}</h3>
                      <span className="category-card__count">
                        {cat.products.length}{' '}
                        {cat.products.length === 1 ? 'piece' : 'pieces'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <h2 className="section-title">Featured Pieces</h2>
            <div className="product-grid">
              {featured.map(product => {
                const img1 = product.images[0];
                const img2 = product.images[1];
                return (
                  <Link
                    key={product.id}
                    href={`/categories/${product.categoryId}/${product.id}`}
                    className="product-card"
                  >
                    <div className="product-card__image">
                      {img1 ? (
                        <>
                          <Image
                            src={getThumbnailUrl(img1.publicId, 500)}
                            alt={img1.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover product-card__img"
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
                              unoptimized
                            />
                          )}
                        </>
                      ) : (
                        <div className="product-card__placeholder" />
                      )}
                      {product.videos.length > 0 && (
                        <span className="product-card__badge">Video</span>
                      )}
                    </div>
                    <div className="product-card__body">
                      <p className="product-card__category">{product.categoryName}</p>
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
          </div>
        </section>
      )}

    </main>
  );
}