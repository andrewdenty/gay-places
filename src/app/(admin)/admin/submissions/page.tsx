import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmissionActions } from "@/components/admin/submission-actions";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id,kind,status,created_at,submitter_id,venue_id,city_id,proposed_data")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Moderation queue</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        Pending submissions require approval before they go live.
      </div>

      <div className="mt-6 grid gap-3">
        {(submissions ?? []).length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">No pending items.</div>
          </Card>
        ) : (
          (submissions ?? []).map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {String(s.kind).replace("_", " ")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                  <pre className="mt-3 overflow-auto rounded-xl bg-muted p-3 text-xs">
{JSON.stringify(s.proposed_data, null, 2)}
                  </pre>
                </div>
                <SubmissionActions id={s.id} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

