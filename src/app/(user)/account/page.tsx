import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
          <Link href="/suggest" className="text-sm font-medium">
            Suggest a venue
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {(submissions ?? []).length === 0 ? (
            <Card className="p-6">
              <div className="text-sm font-semibold">No submissions yet</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Your suggestions, edits, photos and reviews will appear here.
              </div>
            </Card>
          ) : (
            (submissions ?? []).map((s) => (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      {String(s.kind).replace("_", " ")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{s.status}</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}

