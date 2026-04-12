"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { FullPageModal } from "@/components/ui/full-page-modal";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { Button } from "@/components/ui/button";

export function SignInFlow() {
  const router = useRouter();

  return (
    <FullPageModal onClose={() => router.back()}>
      <div className="w-full">
        <h1
          className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
          }}
        >
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Create a free account to save your favourite spots, get credit for
          venues you suggest, write reviews, and build a profile the community
          can find.
        </p>
        <div className="mt-6">
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
            <span className="bg-[var(--background)] px-3 text-xs text-[var(--muted-foreground)]">
              or
            </span>
          </div>
        </div>

        <Suspense fallback={null}>
          <EmailSignInForm />
        </Suspense>
      </div>
    </FullPageModal>
  );
}
