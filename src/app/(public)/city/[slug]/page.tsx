import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCityBySlug, getVenuesByCitySlug } from "@/lib/data/public";
import { CityExplorer } from "@/components/city/city-explorer";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <Container className="py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {slug}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            Connect Supabase to load cities and venues.
          </div>
        </div>
        <Card className="p-6">
          <div className="text-sm font-semibold">Missing environment</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Add <span className="font-medium text-foreground">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
            <span className="font-medium text-foreground">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </span>{" "}
            to <span className="font-medium text-foreground">.env.local</span>,
            then restart <span className="font-medium text-foreground">npm run dev</span>.
          </div>
        </Card>
      </Container>
    );
  }

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const venues = await getVenuesByCitySlug(slug);

  return (
    <Container className="py-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {city.name}
        </h1>
        <div className="mt-1 text-sm text-muted-foreground">{city.country}</div>
      </div>

      <CityExplorer city={city} venues={venues} />
    </Container>
  );
}

