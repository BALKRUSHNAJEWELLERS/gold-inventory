"use server";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Category } from "@prisma/client";

async function getDefaultBranchId() {
  const branch = await prisma.branch.findFirst();
  if (!branch) throw new Error("No branch found");
  return branch.id;
}

export async function getProducts() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "inventory")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: {
          select: {
            quantity: true,
            currentCost: true,
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = products.map((p) => ({
      ...p,
      totalStock: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("getProducts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

export async function addProduct(data: {
  code: string;
  barcode: string;
  name: string;
  category: Category;
  designNumber?: string;
  purity: string;
  grossWeight: number;
  netWeight: number;
  stoneWeight: number;
  makingCharge: number;
  wastagePercent: number;
  gstPercent: number;
  hsnCode?: string;
  purchasePrice: number;
  sellingPrice: number;
  initialQuantity?: number;
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "inventory")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const branchId = await getDefaultBranchId();

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          code: data.code,
          barcode: data.barcode,
          name: data.name,
          category: data.category,
          designNumber: data.designNumber,
          purity: data.purity,
          grossWeight: data.grossWeight,
          netWeight: data.netWeight,
          stoneWeight: data.stoneWeight,
          makingCharge: data.makingCharge,
          wastagePercent: data.wastagePercent,
          gstPercent: data.gstPercent,
          hsnCode: data.hsnCode,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
        },
      });

      await tx.inventory.create({
        data: {
          productId: created.id,
          branchId,
          quantity: data.initialQuantity ?? 1,
          currentCost: data.purchasePrice,
        },
      });

      return created;
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: product };
  } catch (error) {
    console.error("addProduct error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add product",
    };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    category?: Category;
    designNumber?: string;
    purity?: string;
    grossWeight?: number;
    netWeight?: number;
    stoneWeight?: number;
    makingCharge?: number;
    wastagePercent?: number;
    gstPercent?: number;
    hsnCode?: string;
    purchasePrice?: number;
    sellingPrice?: number;
  }
) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "inventory")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
    });

    revalidatePath("/inventory");
    return { success: true, data: product };
  } catch (error) {
    console.error("updateProduct error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "inventory")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("deleteProduct error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

