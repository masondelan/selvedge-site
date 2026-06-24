#!/usr/bin/env node
// Rasterize public/og.svg → public/og.png (1200×630) for social / chat link previews.
//
//   node scripts/gen-og.mjs   (or: npm run gen:og)
//
// Browsers render the SVG fine, but X, Slack, LinkedIn, iMessage and most
// unfurlers do NOT rasterize SVG og:image — they need a real PNG. astro.config.mjs
// points og:image/twitter:image at /og.png, so this writes that asset.
//
// The generated png is COMMITTED as a static asset (not built on each deploy) so
// the unfurl image is deterministic and never depends on which fonts the CI box
// happens to have. Re-run this whenever public/og.svg changes.

import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(ROOT, "public", "og.svg");
const pngPath = join(ROOT, "public", "og.png");

const svg = readFileSync(svgPath);
// density 192 = render the 1200×630 SVG at 2× then downscale → crisp text/edges.
const png = await sharp(svg, { density: 192 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(pngPath, png);
console.log(`wrote public/og.png (${png.length} bytes)`);
