import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/rbac";
import { ProductTable } from "@/features/inventory/components/ProductTable";
import { AddProductDialog } from "@/features/inventory/components/AddProductDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getProducts } from "@/actions/product.actions";

export default async function InventoryPage() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "inventory")) {
    redirect("/dashboard");
  }

  const result = await getProducts();
  const rawProducts = result.success && result.data ? result.data : [];

  // Serialize Prisma Decimal values to plain numbers for client components
  const products = rawProducts.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    purity: p.purity,
    netWeight: Number(p.netWeight),
    makingCharge: Number(p.makingCharge),
    sellingPrice: Number(p.sellingPrice),
    totalStock: p.totalStock,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage your jewelry products and stock levels.
          </p>
        </div>
        <AddProductDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            A list of all products in your inventory across branches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTable products={products} />
        </CardContent>
      </Card>
    </div>
  );
}

