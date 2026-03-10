import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in with Google or Apple to suggest venues, upload photos, and
            write reviews.
          </p>
          <div className="mt-5">
            <Suspense
              fallback={
                <div className="grid gap-3">
                  <Button disabled>Continue with Google</Button>
                  <Button disabled variant="secondary">
                    Continue with Apple
                  </Button>
                </div>
              }
            >
              <OAuthButtons />
            </Suspense>
          </div>
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

