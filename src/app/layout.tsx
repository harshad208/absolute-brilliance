// src/app/layout.tsx
import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import Link from 'next/link';
import { getCategories } from '@/data/catalog';
import '@/styles/globals.css';
import '@/styles/navbar.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Absolute Brilliance',
    template: '%s | Absolute Brilliance',
  },
  description: 'Handcrafted jewellery catalog.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();
  const whatsapp   = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <header className="navbar">
          <div className="container navbar__inner">
            <Link href="/" className="navbar__logo">Golden Leaf</Link>

            {categories.length > 0 && (
              <nav className="navbar__nav" aria-label="Main navigation">
                {categories.map(cat => (
                  <Link key={cat.id} href={`/categories/${cat.id}`}>
                    {cat.name}
                  </Link>
                ))}
              </nav>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                className="navbar__cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact Us
              </a>
            )}
          </div>
        </header>

        <div className="page-content">{children}</div>

        <footer className="footer">
          <div className="container footer__inner">
            <p className="footer__brand">Absolute Brilliance</p>
            <p className="footer__copy">
              Handcrafted jewellery catalog. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
