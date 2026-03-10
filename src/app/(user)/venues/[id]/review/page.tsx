import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitReview } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("id,name")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (!venue) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Write a review</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Review for <span className="font-medium text-foreground">{venue.name}</span>.{" "}
          Your review will be moderated before it appears publicly.
        </p>

        <Card className="mt-6 p-6">
          <form action={submitReview} className="grid gap-4">
            <input type="hidden" name="venue_id" value={venue.id} />

            <div className="grid gap-2">
              <label className="text-sm font-medium">Rating</label>
              <select
                name="rating"
                defaultValue="5"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="5">5 — Amazing</option>
                <option value="4">4 — Great</option>
                <option value="3">3 — OK</option>
                <option value="2">2 — Not great</option>
                <option value="1">1 — Avoid</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Review</label>
              <textarea
                name="body"
                rows={5}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full sm:w-auto">
                Submit for moderation
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}

