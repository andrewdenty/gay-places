import type { PropsWithChildren } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <Container className="py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold tracking-tight">Admin</div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/submissions" className="font-medium hover:underline">
            Submissions
          </Link>
          <Link href="/admin/countries" className="font-medium hover:underline">
            Countries
          </Link>
          <Link href="/admin/cities" className="font-medium hover:underline">
            Cities
          </Link>
          <Link href="/admin/venues" className="font-medium hover:underline">
            Venues
          </Link>
          <Link href="/admin/analytics" className="font-medium hover:underline">
            Analytics
          </Link>
        </nav>
      </div>
      {children}
    </Container>
  );
}

