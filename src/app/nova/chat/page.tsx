import { Suspense } from "react";
import { NovaChat } from "@/components/nova/NovaChat";

export default function NovaChatPage() {
  return (
    <Suspense fallback={<div className="nova-page">Loading chat…</div>}>
      <NovaChat />
    </Suspense>
  );
}
