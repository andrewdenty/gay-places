import { redirect } from "next/navigation";

export default async function AdminPublishDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/research/publish/${id}`);
}
