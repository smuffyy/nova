import { redirect } from "next/navigation";
import { getSessionAccess } from "@/lib/access";

export default async function WorkspaceIndexPage() {
  const access = await getSessionAccess();
  if (!access) redirect("/login");

  const caps = access.capabilities;
  if (caps.includes("dojo.company")) redirect("/app/workspace/library");
  if (caps.includes("roles.manage")) redirect("/app/workspace/people");
  if (caps.includes("finance.money")) redirect("/app/workspace/money");
  redirect("/app");
}
