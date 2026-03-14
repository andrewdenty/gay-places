import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in to suggest venues, upload photos, and write reviews.
          </p>
          <div className="mt-5">
            <Suspense
              fallback={
                <div className="grid gap-3">
                  <Button disabled>Continue with Google</Button>
                </div>
              }
            >
              <OAuthButtons />
            </Suspense>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--card)] px-3 text-xs text-[var(--muted-foreground)]">
                or
              </span>
            </div>
          </div>

          {/* Email + password form */}
          <Suspense fallback={null}>
            <EmailSignInForm />
          </Suspense>

          <div className="mt-5 text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-foreground">
              Back to cities
            </Link>
          </div>
        </Card>
      </div>
    </Container>
  );
}

