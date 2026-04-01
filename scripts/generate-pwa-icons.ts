/**
 * Generates PWA icon PNGs from the rainbow-logo.svg source.
 * All icons have a comfortable inset — the logo fills ~62% of the canvas
 * with the app background colour (#fcfcfb) behind it, matching the look of
 * well-designed app icons (e.g. Claude).
 * Run with: npm run generate-icons
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

// Logo fills this fraction of the canvas; the rest is padding on each side
const LOGO_FILL = 0.62;

async function makeIcon(svgPath: string, canvasSize: number): Promise<Buffer> {
  const logoSize = Math.round(canvasSize * LOGO_FILL);
  const logoBuffer = await sharp(svgPath).resize(logoSize, logoSize).png().toBuffer();
  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 252, g: 252, b: 251, alpha: 1 }, // #fcfcfb
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  const svgPath = path.join(process.cwd(), "public", "rainbow-logo.svg");
  const outputDir = path.join(process.cwd(), "public", "icons");

  fs.mkdirSync(outputDir, { recursive: true });

  const sizes: Array<{ name: string; size: number }> = [
    { name: "icon-180.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-1024.png", size: 1024 },
  ];

  // Generate all standard icons in parallel
  await Promise.all(
    sizes.map(async ({ name, size }) => {
      const buf = await makeIcon(svgPath, size);
      await sharp(buf).toFile(path.join(outputDir, name));
      console.log(`✓ ${name} (${size}×${size})`);
    })
  );

  // Maskable icon needs a slightly larger safe zone (20% each side) for
  // Android adaptive icon clipping — keep it separate so the fill differs
  const maskableSize = 512;
  const maskableFill = 0.6; // 20% padding each side
  const logoSize = Math.round(maskableSize * maskableFill);
  const logoBuffer = await sharp(svgPath).resize(logoSize, logoSize).png().toBuffer();
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 252, g: 252, b: 251, alpha: 1 },
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(outputDir, "icon-512-maskable.png"));

  console.log(`✓ icon-512-maskable.png (${maskableSize}×${maskableSize}, maskable)`);
  console.log("\nAll icons generated in public/icons/");
}

main().catch(console.error);
