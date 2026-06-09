import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/rbac";
import Client from "./Client";

export default async function RepairsPage() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "repairs")) {
    redirect("/dashboard");
  }

  return <Client />;
}

