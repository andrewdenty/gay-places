import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "@/components/auth/sign-in-flow";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInFlow />
    </Suspense>
  );
}
