import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Container } from "@/components/ui/container";
import { UserNav } from "@/components/auth/user-nav";

export default async function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur">
        <Container className="flex h-20 items-end justify-between">
          <Link href="/" className="flex items-center pb-1">
            <Image
              src="/gay-places-logo.png"
              alt="Gay Places"
              width={260}
              height={56}
              style={{ height: 56, width: "auto" }}
              priority
            />
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

