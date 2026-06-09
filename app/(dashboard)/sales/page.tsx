import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/rbac";
import { POSInterface } from "@/features/sales/components/POSInterface";

export default async function SalesPage() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "sales")) {
    redirect("/dashboard");
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
        <p className="text-muted-foreground">
          Create new invoices and process jewelry sales. All prices in ₹ (INR).
        </p>
      </div>

      <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden">
        <POSInterface />
      </div>
    </div>
  );
}

