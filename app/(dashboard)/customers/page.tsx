import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/rbac";
import Client from "./Client";

export default async function CustomersPage() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "customers")) {
    redirect("/dashboard");
  }

  return <Client />;
}

