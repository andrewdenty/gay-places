import { Card } from "@/components/ui/card";

export default function AdminPublishPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Publish</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enrichment and publishing workflow — coming soon.
      </p>
      <Card className="mt-6 p-6">
        <p className="text-sm text-muted-foreground">
          After approving candidates, they will be enriched with additional
          details (descriptions, tags, opening hours, coordinates) and reviewed
          here before publishing to the site.
        </p>
      </Card>
    </div>
  );
}
