"use server";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getDefaultBranchId() {
  const branch = await prisma.branch.findFirst();
  if (!branch) throw new Error("No branch found");
  return branch.id;
}

export async function getPurchases() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "purchases")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: purchases };
  } catch (error) {
    console.error("getPurchases error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch purchases",
    };
  }
}

export async function getSuppliers() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "purchases")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: suppliers };
  } catch (error) {
    console.error("getSuppliers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch suppliers",
    };
  }
}

export async function addSupplier(data: {
  name: string;
  mobile?: string;
  address?: string;
  gstNumber?: string;
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "purchases")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const supplier = await prisma.supplier.create({ data });
    revalidatePath("/purchases");
    return { success: true, data: supplier };
  } catch (error) {
    console.error("addSupplier error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add supplier",
    };
  }
}

export async function addPurchase(data: {
  invoiceNumber: string;
  supplierId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "purchases")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const branchId = await getDefaultBranchId();
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          branchId,
          supplierId: data.supplierId,
          totalAmount,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      // Update inventory for each item
      for (const item of data.items) {
        await tx.inventory.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
            currentCost: item.unitPrice,
          },
          create: {
            productId: item.productId,
            branchId,
            quantity: item.quantity,
            currentCost: item.unitPrice,
          },
        });
      }

      return created;
    });

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: purchase };
  } catch (error) {
    console.error("addPurchase error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add purchase",
    };
  }
}

export async function deletePurchase(id: string) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "purchases")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await tx.purchase.delete({ where: { id } });
    });

    revalidatePath("/purchases");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("deletePurchase error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete purchase",
    };
  }
}

