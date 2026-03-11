import Link from "next/link";
import { Container } from "@/components/ui/container";

const featuredCities = [
  { name: "Berlin", slug: "berlin" },
  { name: "Barcelona", slug: "barcelona" },
  { name: "London", slug: "london" },
  { name: "Prague", slug: "prague" },
];

export default function LandingPage() {
  return (
    <Container className="py-10 sm:py-14">
      <header className="space-y-4 border-b border-border pb-8">
        <div className="label-small text-[#6a6a6a]">GAY PLACES</div>
        <h1 className="h1-editorial">
          Gay Places
        </h1>
        <p className="max-w-xl text-[15px] text-[#6a6a6a]">
          A curated guide to the world’s gay bars, clubs, and queer spaces.
          Calm, typographic, and unapologetically selective.
        </p>
      </header>

      <main className="mt-10 space-y-8">
        <section className="space-y-4">
          <h2 className="h2-editorial">Featured cities</h2>
          <p className="text-[14px] text-[#6a6a6a]">
            Start with a few of the world&apos;s most storied nightlife capitals.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featuredCities.map((city) => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="group flex flex-col border-b border-dashed border-[#e5e5e5] pb-4 transition-colors hover:border-[#111111]"
              >
                <span className="text-[15px] font-medium tracking-tight">
                  {city.name}
                </span>
                <span className="caption text-[#6a6a6a]">
                  Editorial picks, no ratings, just places that matter.
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-8">
          <h3 className="h2-editorial">What Gay Places is</h3>
          <p className="text-[15px] text-[#6a6a6a]">
            Less like an app store for venues and more like a quiet, opinionated
            travel companion. No stars. No endless feeds. Just the bars and
            neighborhoods worth crossing a city for.
          </p>
        </section>
      </main>
    </Container>
  );
}

