import type { PropsWithChildren } from "react";
import { ResearchTabs } from "@/components/admin/research-tabs";

export default function ResearchLayout({ children }: PropsWithChildren) {
  return (
    <div>
      <ResearchTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
