import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Container } from "@/components/ui/container";
import { UserNav } from "@/components/auth/user-nav";

export default async function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur">
        <Container className="flex h-14 items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Gay Places
          </Link>
          <nav className="flex items-center gap-3">
            <UserNav />
          </nav>
        </Container>
      </header>
      <main>{children}</main>
    </div>
  );
}

