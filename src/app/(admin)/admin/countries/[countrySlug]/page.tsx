import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCountry } from "../actions";

export const dynamic = "force-dynamic";

const INPUT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-accent";
const TEXTAREA =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:ring-1 focus:ring-accent";
const LABEL = "text-xs font-medium text-foreground";
const HELPER = "text-xs text-muted-foreground mt-1";

function FieldGroup({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="mt-1">{children}</div>
      {helper && <p className={HELPER}>{helper}</p>}
    </div>
  );
}

export default async function EditCountryPage({
  params,
}: {
  params: Promise<{ countrySlug: string }>;
}) {
  const { countrySlug } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const { data: country } = await supabase
    .from("countries")
    .select(
      "id,slug,name,intro,editorial,featured_city_ids,featured_venue_ids,seo_title,seo_description,published",
    )
    .eq("slug", countrySlug)
    .maybeSingle();

  if (!country) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/countries"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Countries
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {country.name}
          </h1>
          <p className="mt-0.5 text-xs font-mono text-muted-foreground">
            /country/{country.slug}
          </p>
        </div>
        <span className="mt-1 rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--muted-foreground)]">
          Auto-published with venues
        </span>
      </div>

      <Card className="mt-6 p-6">
        <form action={updateCountry} className="grid gap-5">
          <input type="hidden" name="id" value={country.id} />

          {/* Core identity */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup label="Name">
              <input
                name="name"
                defaultValue={country.name}
                required
                className={INPUT}
              />
            </FieldGroup>
            <FieldGroup label="Slug">
              <input
                name="slug"
                defaultValue={country.slug}
                required
                className={INPUT}
              />
            </FieldGroup>
          </div>

          {/* Editorial */}
          <div className="border-t border-[var(--border)] pt-5 grid gap-4">
            <div className="label-xs text-[var(--muted-foreground)]">EDITORIAL</div>
            <FieldGroup
              label="Intro"
              helper="One line, ~15 words. Shown below the country name."
            >
              <input
                name="intro"
                defaultValue={country.intro ?? ""}
                placeholder="e.g. A small country with an outsized queer scene."
                className={INPUT}
              />
            </FieldGroup>
            <FieldGroup
              label="Editorial overview"
              helper="1–3 paragraphs about the gay scene. Use line breaks to separate paragraphs."
            >
              <textarea
                name="editorial"
                defaultValue={country.editorial ?? ""}
                rows={6}
                placeholder="The gay scene here is…"
                className={TEXTAREA}
              />
            </FieldGroup>
          </div>

          {/* Curation */}
          <div className="border-t border-[var(--border)] pt-5 grid gap-4">
            <div className="label-xs text-[var(--muted-foreground)]">CURATION</div>
            <FieldGroup
              label="Featured city IDs"
              helper="Paste city UUIDs, one per line. These cities appear at the top of the city list."
            >
              <textarea
                name="featured_city_ids"
                defaultValue={(country.featured_city_ids ?? []).join("\n")}
                rows={3}
                placeholder="e.g. 3f2a1b4c-0000-0000-0000-000000000000"
                className={TEXTAREA}
              />
            </FieldGroup>
            <FieldGroup
              label="Featured venue IDs"
              helper='Paste venue UUIDs, one per line. These appear in the "Worth seeking out" section.'
            >
              <textarea
                name="featured_venue_ids"
                defaultValue={(country.featured_venue_ids ?? []).join("\n")}
                rows={3}
                placeholder="e.g. 7a9c3d8e-0000-0000-0000-000000000000"
                className={TEXTAREA}
              />
            </FieldGroup>
          </div>

          {/* SEO */}
          <details className="border-t border-[var(--border)] pt-5">
            <summary className="label-xs text-[var(--muted-foreground)] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors">
              SEO (optional)
            </summary>
            <div className="mt-4 grid gap-4">
              <FieldGroup
                label="SEO title"
                helper="Overrides the default page title in search results."
              >
                <input
                  name="seo_title"
                  defaultValue={country.seo_title ?? ""}
                  placeholder="Gay Bars & Queer Venues in [Country]"
                  className={INPUT}
                />
              </FieldGroup>
              <FieldGroup
                label="SEO description"
                helper="~155 characters. Shown in search result snippets."
              >
                <textarea
                  name="seo_description"
                  defaultValue={country.seo_description ?? ""}
                  rows={2}
                  placeholder="A curated guide to gay bars, clubs, and queer spaces across [Country]."
                  className={TEXTAREA}
                />
              </FieldGroup>
            </div>
          </details>

          <div className="border-t border-[var(--border)] pt-4">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
