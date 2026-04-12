import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SubmissionActions } from "@/components/admin/submission-actions";

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

function VenueTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    bar: "Bar",
    club: "Club",
    restaurant: "Restaurant",
    cafe: "Café",
    sauna: "Sauna",
    event_space: "Event space",
    other: "Other",
  };
  return <Badge>{labels[type] ?? type}</Badge>;
}

function KindBadge({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    new_venue: "bg-purple-100 text-purple-800 border-purple-200",
    edit_venue: "bg-blue-100 text-blue-800 border-blue-200",
    new_review: "bg-green-100 text-green-800 border-green-200",
    new_photo: "bg-amber-100 text-amber-800 border-amber-200",
  };
  const labels: Record<string, string> = {
    new_venue: "New place",
    edit_venue: "Edit",
    new_review: "Review",
    new_photo: "Photo",
  };
  return (
    <Badge className={map[kind] ?? ""}>
      {labels[kind] ?? kind.replace(/_/g, " ")}
    </Badge>
  );
}

function EditTypeBadge({ editType }: { editType: string }) {
  const isClosure = editType === "place_closed";
  const labels: Record<string, string> = {
    incorrect_details: "Incorrect details",
    wrong_hours:       "Wrong hours",
    wrong_links:       "Wrong links",
    wrong_address:     "Wrong address",
    place_closed:      "Place closed",
    other:             "Other",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        isClosure
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {isClosure && <span className="mr-1">⚠</span>}
      {labels[editType] ?? editType.replace(/_/g, " ")}
    </span>
  );
}

type Submission = {
  id: string;
  kind: string;
  status: string;
  created_at: string;
  submitter_id: string | null;
  venue_id: string | null;
  city_id: string | null;
  proposed_data: Record<string, unknown>;
};

type VenueRow = {
  id: string;
  name: string;
};

