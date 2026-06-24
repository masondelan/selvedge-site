#!/usr/bin/env node
// Rasterize public/favicon.svg → PNG fallbacks for browsers/clients that don't
// render SVG favicons (older Safari, some Android, link-unfurlers, RSS readers).
//
//   node scripts/gen-favicons.mjs   (or: npm run gen:icons)
//
// Writes (committed as static assets):
//   - public/favicon-32.png        32×32, transparent corners (browser tab)
//   - public/apple-touch-icon.png  180×180, flattened on indigo (iOS home screen)
//
// Starlight emits the SVG favicon; astro.config head adds <link>s to these PNGs
// as the progressive-enhancement fallback. Re-run when favicon.svg changes.

import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(ROOT, "public", "favicon.svg"));

// Browser tab icon — keep the rounded transparent corners.
const fav32 = await sharp(svg, { density: 384 }).resize(32, 32).png().toBuffer();
writeFileSync(join(ROOT, "public", "favicon-32.png"), fav32);
console.log(`wrote public/favicon-32.png (${fav32.length} bytes)`);

// Apple touch icon — iOS masks its own corners, so flatten onto the brand indigo
// (no transparency) for a clean home-screen tile.
const apple = await sharp(svg, { density: 384 })
  .resize(180, 180)
  .flatten({ background: "#1F3057" })
  .png()
  .toBuffer();
writeFileSync(join(ROOT, "public", "apple-touch-icon.png"), apple);
console.log(`wrote public/apple-touch-icon.png (${apple.length} bytes)`);
