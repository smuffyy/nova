import { Suspense } from "react";
import { ChatClient } from "@/components/ChatClient";

export default function AppHomePage() {
  return (
    <Suspense fallback={<div className="text-[var(--muted)]">Loading chat…</div>}>
      <ChatClient />
    </Suspense>
  );
}
