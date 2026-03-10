import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { env } from "@/lib/env";
import { getCities } from "@/lib/data/public";

export default async function LandingPage() {
  const cities =
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? await getCities()
      : [];

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2">
          <Badge>Curated LGBTQ+ venues</Badge>
          <Badge>Mobile-first</Badge>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          Discover gay bars, clubs, and spots in new cities.
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          A minimal city guide: map + list browsing, venue details, and
          community suggestions—always moderated.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={cities[0] ? `/city/${cities[0].slug}` : "/city/copenhagen"}>
            <Button className="w-full sm:w-auto">
              {cities[0] ? `Browse ${cities[0].name}` : "Browse Copenhagen"}
            </Button>
          </Link>
          <Link href="/suggest">
            <Button className="w-full sm:w-auto" variant="secondary">
              Suggest a venue
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-4">
          {cities.length === 0 ? (
            <Card className="p-5">
              <div className="text-sm font-semibold">No cities yet</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Once Supabase is connected and seeded, your cities will appear
                here.
              </div>
            </Card>
          ) : (
            cities.map((city) => (
              <Card key={city.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{city.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {city.country}
                    </div>
                  </div>
                  <Link
                    href={`/city/${city.slug}`}
                    className="text-sm font-medium"
                  >
                    Open
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}

