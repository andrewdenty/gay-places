import type { PropsWithChildren } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)]">
      {/* Admin header */}
      <div className="sticky top-0 z-20 bg-[var(--background)]">
        <AdminHeader userEmail={user.email!} />
        <AdminTabs />
      </div>

      {/* Page content */}
      <main className="flex-1 py-8">
        <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6">{children}</div>
      </main>
    </div>
  );
}

