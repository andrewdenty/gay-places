import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  kind: string;
  status: string;
  created_at: string;
  venue_id: string | null;
  city_id: string | null;
  proposed_data: Record<string, unknown>;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending review</Badge>;
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Container className="py-10 sm:py-14">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Please sign in.</div>
        </Card>
      </Container>
    );
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id,kind,status,created_at,venue_id,city_id,proposed_data")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (submissions ?? []) as Submission[];
  const spots = rows.filter((s) => s.kind === "new_venue");
  const otherSubmissions = rows.filter((s) => s.kind !== "new_venue");

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              Signed in as {user.email ?? user.id}
            </div>
          </div>
          <Link
            href="/suggest"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
          >
            Spot a place
          </Link>
        </div>

        {/* Places you've spotted */}
        <div className="mt-10">
          <h2 className="text-base font-semibold tracking-tight">
            Places you&rsquo;ve spotted
            {spots.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {spots.length}
              </span>
            )}
          </h2>

          {spots.length === 0 ? (
            <Card className="mt-3 p-6">
              <div className="text-sm font-medium">No spots yet</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Found a great queer bar, club, or sauna that&rsquo;s missing from the map?
              </div>
              <Link
                href="/suggest"
                className="mt-3 inline-block text-sm font-medium underline underline-offset-2"
              >
                Add your first spot →
              </Link>
            </Card>
          ) : (
            <div className="mt-3 grid gap-3">
              {spots.map((s) => {
                const pd = s.proposed_data ?? {};
                const name = typeof pd.name === "string" ? pd.name : "Untitled";
                const cityName = typeof pd.city_name === "string" ? pd.city_name : null;
                const venueType = typeof pd.venue_type === "string" ? pd.venue_type : null;

                const typeEmoji: Record<string, string> = {
                  bar: "🍸",
                  club: "🎉",
                  restaurant: "🍽️",
                  cafe: "☕",
                  sauna: "🧖",
                  other: "✨",
                };

                return (
                  <Card key={s.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {venueType && (
                          <span
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-lg"
                            aria-hidden
                          >
                            {typeEmoji[venueType] ?? "✨"}
                          </span>
                        )}
                        <div>
                          <div className="text-sm font-semibold">{name}</div>
                          {cityName && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {cityName}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Other activity (edits, photos, reviews) */}
        {otherSubmissions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-base font-semibold tracking-tight">Other activity</h2>
            <div className="mt-3 grid gap-3">
              {otherSubmissions.map((s) => (
                <Card key={s.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold capitalize">
                        {s.kind.replace(/_/g, " ")}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
