"use server";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PaymentMode } from "@prisma/client";

async function getDefaultBranchId() {
  const branch = await prisma.branch.findFirst();
  if (!branch) throw new Error("No branch found");
  return branch.id;
}

async function getDefaultUserId() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  return user.id;
}

export async function searchProducts(query: string) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "sales")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        inventory: { select: { quantity: true } },
      },
      take: 10,
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("searchProducts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search products",
    };
  }
}

export async function createSale(data: {
  customerId: string;
  paymentMode: PaymentMode;
  items: {
    productId: string;
    quantity: number;
    goldRate: number;
    netWeight: number;
    wastage: number;
    makingCharges: number;
    stoneCharges: number;
    gstAmount: number;
    totalPrice: number;
  }[];
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "sales")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const branchId = await getDefaultBranchId();
    const userId = await getDefaultUserId();

    const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const gstAmount = data.items.reduce((sum, item) => sum + item.gstAmount, 0);
    const netAmount = totalAmount;

    // Generate invoice number
    const count = await prisma.sale.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(6, "0")}`;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNumber,
          branchId,
          customerId: data.customerId,
          userId,
          totalAmount: totalAmount - gstAmount,
          gstAmount,
          netAmount,
          paymentMode: data.paymentMode,
          paymentStatus: "PAID",
          items: {
            create: data.items,
          },
        },
        include: { items: true },
      });

      // Decrement inventory
      for (const item of data.items) {
        await tx.inventory.updateMany({
          where: {
            productId: item.productId,
            branchId,
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return created;
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: sale };
  } catch (error) {
    console.error("createSale error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create sale",
    };
  }
}

export async function getSales() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "sales")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: { select: { name: true, mobile: true } },
        items: {
          include: {
            product: { select: { name: true, code: true } },
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: sales };
  } catch (error) {
    console.error("getSales error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sales",
    };
  }
}

