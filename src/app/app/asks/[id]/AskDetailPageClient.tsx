"use client";

import { useRouter } from "next/navigation";
import { AsksDetailClient } from "@/components/asks/AsksDetailClient";

export function AskDetailPageClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  return (
    <AsksDetailClient
      projectId={projectId}
      onDeleted={() => router.push("/app/asks")}
    />
  );
}
