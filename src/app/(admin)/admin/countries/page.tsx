import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCountry, updateCountry } from "./actions";

export const dynamic = "force-dynamic";

type CountryRow = {
  id: string;
  slug: string;
  name: string;
  intro?: string | null;
  editorial?: string | null;
  featured_city_ids?: string[] | null;
  featured_venue_ids?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  published: boolean;
};

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const textareaClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none";
const helperClass = "text-xs text-muted-foreground mt-1";
const labelClass = "text-xs font-medium text-foreground";

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
      <label className={labelClass}>{label}</label>
      <div className="mt-1">{children}</div>
      {helper && <p className={helperClass}>{helper}</p>}
    </div>
  );
}

export default async function AdminCountriesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: countries } = await supabase
    .from("countries")
    .select(
      "id,slug,name,intro,editorial,featured_city_ids,featured_venue_ids,seo_title,seo_description,published"
    )
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Countries</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create country pages to act as editorial gateways for city guides.
      </p>

      {/* Create form */}
      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold mb-4">Create country</div>
        <form action={createCountry} className="grid gap-3 sm:grid-cols-2">
          <input
            name="slug"
            placeholder="slug (e.g. denmark)"
            className={inputClass}
            required
          />
          <input
            name="name"
            placeholder="Name (e.g. Denmark)"
            className={inputClass}
            required
          />
          <div className="sm:col-span-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>

      {/* Country list */}
      <div className="mt-6 grid gap-4">
        {(countries as CountryRow[] ?? []).map((c) => (
          <Card key={c.id} className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground font-mono">
                  /country/{c.slug}
                </div>
              </div>
              <span
                className="label-xs px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
              >
                Auto-published with venues
              </span>
            </div>

            <form action={updateCountry} className="grid gap-5">
              <input type="hidden" name="id" value={c.id} />

              {/* Core identity */}
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldGroup label="Name">
                  <input
                    name="name"
                    defaultValue={c.name}
                    className={inputClass}
                  />
                </FieldGroup>
                <FieldGroup label="Slug">
                  <input
                    name="slug"
                    defaultValue={c.slug}
                    className={inputClass}
                  />
                </FieldGroup>
              </div>

              {/* Editorial fields */}
              <div className="border-t border-[var(--border)] pt-5 grid gap-4">
                <div className="label-xs text-[var(--muted-foreground)]">
                  EDITORIAL
                </div>
                <FieldGroup
                  label="Intro"
                  helper="One line, ~15 words. Shown below the country name."
                >
                  <input
                    name="intro"
                    defaultValue={c.intro ?? ""}
                    placeholder="e.g. A small country with an outsized queer scene."
                    className={inputClass}
                  />
                </FieldGroup>
                <FieldGroup
                  label="Editorial overview"
                  helper="1–3 paragraphs about the gay scene. Use line breaks to separate paragraphs."
                >
                  <textarea
                    name="editorial"
                    defaultValue={c.editorial ?? ""}
                    rows={6}
                    placeholder="Denmark has long punched above its weight…"
                    className={textareaClass}
                  />
                </FieldGroup>
              </div>

              {/* Curation */}
              <div className="border-t border-[var(--border)] pt-5 grid gap-4">
                <div className="label-xs text-[var(--muted-foreground)]">
                  CURATION
                </div>
                <FieldGroup
                  label="Featured city IDs"
                  helper="Paste city UUIDs, one per line. These cities appear at the top of the city list."
                >
                  <textarea
                    name="featured_city_ids"
                    defaultValue={(c.featured_city_ids ?? []).join("\n") ?? ""}
                    rows={3}
                    placeholder="e.g. 3f2a1b4c-…"
                    className={textareaClass}
                  />
                </FieldGroup>
                <FieldGroup
                  label="Featured venue IDs"
                  helper='Paste venue UUIDs, one per line. These appear in the "Worth seeking out" section.'
                >
                  <textarea
                    name="featured_venue_ids"
                    defaultValue={(c.featured_venue_ids ?? []).join("\n") ?? ""}
                    rows={3}
                    placeholder="e.g. 7a9c3d8e-…"
                    className={textareaClass}
                  />
                </FieldGroup>
              </div>

              {/* SEO — collapsed */}
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
                      defaultValue={c.seo_title ?? ""}
                      placeholder="Gay Bars & Queer Venues in Denmark"
                      className={inputClass}
                    />
                  </FieldGroup>
                  <FieldGroup
                    label="SEO description"
                    helper="~155 characters. Shown in search result snippets."
                  >
                    <textarea
                      name="seo_description"
                      defaultValue={c.seo_description ?? ""}
                      rows={2}
                      placeholder="A curated guide to gay bars, clubs, and queer spaces across Denmark."
                      className={textareaClass}
                    />
                  </FieldGroup>
                </div>
              </details>

              <div className="border-t border-[var(--border)] pt-4">
                <Button type="submit" variant="secondary">
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        ))}

        {(countries ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No countries yet. Create one above.
          </p>
        )}
      </div>
    </div>
  );
}
