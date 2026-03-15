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

  const stats = [
    {
      label: "Venues",
      value: venueCount ?? 0,
      href: "/admin/venues",
    },
    {
      label: "Cities",
      value: cityCount ?? 0,
      href: "/admin/cities",
    },
    {
      label: "Countries",
      value: countryCount ?? 0,
      href: "/admin/countries",
    },
    {
      label: "Pending submissions",
      value: pendingCount ?? 0,
      href: "/admin/submissions",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Overview of Gay Places content.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md"
          >
            <div className="text-3xl font-semibold tabular-nums" style={{ fontFamily: 'var(--font-instrument-serif), Georgia, "Times New Roman", serif' }}>
              {stat.value}
            </div>
            <div className="mt-1 text-sm text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
              {stat.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

