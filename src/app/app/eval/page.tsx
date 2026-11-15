import { redirect } from "next/navigation";
import { EvalClient } from "@/components/EvalClient";
import { getSessionAccess } from "@/lib/access";

export default async function EvalPage() {
  const access = await getSessionAccess();
  if (!access) redirect("/login");
  const canEval =
    access.capabilities.includes("dojo.company") ||
    access.capabilities.includes("roles.manage");
  if (!canEval) redirect("/app");

  return <EvalClient />;
}
