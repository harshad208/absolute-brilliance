// src/app/categories/[category]/[product]/page.tsx
// Route: /categories/anklets/anklets--adjustable-anklets
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProductPaths, getCategory, getProduct, REVALIDATE_SECONDS } from '@/data/catalog';
import { getImageUrl } from '@/services/cloudinaryService';
import ProductGallery from '@/components/product/ProductGallery';
import VideoPreview from '@/components/product/VideoPreview';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const revalidate = REVALIDATE_SECONDS;

// Next.js 15: params is a Promise
interface Props {
  params: Promise<{ category: string; product: string }>;
}

export async function generateStaticParams() {
  return getAllProductPaths();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product: productId } = await params;
  const product = await getProduct(productId);
  if (!product) return {};
  const ogImage = product.images[0]
    ? getImageUrl(product.images[0].publicId, { width: 1200, height: 630, crop: 'fill' })
    : undefined;
  return {
    title: `${product.productName} — ${product.categoryName} | Absolute Brilliance`,
    description:
      product.description ??
      `${product.productName} — handcrafted ${product.categoryName.toLowerCase()} jewellery.`,
    openGraph: {
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { category, product: productId } = await params;

  const [cat, product] = await Promise.all([
    getCategory(category),
    getProduct(productId),
  ]);
  if (!cat || !product) notFound();

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
  const msg = encodeURIComponent(
    `Hi, I'm interested in "${product.productName}" from your ${product.categoryName} collection.`
  );

  return (
    <main>
      <div className="container">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: cat.name, href: `/categories/${cat.id}` },
            { label: product.productName },
          ]}
        />

        <div className="product-detail">

          {/* Left: media */}
          <div className="product-detail__media">
            <ProductGallery
              images={product.images}
              productName={product.productName}
            />
            {product.videos.length > 0 && (
              <div className="product-detail__videos">
                <h3 className="product-detail__video-title">Video</h3>
                {product.videos.map(video => (
                  <VideoPreview key={video.publicId} video={video} />
                ))}
              </div>
            )}
          </div>

          {/* Right: info */}
          <div className="product-detail__info">
            <p className="product-detail__meta">{cat.name}</p>
            <h1 className="product-detail__name">{product.productName}</h1>

            {product.description && (
              <p className="product-detail__description">{product.description}</p>
            )}

            <p className="product-detail__image-count">
              {product.images.length}{' '}
              {product.images.length === 1 ? 'photo' : 'photos'}
              {product.videos.length > 0 && ` · ${product.videos.length} video`}
            </p>

            {product.tags && product.tags.length > 0 && (
              <div className="product-detail__tags">
                {product.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="product-detail__enquiry">
              <p className="product-detail__enquiry-note">
                This is a catalog piece. Contact us to enquire about availability.
              </p>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}?text=${msg}`}
                  className="btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Enquire on WhatsApp
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
