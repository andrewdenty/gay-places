/**
 * Generates PWA icon PNGs from the rainbow-logo.svg source.
 * Run with: npm run generate-icons
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

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

  for (const { name, size } of sizes) {
    await sharp(svgPath).resize(size, size).png().toFile(path.join(outputDir, name));
    console.log(`✓ Generated ${name} (${size}×${size})`);
  }

  // Maskable icon — 20% safe-zone padding on each side (icon fills 60% of canvas)
  // Required for Android adaptive icons to avoid clipping
  const maskableSize = 512;
  const padding = Math.round(maskableSize * 0.2);
  const innerSize = maskableSize - padding * 2; // ~307px

  const innerBuffer = await sharp(svgPath).resize(innerSize, innerSize).png().toBuffer();

  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 252, g: 252, b: 251, alpha: 1 }, // #fcfcfb
    },
  })
    .composite([{ input: innerBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(outputDir, "icon-512-maskable.png"));

  console.log(`✓ Generated icon-512-maskable.png (${maskableSize}×${maskableSize}, maskable)`);
  console.log("\nAll icons generated in public/icons/");
}

main().catch(console.error);
