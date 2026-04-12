import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ClaimDismissButton } from "@/components/admin/claim-dismiss-button";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Claim = {
  id: string;
  venue_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

type VenueRow = {
  id: string;
  name: string;
  slug: string;
  venue_type: string;
  city_id: string;
  claimed: boolean;
};

export default async function AdminClaimsPage() {
  const supabase = await createSupabaseServerClient();

  // Auth + admin check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const adminClient = createSupabaseAdminClient();

  // Fetch all claims, newest first
  const { data: claims } = await adminClient
    .from("venue_claims")
    .select("id,venue_id,name,email,role,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (claims ?? []) as Claim[];

  // Fetch the referenced venues in one query
  const venueIds = [...new Set(rows.map((c) => c.venue_id))];
  const venueMap = new Map<string, VenueRow>();
  if (venueIds.length > 0) {
    const { data: venues } = await adminClient
      .from("venues")
      .select("id,name,slug,venue_type,city_id,claimed")
      .in("id", venueIds);
    for (const v of venues ?? []) {
      venueMap.set(v.id, v as VenueRow);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Claim requests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review inbound requests from venue owners and representatives. Follow up
        by email and mark the venue as verified in{" "}
        <Link href="/admin/venues" className="underline underline-offset-2">
          Places
        </Link>{" "}
        when confirmed.
      </p>

      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              No claim requests yet.
            </div>
          </Card>
        ) : (
          rows.map((claim) => {
            const venue = venueMap.get(claim.venue_id);
            return (
              <Card key={claim.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Venue link + verified badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      {venue ? (
                        <Link
                          href={`/admin/venues/${venue.id}`}
                          className="text-base font-semibold hover:underline underline-offset-2"
                        >
                          {venue.name}
                        </Link>
                      ) : (
                        <span className="text-base font-semibold text-muted-foreground">
                          Unknown venue
                        </span>
                      )}
                      {venue?.claimed && (
                        <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(claim.created_at)}
                      </span>
                    </div>

                    {/* Submitter details */}
                    <div className="mt-3 grid gap-1.5 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name: </span>
                        <span className="font-medium">{claim.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <a
                          href={`mailto:${claim.email}`}
                          className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                        >
                          {claim.email}
                        </a>
                      </div>
                      {claim.role && (
                        <div>
                          <span className="text-muted-foreground">Role: </span>
                          <span>{claim.role}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {venue && (
                      <Link
                        href={`/admin/venues/${venue.id}`}
                        className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit place →
                      </Link>
                    )}
                    <ClaimDismissButton id={claim.id} />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
