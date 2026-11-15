import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSessionAccess } from "@/lib/access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getSessionAccess();
  if (!access) redirect("/login");

  const caps = access.capabilities;
  const canWorkspace =
    caps.includes("dojo.company") ||
    caps.includes("roles.manage") ||
    caps.includes("finance.money");

  return (
    <AppShell
      workspaceName={access.workspace.name}
      userName={access.user.name}
      canWorkspace={canWorkspace}
    >
      {children}
    </AppShell>
  );
}
