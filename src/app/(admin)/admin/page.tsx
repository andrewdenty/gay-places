import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Coming next: moderation queue, CRUD for cities/venues, and analytics.
        </p>
        <Card className="mt-6 p-6">
          <div className="grid gap-2 text-sm">
            <Link className="font-medium hover:underline" href="/admin/submissions">
              Moderation queue
            </Link>
            <Link className="font-medium hover:underline" href="/admin/countries">
              Countries
            </Link>
            <Link className="font-medium hover:underline" href="/admin/cities">
              Cities
            </Link>
            <Link className="font-medium hover:underline" href="/admin/venues">
              Venues
            </Link>
            <Link className="font-medium hover:underline" href="/admin/analytics">
              Analytics
            </Link>
          </div>
        </Card>
      </div>
    </Container>
  );
}

