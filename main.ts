// The World in One Day — 22 November 2026.
// Copies the finished front-page image to the output directory and
// verifies the copy is a whole JPEG within the competition limits
// (at most 1 MiB, at most 1024 x 1024 pixels).
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "output";
const src = join(here, "entry.png");
const dst = join(outDir, "entry.png");

if (!existsSync(src)) {
  throw new Error(`entry.png not found next to main.ts (${src})`);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, dst);

const bytes = readFileSync(dst);
if (bytes.length > 1048576) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}
if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
  throw new Error("entry.png is not a JPEG (missing FF D8 FF magic)");
}
// JPEG SOF0/SOF2 carries width and height; scan segments for it.
let width = 0;
let height = 0;
for (let i = 2; i + 9 < bytes.length; ) {
  if (bytes[i] !== 0xff) break;
  const marker = bytes[i + 1];
  const len = (bytes[i + 2] << 8) | bytes[i + 3];
  if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
    height = (bytes[i + 5] << 8) | bytes[i + 6];
    width = (bytes[i + 7] << 8) | bytes[i + 8];
    break;
  }
  if (marker === 0xda) break;
  i += 2 + len;
}
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}
console.log(`Wrote ${dst} (${statSync(dst).size} bytes, ${width}x${height})`);