export default async function AdminSubmissionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id,kind,status,created_at,submitter_id,venue_id,city_id,proposed_data")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  // Fetch submitter emails for display
  const adminClient = createSupabaseAdminClient();
  const submitterIds = [
    ...new Set(
      (submissions ?? [])
        .map((s: Submission) => s.submitter_id)
        .filter((id): id is string => !!id),
    ),
  ];
  const emailMap = new Map<string, string>();
  if (submitterIds.length > 0) {
    const { data: users } = await adminClient.auth.admin.listUsers();
    (users?.users ?? [])
      .filter((u) => submitterIds.includes(u.id))
      .forEach((u) => emailMap.set(u.id, u.email ?? u.id));
  }

  // Photo preview URLs
  const photoPreviewUrls = new Map<string, string>();
  for (const s of submissions ?? []) {
    if (s.kind === "new_photo") {
      const storagePath = (s.proposed_data as Record<string, unknown>)
        ?.storage_path as string | undefined;
      if (storagePath) {
        const { data } = await adminClient.storage
          .from("venue-photos")
          .createSignedUrl(storagePath, 3600);
        if (data?.signedUrl) photoPreviewUrls.set(s.id, data.signedUrl);
      }
    }
  }

  // Fetch venue names for edit suggestions that reference a venue_id
  const venueIds = [
    ...new Set(
      (submissions ?? [])
        .filter((s: Submission) => s.kind === "edit_venue" && s.venue_id)
        .map((s: Submission) => s.venue_id as string),
    ),
  ];
  const venueMap = new Map<string, VenueRow>();
  if (venueIds.length > 0) {
    const { data: venues } = await adminClient
      .from("venues")
      .select("id,name")
      .in("id", venueIds);
    for (const v of venues ?? []) {
      venueMap.set(v.id, v as VenueRow);
    }
  }

  const rows = (submissions ?? []) as Submission[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Moderation queue</h1>
      <div className="mt-1 text-sm text-muted-foreground">
        Approving a new place sends it to the{" "}
        <a href="/admin/research/new-places" className="underline underline-offset-2">
          enrichment pipeline
        </a>{" "}
        — it won&apos;t publish directly.
      </div>

      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">
              Nothing pending — you&apos;re all caught up.
            </div>
          </Card>
        ) : (
          rows.map((s) => {
            const pd = s.proposed_data ?? {};

            // ── Edit suggestion (new lightweight format) ──────────────────────
            const isEditSuggestion = s.kind === "edit_venue" && typeof pd.edit_type === "string";
            if (isEditSuggestion) {
              const editType = pd.edit_type as string;
              const note = typeof pd.note === "string" ? pd.note : null;
              const contactEmail = typeof pd.contact_email === "string" ? pd.contact_email : null;
              const venue = s.venue_id ? venueMap.get(s.venue_id) : null;

              return (
                <Card key={s.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Kind + edit type + time */}
                      <div className="flex flex-wrap items-center gap-2">
                        <KindBadge kind={s.kind} />
                        <EditTypeBadge editType={editType} />
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(s.created_at)}
                        </span>
                      </div>

                      {/* Venue name link */}
                      {venue && (
                        <div className="mt-2">
                          <Link
                            href={`/admin/venues/${venue.id}`}
                            className="text-base font-semibold hover:underline underline-offset-2"
                          >
                            {venue.name}
                          </Link>
                        </div>
                      )}

                      {/* User note */}
                      {note && (
                        <p className="mt-2 text-sm text-foreground leading-relaxed">
                          &ldquo;{note}&rdquo;
                        </p>
                      )}

                      {/* Contact email + submitter */}
                      <div className="mt-2 grid gap-0.5 text-xs text-muted-foreground">
                        {contactEmail && (
                          <div>
                            <span>Contact: </span>
                            <a
                              href={`mailto:${contactEmail}`}
                              className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                            >
                              {contactEmail}
                            </a>
                          </div>
                        )}
                        <div>
                          {s.submitter_id && emailMap.get(s.submitter_id)
                            ? `Submitted by ${emailMap.get(s.submitter_id)}`
                            : "Anonymous submission"}
                        </div>
                      </div>
                    </div>

                    <SubmissionActions id={s.id} />
                  </div>
                </Card>
              );
            }

            // ── All other submission kinds (new_venue, new_photo, legacy edit) ─
            const name = typeof pd.name === "string" ? pd.name : null;
            const cityName = typeof pd.city_name === "string" ? pd.city_name : null;
            const venueType = typeof pd.venue_type === "string" ? pd.venue_type : null;
            const instagram = typeof pd.instagram_url === "string" ? pd.instagram_url : null;
            const website = typeof pd.website_url === "string" ? pd.website_url : null;
            const submitterEmail = s.submitter_id ? emailMap.get(s.submitter_id) : null;

            return (
              <Card key={s.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Kind + type + time */}
                    <div className="flex flex-wrap items-center gap-2">
                      <KindBadge kind={s.kind} />
                      {venueType && <VenueTypeLabel type={venueType} />}
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(s.created_at)}
                      </span>
                    </div>

                    {/* Place name + city */}
                    {name && (
                      <div className="mt-2 text-base font-semibold">
                        {name}
                        {cityName && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            in {cityName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Links */}
                    {(instagram || website) && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        {instagram && (
                          <a
                            href={instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                          >
                            Instagram ↗
                          </a>
                        )}
                        {website && (
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                          >
                            Website ↗
                          </a>
                        )}
                      </div>
                    )}

                    {/* Submitter */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {submitterEmail ? (
                        <>By {submitterEmail}</>
                      ) : (
                        <>Anonymous submission</>
                      )}
                    </div>

                    {/* Photo preview */}
                    {photoPreviewUrls.has(s.id) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreviewUrls.get(s.id)}
                        alt="Photo preview"
                        className="mt-3 max-h-48 w-auto rounded-xl object-cover"
                      />
                    )}
                  </div>

                  <SubmissionActions id={s.id} />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
