/**
 * Seed script: Upload venue photos to Supabase Storage and insert venue_photos records.
 * Uses freely-licensed images from Unsplash Source.
 * Run with: npx tsx scripts/seed-photos.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oxdlypfblekvcsfarghv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZGx5cGZibGVrdmNzZmFyZ2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEzMzE0MiwiZXhwIjoyMDg4NzA5MTQyfQ.tGSt1EmAhDidEeozAQnlZJJh-FOWJ-37e32loonADzc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Photo definitions: venue name → array of Unsplash photo IDs
// Each ID is a specific Unsplash photo (freely usable, no auth needed)
// ---------------------------------------------------------------------------

// Format: https://images.unsplash.com/photo-{ID}?w=800&q=80
// Venue names must exactly match the `name` column in the venues table.
const PHOTO_MAP: Record<string, string[]> = {
  // Berlin
  "Berghain": [
    "1516450360452-9312f5e86fc7", // dark club interior
    "1598387993441-a364f854c3e1", // moody neon bar
  ],
  "KitKatClub": [
    "1574156979543-a05fb6b9f80e",
    "1470225620780-dba8ba36b745",
  ],
  "Bunker Club": [
    "1611532736597-de2d4265fba3",
    "1516450360452-9312f5e86fc7",
  ],
  "Lab.oratory": [
    "1533174072545-7a4b6ad7a6c3",
    "1611532736597-de2d4265fba3",
  ],
  "Prinzknecht": [
    "1569087823207-a7a9c51dc474",
    "1574156979543-a05fb6b9f80e",
  ],
  "WOOF Berlin": [
    "1516450360452-9312f5e86fc7",
    "1598387993441-a364f854c3e1",
  ],
  "Hafen": [
    "1533174072545-7a4b6ad7a6c3",
    "1470225620780-dba8ba36b745",
  ],
  "Café Neues Ufer": [
    "1502602096584-5e3a3671d1dc",
    "1504674900247-0877df9cc836",
  ],
  "Der Boiler": [
    "1469041797191-52dc812e4e6e",
    "1469041797191-52dc812e4e6e",
  ],

  // Barcelona
  "Arena Classic": [
    "1598387993441-a364f854c3e1",
    "1470225620780-dba8ba36b745",
  ],
  "Sky Bar": [
    "1502602096584-5e3a3671d1dc",
    "1504674900247-0877df9cc836",
  ],
  "Boys Bar BCN": [
    "1533174072545-7a4b6ad7a6c3",
    "1516450360452-9312f5e86fc7",
  ],
  "Bar Bitch": [
    "1611532736597-de2d4265fba3",
    "1574156979543-a05fb6b9f80e",
  ],
  "Sala Diana": [
    "1470225620780-dba8ba36b745",
    "1533174072545-7a4b6ad7a6c3",
  ],
  "La Sastrería": [
    "1569087823207-a7a9c51dc474",
    "1598387993441-a364f854c3e1",
  ],
  "Plata Bar": [
    "1516450360452-9312f5e86fc7",
    "1574156979543-a05fb6b9f80e",
  ],

  // London
  "Jolene Bar": [
    "1574156979543-a05fb6b9f80e",
    "1611532736597-de2d4265fba3",
  ],
  "Royal Vauxhall Tavern": [
    "1569087823207-a7a9c51dc474",
    "1516450360452-9312f5e86fc7",
  ],
  "Eagle London": [
    "1533174072545-7a4b6ad7a6c3",
    "1598387993441-a364f854c3e1",
  ],
  "Ku Bar": [
    "1598387993441-a364f854c3e1",
    "1502602096584-5e3a3671d1dc",
  ],
  "Freedom Bar": [
    "1504674900247-0877df9cc836",
    "1470225620780-dba8ba36b745",
  ],
  "Fire": [
    "1516450360452-9312f5e86fc7",
    "1598387993441-a364f854c3e1",
  ],
  "Admiral Duncan": [
    "1533174072545-7a4b6ad7a6c3",
    "1574156979543-a05fb6b9f80e",
  ],
  "Comptons of Soho": [
    "1469041797191-52dc812e4e6e",
    "1533174072545-7a4b6ad7a6c3",
  ],
  "Drake's Club": [
    "1611532736597-de2d4265fba3",
    "1516450360452-9312f5e86fc7",
  ],
  "Saints Bar": [
    "1574156979543-a05fb6b9f80e",
    "1469041797191-52dc812e4e6e",
  ],

  // Prague
  "Club Termix": [
    "1611532736597-de2d4265fba3",
    "1533174072545-7a4b6ad7a6c3",
  ],
  "Piano Bar": [
    "1502602096584-5e3a3671d1dc",
    "1598387993441-a364f854c3e1",
  ],
  "Klub 21": [
    "1516450360452-9312f5e86fc7",
    "1574156979543-a05fb6b9f80e",
  ],
  "Celebrity Café": [
    "1469041797191-52dc812e4e6e",
    "1533174072545-7a4b6ad7a6c3",
  ],
  "Never Mind": [
    "1470225620780-dba8ba36b745",
    "1611532736597-de2d4265fba3",
  ],
};

async function downloadImage(unsplashId: string): Promise<Buffer> {
  const url = `https://images.unsplash.com/photo-${unsplashId}?w=800&q=80&auto=format&fit=crop`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  console.log("Fetching all venues…");
  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .select("id, name");
  if (venuesError) throw venuesError;
  if (!venues) throw new Error("No venues returned");

  const venueByName = new Map(venues.map((v) => [v.name, v.id]));

  for (const [venueName, photoIds] of Object.entries(PHOTO_MAP)) {
    const venueId = venueByName.get(venueName);
    if (!venueId) {
      console.warn(`  ⚠ Venue not found in DB: ${venueName}`);
      continue;
    }

    console.log(`\nProcessing: ${venueName} (${venueId})`);

    for (let i = 0; i < photoIds.length; i++) {
      const unsplashId = photoIds[i];
      const filename = `photo-${i + 1}.jpg`;
      const storagePath = `public/${venueId}/${filename}`;

      // Check if already uploaded
      const { data: existing } = await supabase
        .from("venue_photos")
        .select("id")
        .eq("venue_id", venueId)
        .eq("storage_path", storagePath)
        .maybeSingle();

      if (existing) {
        console.log(`  ✓ Already exists: ${storagePath}`);
        continue;
      }

      try {
        console.log(`  ↓ Downloading photo ${i + 1} (${unsplashId})…`);
        const imageBuffer = await downloadImage(unsplashId);

        console.log(`  ↑ Uploading to ${storagePath}…`);
        const { error: uploadError } = await supabase.storage
          .from("venue-photos")
          .upload(storagePath, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error(`  ✗ Upload failed: ${uploadError.message}`);
          continue;
        }

        const { error: dbError } = await supabase.from("venue_photos").insert({
          venue_id: venueId,
          storage_path: storagePath,
          caption: "",
          author_id: null,
        });

        if (dbError) {
          console.error(`  ✗ DB insert failed: ${dbError.message}`);
        } else {
          console.log(`  ✓ Done: ${storagePath}`);
        }

        // Small delay to avoid hammering Unsplash
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`  ✗ Error for ${unsplashId}:`, err);
      }
    }
  }

  console.log("\n✅ Photo seeding complete.");
}

main().catch(console.error);
