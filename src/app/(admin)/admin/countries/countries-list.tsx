"use client";

import { useMemo, useState } from "react";
import { KeywordTagsInput } from "@/components/admin/keyword-tags-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateCountry } from "./actions";
import { normalizeSearch } from "@/lib/normalize-search";

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
  search_keywords?: string[] | null;
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

function CountryCard({ c }: { c: CountryRow }) {
  const { showToast } = useToast();
  const [searchKeywords, setSearchKeywords] = useState<string[]>(c.search_keywords ?? []);

  return (
    <Card key={c.id} className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-sm font-semibold">{c.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground font-mono">
            /country/{c.slug}
          </div>
        </div>
        <span className="label-xs px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
          Auto-published with venues
        </span>
      </div>

      <form
        action={async (formData) => {
          await updateCountry(formData);
          showToast(`${c.name} saved`);
        }}
        className="grid gap-5"
      >
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

        {/* Search keywords */}
        <div className="border-t border-[var(--border)] pt-5 grid gap-3">
          <div className="label-xs text-[var(--muted-foreground)]">SEARCH KEYWORDS</div>
          <input type="hidden" name="search_keywords" value={JSON.stringify(searchKeywords)} />
          <FieldGroup
            label="Alternative names"
            helper="Terms that redirect searchers to this country (e.g. England, Great Britain → United Kingdom)."
          >
            <KeywordTagsInput keywords={searchKeywords} onChange={setSearchKeywords} />
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
  );
}

export function CountriesList({ countries }: { countries: CountryRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return countries;
    return countries.filter(
      (c) =>
        normalizeSearch(c.name).includes(q) ||
        normalizeSearch(c.slug).includes(q),
    );
  }, [countries, search]);

  return (
    <div className="mt-6">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search countries…"
        className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <div className="mt-2 text-xs text-[var(--muted-foreground)]">
        {filtered.length} countr{filtered.length !== 1 ? "ies" : "y"}
      </div>

      <div className="mt-3 grid gap-4">
        {filtered.map((c) => (
          <CountryCard key={c.id} c={c} />
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            {search ? "No countries match your search." : "No countries yet. Create one above."}
          </p>
        )}
      </div>
    </div>
  );
}
