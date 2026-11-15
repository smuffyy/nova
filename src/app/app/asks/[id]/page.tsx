import { AskDetailPageClient } from "./AskDetailPageClient";

export default async function AskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AskDetailPageClient projectId={id} />;
}
