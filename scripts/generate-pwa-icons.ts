/**
 * Generates PWA icon PNGs from the rainbow-logo.svg source.
 * All icons have a comfortable inset — the logo fills ~68% of the canvas
 * with the background colour behind it (light: #fcfcfb, dark: #171717).
 * Run with: npm run generate-icons
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

// Logo fills this fraction of the canvas; the rest is padding on each side
const LOGO_FILL = 0.68;

// Maskable icons need a larger safe zone for Android adaptive icon clipping
const MASKABLE_FILL = 0.6;

const LIGHT_BG = { r: 252, g: 252, b: 251, alpha: 1 as const }; // #fcfcfb
const DARK_BG  = { r: 23,  g: 23,  b: 23,  alpha: 1 as const }; // #171717

async function makeIcon(
  svgPath: string,
  canvasSize: number,
  fill: number,
  bg: { r: number; g: number; b: number; alpha: number },
): Promise<Buffer> {
  const logoSize = Math.round(canvasSize * fill);
  const logoBuffer = await sharp(svgPath).resize(logoSize, logoSize).png().toBuffer();
  return sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: bg },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  const svgPath = path.join(process.cwd(), "public", "rainbow-logo.svg");
  const outputDir = path.join(process.cwd(), "public", "icons");

  fs.mkdirSync(outputDir, { recursive: true });

  const icons: Array<{ name: string; size: number; fill: number; bg: typeof LIGHT_BG }> = [
    // Light mode
    { name: "icon-180.png",  size: 180,  fill: LOGO_FILL,     bg: LIGHT_BG },
    { name: "icon-192.png",  size: 192,  fill: LOGO_FILL,     bg: LIGHT_BG },
    { name: "icon-512.png",  size: 512,  fill: LOGO_FILL,     bg: LIGHT_BG },
    { name: "icon-1024.png", size: 1024, fill: LOGO_FILL,     bg: LIGHT_BG },
    // Dark mode
    { name: "icon-180-dark.png", size: 180, fill: LOGO_FILL,  bg: DARK_BG },
    { name: "icon-512-dark.png", size: 512, fill: LOGO_FILL,  bg: DARK_BG },
    // Maskable (Android adaptive icons — larger safe zone)
    { name: "icon-512-maskable.png",      size: 512, fill: MASKABLE_FILL, bg: LIGHT_BG },
    { name: "icon-512-maskable-dark.png", size: 512, fill: MASKABLE_FILL, bg: DARK_BG  },
  ];

  await Promise.all(
    icons.map(async ({ name, size, fill, bg }) => {
      const buf = await makeIcon(svgPath, size, fill, bg);
      await sharp(buf).toFile(path.join(outputDir, name));
      console.log(`✓ ${name}`);
    })
  );

  console.log("\nAll icons generated in public/icons/");
}

main().catch(console.error);
