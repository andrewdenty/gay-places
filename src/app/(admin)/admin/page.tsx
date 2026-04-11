import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: venueCount },
    { count: cityCount },
    { count: countryCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from("venues").select("id", { count: "exact", head: true }),
    supabase.from("cities").select("id", { count: "exact", head: true }),
    supabase.from("countries").select("id", { count: "exact", head: true }),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const pending = pendingCount ?? 0;

  const stats = [
    {
      label: "Places",
      value: venueCount ?? 0,
      href: "/admin/venues",
      alert: false,
    },
    {
      label: "Cities",
      value: cityCount ?? 0,
      href: "/admin/cities",
      alert: false,
    },
    {
      label: "Countries",
      value: countryCount ?? 0,
      href: "/admin/countries",
      alert: false,
    },
    {
      label: "New submissions",
      value: pending,
      href: "/admin/submissions",
      alert: pending > 0,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Overview of Gay Places content.
      </p>

      {/* Submission alert banner */}
      {pending > 0 && (
        <Link
          href="/admin/submissions"
          className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base">
              📍
            </span>
            <div>
              <div className="text-sm font-semibold text-amber-900">
                {pending === 1
                  ? "1 new venue submission"
                  : `${pending} new venue submissions`}{" "}
                waiting for review
              </div>
              <div className="text-xs text-amber-700">
                Approve to send to the enrichment pipeline
              </div>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium text-amber-800">
            Review →
          </span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className={`group rounded-xl border p-5 transition-shadow hover:shadow-md ${
              stat.alert
                ? "border-amber-200 bg-amber-50"
                : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="text-3xl font-semibold tabular-nums"
                style={{
                  fontFamily:
                    'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
                }}
              >
                {stat.value}
              </div>
              {stat.alert && (
                <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
              )}
            </div>
            <div
              className={`mt-1 text-sm transition-colors ${
                stat.alert
                  ? "text-amber-700 group-hover:text-amber-900"
                  : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
              }`}
            >
              {stat.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
