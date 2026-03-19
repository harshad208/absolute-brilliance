// src/app/categories/[category]/page.tsx  —  Route: /categories/anklets
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCategories, getCategory, REVALIDATE_SECONDS } from '@/data/catalog';
import { getThumbnailUrl, getBlurUrl } from '@/services/cloudinaryService';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const revalidate = REVALIDATE_SECONDS;

// Next.js 15: params is a Promise
interface Props {
  params: Promise<{ category: string }>;
}

// Pre-render known categories at build time for instant first load.
// New categories added later are rendered on first request then cached.
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map(c => ({ category: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.name} — Absolute Brilliance`,
    description: `Browse our ${cat.name} jewellery — ${cat.products.length} pieces.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) notFound();

  return (
    <main>
      <div className="container">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: cat.name },
          ]}
        />

        <header className="page-header">
          <h1 className="page-title">{cat.name}</h1>
          <p className="product-count">
            {cat.products.length}{' '}
            {cat.products.length === 1 ? 'piece' : 'pieces'}
          </p>
        </header>

        {cat.products.length === 0 ? (
          <p className="empty-state">No products in this collection yet.</p>
        ) : (
          <div className="product-grid">
            {cat.products.map(product => {
              const img1 = product.images[0];
              const img2 = product.images[1];
              return (
                <Link
                  key={product.id}
                  href={`/categories/${cat.id}/${product.id}`}
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
                      <div className="product-card__placeholder" />
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
        )}
      </div>
    </main>
  );
}
