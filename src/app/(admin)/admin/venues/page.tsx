import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewVenueModal } from "@/components/admin/new-venue-modal";
import { SmartAddButton } from "@/components/admin/smart-add-button";
import { VenuesList, type VenueRow } from "./venues-list";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: cities }, { data: venues }, { data: citiesForModal }] = await Promise.all([
    supabase
      .from("cities")
      .select("id,slug,name")
      .order("name", { ascending: true }),
    supabase
      .from("venues")
      .select(
        "id,name,address,venue_type,published,closed,city_id,slug,updated_at,cities(slug,name)",
      )
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("cities")
      .select("id,name,slug,country")
      .order("name", { ascending: true }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Places</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {(venues ?? []).length} place{(venues ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewVenueModal cities={cities ?? []} />
          <SmartAddButton cities={(citiesForModal ?? []) as { id: string; name: string; slug: string; country: string }[]} />
        </div>
      </div>

      <VenuesList venues={(venues ?? []) as unknown as VenueRow[]} cities={cities ?? []} />
    </div>
  );
}
