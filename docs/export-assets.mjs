// Rasterize the dowel brand SVGs into PNGs. Run from the docs package so it
// resolves the local sharp install:
//   node export-assets.mjs
// No .ico here: dowel ships no executable.
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ASSETS = fileURLToPath(new URL("../assets/", import.meta.url));

// The S tile (filled hex, bold code) is what reads at icon sizes; L carries
// the metaphor and is used wherever the mark is larger than 64 px.
const S = path.join(ASSETS, "logo-s.svg");
const L = path.join(ASSETS, "logo.svg");
const BANNER = path.join(ASSETS, "banner.svg");

async function png(src, size, out) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(out);
}

await png(S, 32, path.join(ASSETS, "favicon-32.png"));
await png(L, 180, path.join(ASSETS, "apple-touch-icon.png"));
await png(L, 512, path.join(ASSETS, "logo-512.png"));
console.log("wrote pngs");

// GitHub social preview: 1280x640. The banner plate spans the full 720px while
// the artwork fills the left ~570px, so the tail is trimmed and the plate is
// dropped (a rounded plate over an identical background leaves a seam).
const bannerWidth = 1600;
const bannerHeight = Math.round((bannerWidth * 170) / 720);
const inset = Math.round((bannerWidth * 6) / 720);
const banner = await sharp(BANNER, { density: 384 })
  .resize({ width: bannerWidth })
  .extract({ left: inset, top: inset, width: 1290 - inset, height: bannerHeight - 2 * inset })
  .png()
  .toBuffer();

await sharp({
  create: { width: 1280, height: 640, channels: 4, background: "#1B2126" },
})
  .composite([{ input: await sharp(banner).resize({ width: 880 }).png().toBuffer(), gravity: "centre" }])
  .png()
  .toFile(path.join(ASSETS, "social-preview.png"));
console.log("wrote social-preview.png");
