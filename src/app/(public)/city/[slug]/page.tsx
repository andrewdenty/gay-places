import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCityBySlug, getVenuesByCitySlug } from "@/lib/data/public";
import { CityExplorer } from "@/components/city/city-explorer";

export const dynamic = "force-dynamic";

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

