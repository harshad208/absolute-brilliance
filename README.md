# Absolute Brilliance — Jewellery Catalog

A fast, mobile-first jewellery catalog website built with **Next.js 14**, **TypeScript**, and **Cloudinary**. Images are served directly from Cloudinary and the catalog auto-refreshes every 60 minutes — no manual rebuild needed when you upload new photos.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Plain CSS (mobile-first, CSS variables) |
| Media | Cloudinary (images + videos) |
| Hosting | Netlify (with ISR via `@netlify/plugin-nextjs`) |
| Fonts | Cormorant Garamond + Jost (Google Fonts) |

---

## How It Works

1. At build time and every 60 minutes, the site fetches your Cloudinary folder structure using the Admin API
2. It reads your folder hierarchy (`Jewellery/Category/Product/`) and auto-builds all pages
3. Images are served via Cloudinary CDN with automatic format and quality optimisation
4. No database, no CMS — Cloudinary is the single source of truth

---

## Cloudinary Folder Structure

Your Cloudinary Media Library must follow this exact 3-level hierarchy:

```
Jewellery/                    ← Root folder (must be named exactly "Jewellery")
  Anklets/                    ← Category
    Adjustable Anklets/       ← Product (all images inside = this product's gallery)
      photo1.jpg
      photo2.jpg
    Beaded Anklets/
      photo1.jpg
  Bangles/
    Bridal Bangles/
      photo1.jpg
  Rings/
    Stackable Rings/
      cover.webp
      photo1.jpg
```

**Rules:**
- Root folder must be named `Jewellery` (capital J, exact spelling)
- Category = any folder directly inside `Jewellery/`
- Product = any folder directly inside a Category folder
- Images = any image files directly inside a Product folder
- Depth must be exactly 3 levels: `Jewellery/Category/Product/image`

---

## URL Structure

| Page | URL |
|---|---|
| Homepage | `/` |
| Category | `/categories/anklets` |
| Product detail | `/categories/anklets/anklets--adjustable-anklets` |

Product URL slugs are auto-generated from folder names:
`"Adjustable Anklets"` → `anklets--adjustable-anklets`

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Cloudinary — PUBLIC (used in browser for image URLs)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Cloudinary — SERVER ONLY (used at build/render time, never in browser)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# WhatsApp — international format, no + or spaces
# India example: 919876543210
NEXT_PUBLIC_WHATSAPP_NUMBER=XXXXXXXXXX
```

Find your Cloudinary credentials at: **cloudinary.com → Settings → API Keys**

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create and fill in .env.local (see above)
cp .env.example .env.local

# 3. Start dev server
npm run dev

# Open http://localhost:3000
```

**Note:** The dev server fetches from Cloudinary on first load. Subsequent restarts use a 60-minute disk cache at `.cache/catalog.json`. To force a fresh fetch:

```bash
rm -rf .cache && npm run dev
```

---

## Deployment (Netlify)

### First deploy

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/golden-leaf-jewels.git
git push -u origin main

