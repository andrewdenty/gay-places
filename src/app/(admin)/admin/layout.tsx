import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { ToastProvider } from "@/components/ui/toast";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: PropsWithChildren) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");

  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-[var(--background)]">
        {/* Admin header */}
        <div className="sticky top-0 z-20 bg-[var(--background)]">
          <AdminHeader userEmail={user.email!} />
          <div className="pt-4">
            <AdminTabs />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-8">
          <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}

