import Link from "next/link";
import Image from "next/image";
import { ArrowUp, Heart, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileTabs } from "@/components/account/profile-tabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { venueUrlPath } from "@/lib/slugs";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type VenueItem = {
  id: string;
  name: string;
  slug: string;
  venue_type: string;
  city_slug: string;
  city_name: string;
};

type Submission = {
  id: string;
  kind: string;
  status: string;
  created_at: string;
  venue_id: string | null;
  proposed_data: Record<string, unknown>;
};

type ApprovedVenueInfo = {
  slug: string;
  venue_type: string;
  city_slug: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VENUE_TYPE_LABEL: Record<string, string> = {
  bar: "Bar",
  club: "Club",
  restaurant: "Restaurant",
  cafe: "Café",
  sauna: "Sauna",
  event_space: "Event Space",
  cruising: "Cruising",
  hotel: "Hotel",
  shop: "Shop",
  other: "Place",
};

const SUBMISSION_KIND_LABEL: Record<string, string> = {
  new_venue: "New place",
  edit_venue: "Edit suggestion",
  new_review: "Review",
  new_photo: "Photo",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <Badge className="bg-green-50 text-green-800 border-green-200 shrink-0">
        Approved
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge className="bg-red-50 text-red-800 border-red-200 shrink-0">
        Rejected
      </Badge>
    );
  return (
    <Badge className="bg-amber-50 text-amber-800 border-amber-200 shrink-0">
      Pending
    </Badge>
  );
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function VenueList({
  venues,
  emptyHeading,
  emptyBody,
}: {
  venues: VenueItem[];
  emptyHeading: string;
  emptyBody: string;
}) {
  if (venues.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">{emptyHeading}</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{emptyBody}</p>
        <Link href="/" className="btn-sm btn-sm-secondary mt-4 inline-flex">
          Explore places
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {venues.map((venue) => (
        <Link
          key={venue.id}
          href={venueUrlPath(venue.city_slug, venue.venue_type, venue.slug)}
          className="group flex items-center justify-between border-b border-[var(--border)] py-3 overflow-hidden"
        >
          <div className="flex flex-col gap-1 pt-3 pb-2 flex-1 min-w-0 mr-4">
            <span className="text-[17px] font-semibold text-[var(--foreground)] leading-[1.4] truncate">
              {venue.name}
            </span>
            <div className="font-mono text-[12px] text-[var(--muted-foreground)] leading-[1.4]">
              {venue.city_name} • {VENUE_TYPE_LABEL[venue.venue_type] ?? "Place"}
            </div>
          </div>
          <ArrowRight
            size={18}
            className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors shrink-0"
          />
        </Link>
      ))}
    </div>
  );
}

function ContributionsList({
  submissions,
  approvedVenueMap,
}: {
  submissions: Submission[];
  approvedVenueMap: Map<string, ApprovedVenueInfo>;
}) {
  if (submissions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">No contributions yet</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Found a great spot that&rsquo;s missing from the map? Add it.
        </p>
        <Link href="/suggest" className="btn-sm btn-sm-secondary mt-4 inline-flex">
          Add a place
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {submissions.map((s) => {
        const pd = s.proposed_data ?? {};
        const name =
          typeof pd.name === "string" ? pd.name : SUBMISSION_KIND_LABEL[s.kind] ?? s.kind;
        const cityName = typeof pd.city_name === "string" ? pd.city_name : null;
        const kindLabel = SUBMISSION_KIND_LABEL[s.kind] ?? s.kind;
        const date = new Date(s.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const meta = [kindLabel, cityName, date].filter(Boolean).join(" • ");

        const approvedVenue =
          s.status === "approved" && s.venue_id
            ? approvedVenueMap.get(s.venue_id)
            : null;
        const venueHref = approvedVenue
          ? venueUrlPath(approvedVenue.city_slug, approvedVenue.venue_type, approvedVenue.slug)
          : null;

        const rowClass =
          "group flex items-center justify-between border-b border-[var(--border)] py-3 overflow-hidden";

        const rowContent = (
          <>
            <div className="flex flex-col gap-1 pt-3 pb-2 flex-1 min-w-0 mr-4">
              <span className="text-[17px] font-semibold text-[var(--foreground)] leading-[1.4] truncate">
                {name}
              </span>
              <div className="font-mono text-[12px] text-[var(--muted-foreground)] leading-[1.4]">
                {meta}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={s.status} />
              {venueHref && (
                <ArrowRight
                  size={18}
                  className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors"
                />
              )}
            </div>
          </>
        );

        return venueHref ? (
          <Link key={s.id} href={venueHref} className={rowClass}>
            {rowContent}
          </Link>
        ) : (
          <div key={s.id} className={rowClass}>
            {rowContent}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="py-10 sm:py-14">
        <div className="rounded-xl border border-[var(--border)] p-8 text-center">
          <p className="text-sm font-medium">Sign in to see your places</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Track places you&rsquo;ve visited, your recommendations, and your contributions.
          </p>
        </div>
      </div>
    );
  }

  // ── Data fetching ───────────────────────────────────────────────────────────

  const [{ data: interactionRows }, { data: submissionsData }] = await Promise.all([
    supabase
      .from("venue_interactions")
      .select("been_here, recommend, venue_id")
      .eq("user_id", user.id)
      .or("been_here.eq.true,recommend.eq.true")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("submissions")
      .select("id,kind,status,created_at,venue_id,proposed_data")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const submissions = (submissionsData ?? []) as Submission[];

  type InteractionRow = { been_here: boolean; recommend: boolean; venue_id: string };
  const typedInteractionRows = (interactionRows ?? []) as InteractionRow[];

  const interactionVenueIds = [
    ...new Set(typedInteractionRows.map((r) => r.venue_id)),
  ];
  const approvedSpotVenueIds = submissions
    .filter((s) => s.kind === "new_venue" && s.status === "approved" && s.venue_id)
    .map((s) => s.venue_id as string);

  const [interactionVenueData, approvedVenueData] = await Promise.all([
    interactionVenueIds.length > 0
      ? supabase
          .from("venues")
          .select("id,name,slug,venue_type,cities!inner(slug,name)")
          .in("id", interactionVenueIds)
          .eq("published", true)
      : { data: [] as unknown[] },
    approvedSpotVenueIds.length > 0
      ? supabase
          .from("venues")
          .select("id,slug,venue_type,cities!inner(slug)")
          .in("id", approvedSpotVenueIds)
      : { data: [] as unknown[] },
  ]);

  const interactionVenueMap = new Map<string, VenueItem>();
  for (const v of interactionVenueData.data ?? []) {
    const row = v as {
      id: string;
      name: string;
      slug: string;
      venue_type: string;
      cities: { slug: string; name: string };
    };
    interactionVenueMap.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      venue_type: row.venue_type,
      city_slug: row.cities.slug,
      city_name: row.cities.name,
    });
  }

  const approvedVenueMap = new Map<string, ApprovedVenueInfo>();
  for (const v of approvedVenueData.data ?? []) {
    const row = v as {
      id: string;
      slug: string;
      venue_type: string;
      cities: { slug: string };
    };
    approvedVenueMap.set(row.id, {
      slug: row.slug,
      venue_type: row.venue_type,
      city_slug: row.cities.slug,
    });
  }

  const beenHereIds = new Set<string>();
  const recommendIds = new Set<string>();
  const beenHereVenues: VenueItem[] = [];
  const recommendedVenues: VenueItem[] = [];

  for (const row of typedInteractionRows) {
    const venue = interactionVenueMap.get(row.venue_id);
    if (!venue) continue;
    if (row.been_here && !beenHereIds.has(venue.id)) {
      beenHereIds.add(venue.id);
      beenHereVenues.push(venue);
    }
    if (row.recommend && !recommendIds.has(venue.id)) {
      recommendIds.add(venue.id);
      recommendedVenues.push(venue);
    }
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────

  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const emailInitial = user.email ? user.email[0].toUpperCase() : "?";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="py-10 sm:py-14">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="h2-editorial">Your Places</h1>
          <div className="mt-2 flex items-center gap-2">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover shrink-0"
                unoptimized
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[9px] font-semibold shrink-0 select-none">
                {emailInitial}
              </div>
            )}
            <span className="text-xs text-[var(--muted-foreground)]">{user.email}</span>
          </div>
        </div>
        <Link href="/suggest" className="btn-sm btn-sm-secondary shrink-0 mt-1">
          Add a place
        </Link>
      </div>

      {/* Tabbed content */}
      <ProfileTabs
        tabs={[
          {
            id: "been-here",
            label: "Been Here",
            count: beenHereVenues.length,
            icon: <ArrowUp size={13} strokeWidth={1.75} />,
          },
          {
            id: "recommended",
            label: "Recommended",
            count: recommendedVenues.length,
            icon: <Heart size={13} strokeWidth={1.75} />,
          },
          {
            id: "contributions",
            label: "Contributions",
            count: submissions.length,
          },
        ]}
        panels={[
          <VenueList
            venues={beenHereVenues}
            emptyHeading="No places yet"
            emptyBody="Tap 'Been Here' on any venue page to start tracking your visits."
          />,
          <VenueList
            venues={recommendedVenues}
            emptyHeading="No recommendations yet"
            emptyBody="Tap 'Recommend' on any venue page to share your favourite spots."
          />,
          <ContributionsList
            submissions={submissions}
            approvedVenueMap={approvedVenueMap}
          />,
        ]}
      />
    </div>
  );
}