# 2. Connect to Netlify
# Go to app.netlify.com → Add new site → Import from Git → select your repo
```

### Netlify settings

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | *(leave blank — plugin handles this)* |
| Node version | 20 |

### Environment variables in Netlify

Go to **Site settings → Environment variables** and add all 5 variables from your `.env.local`.

### Deploy

Every `git push` to `main` triggers an automatic Netlify build and deploy.

---

## Auto-Refresh (ISR)

The site uses **Incremental Static Regeneration (ISR)**. Pages are pre-rendered for speed but automatically re-fetch from Cloudinary in the background.

**How it works:**
- Upload a new image to Cloudinary
- Within 60 minutes, the next visitor to that page triggers a background re-fetch
- The updated page (with the new image) is served to all subsequent visitors
- No manual rebuild, no git push required

**To change the refresh interval**, edit one line in `src/data/catalog.ts`:

```ts
export const REVALIDATE_SECONDS = 3600; // 3600 = 1 hour
// 1800 = 30 min | 600 = 10 min | 86400 = 24 hours
```

**Cloudinary API calls per refresh cycle:** 2 (one for images, one for videos)
**Cloudinary free tier limit:** 500 Admin API calls/hour — you can refresh up to 250 times/hour before hitting the limit.

---

## Adding Products

1. In Cloudinary, navigate to your product folder (or create one):
   `Jewellery → Category → Product Name`
2. Upload your images directly into that folder
3. Within 60 minutes the new product appears on the site automatically

**To add a new category:** create a new folder directly inside `Jewellery/`

**To add a new product inside an existing category:** create a new subfolder inside that category folder

No code changes required.

---

## Adding Descriptions, Tags & Featured Products

The catalog discovers everything automatically from Cloudinary. To add optional metadata to specific products, edit `src/data/productOverrides.ts`:

```ts
export const productOverrides: Record<string, ProductOverride> = {

  // Key format: "{category-slug}--{product-slug}"
  // "Anklets / Adjustable Anklets" → "anklets--adjustable-anklets"
  // "Rings / Stackable Rings"      → "rings--stackable-rings"

  'anklets--adjustable-anklets': {
    description: 'Delicate adjustable anklet in 925 sterling silver.',
    featured: true,   // shows on homepage Featured section
    tags: ['silver', 'adjustable', 'daily wear'],
  },

};
```

After editing this file, commit and push — Netlify will rebuild automatically.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                         # Root layout (navbar, footer, fonts)
│   ├── page.tsx                           # Homepage
│   └── categories/
│       └── [category]/
│           ├── page.tsx                   # Category page (product grid)
│           └── [product]/
│               └── page.tsx              # Product detail (gallery + enquiry)
│
├── components/
│   ├── product/
│   │   ├── ProductGallery.tsx            # Image gallery with thumbnail strip
│   │   ├── ProductGrid.tsx               # Responsive product card grid
│   │   └── VideoPreview.tsx              # Click-to-play video with poster
│   └── ui/
│       └── Breadcrumb.tsx                # Navigation breadcrumb
│
├── data/
│   ├── catalog.ts                        # Single import point for all pages
│   └── productOverrides.ts               # Optional descriptions/tags per product
│
├── services/
│   ├── cloudinaryAdminService.ts         # Fetches catalog from Cloudinary API
│   └── cloudinaryService.ts              # Builds image/video delivery URLs
│
├── styles/
│   ├── globals.css                       # All styles (mobile-first)
│   └── navbar.css                        # Navbar + footer styles
│
└── types/
    └── index.ts                          # TypeScript interfaces
```

---

## Key Files Reference

| File | Purpose | Edit when |
|---|---|---|
| `src/data/productOverrides.ts` | Add descriptions, tags, featured flag | You want to enrich product info |
| `src/data/catalog.ts` | Change refresh interval | Adjusting `REVALIDATE_SECONDS` |
| `src/services/cloudinaryAdminService.ts` | Cloudinary API logic | ROOT_FOLDER name changes |
| `src/styles/globals.css` | All visual styles | Changing colours, layout, fonts |
| `.env.local` | API credentials | Never commit this file |

---

## Cloudinary Rate Limits (Free Tier)

| Resource | Free Limit |
|---|---|
| Admin API calls | 500 / hour |
| Storage | 25 GB |
| Bandwidth | 25 GB / month |

This project uses **2 Admin API calls per ISR cycle** (images + videos search). At the default 60-minute interval that is 2 calls/hour — well within the free tier.

---

## Troubleshooting

**Images not loading**
- Check `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly in `.env.local`
- Verify images are inside the correct folder depth: `Jewellery/Category/Product/image.jpg`
- Open browser DevTools → Network → filter by Img — check the URL is correct

**No categories showing**
- Check all 3 Cloudinary env vars are set: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Confirm root folder is named exactly `Jewellery` (capital J)
- Delete cache and restart: `rm -rf .cache && npm run dev`

**Rate limit error (HTTP 420)**
- You have hit 500 Admin API calls in one hour
- Wait until the top of the next hour for the limit to reset
- The dev server disk cache (`.cache/catalog.json`) prevents repeated calls on restart

**New images not appearing**
- ISR refreshes in the background — wait up to 60 minutes after upload
- To see changes immediately in dev: `rm -rf .cache && npm run dev`
- On production: the next page visit after 60 minutes triggers the refresh

**Params error in Next.js 15**
- All dynamic page files use `await params` — this is correct for Next.js 15
- If you see `params must be awaited` errors, ensure you are using the files from this project unchanged

---

## WhatsApp Enquiry

The product detail page includes a WhatsApp CTA button. Set your number in `.env.local`:

```env
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

Format: country code + number, no `+`, no spaces, no dashes.

The button sends a pre-filled message: *"Hi, I'm interested in [Product Name] from your [Category] collection."*

---

## License

Private project — all rights reserved.