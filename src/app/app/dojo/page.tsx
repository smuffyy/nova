import { redirect } from "next/navigation";
import { getSessionAccess } from "@/lib/access";

export default async function DojoRedirectPage() {
  const access = await getSessionAccess();
  if (!access) redirect("/login");
  if (access.capabilities.includes("dojo.company")) {
    redirect("/app/workspace/library");
  }
  redirect("/app/files");
}
