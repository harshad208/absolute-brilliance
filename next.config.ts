// next.config.ts
import type { NextConfig } from 'next';

// ─── Why no output:'export' ───────────────────────────────────
// Static export (output:'export') bakes pages into HTML at build
// time and never updates them. To get automatic 60-minute refresh
// we use ISR (Incremental Static Regeneration) instead.
//
// With ISR:
//   - Pages are still pre-rendered (fast first load)
//   - After revalidate seconds, Next.js re-fetches Cloudinary
//     in the background and serves the fresh version to the
//     next visitor — zero manual rebuilds needed.
//
// Netlify supports ISR via @netlify/plugin-nextjs (in package.json).

const config: NextConfig = {
  compress: true,

  images: {
    // We pass fully-built Cloudinary URLs as src, so Next.js
    // must not try to re-optimize them through its own pipeline.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default config;
