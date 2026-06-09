"use server";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "dashboard")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalProducts,
      inventoryAgg,
      todaySalesData,
      totalCustomers,
      pendingRepairs,
      activeJobs,
    ] = await Promise.all([
      // Total products
      prisma.product.count(),

      // Total inventory value: sum(quantity * currentCost) across all inventory
      prisma.inventory.findMany({
        select: { quantity: true, currentCost: true },
      }),

      // Today's sales count and total
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _count: { id: true },
        _sum: { netAmount: true },
      }),

      // Total customers
      prisma.customer.count(),

      // Pending repairs (not DELIVERED)
      prisma.repair.count({
        where: {
          status: { not: "DELIVERED" },
        },
      }),

      // Active job works (not COMPLETED or DELIVERED)
      prisma.jobWork.count({
        where: {
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
      }),
    ]);

    // Calculate total inventory value
    const totalInventoryValue = inventoryAgg.reduce(
      (sum: number, inv: any) => sum + inv.quantity * Number(inv.currentCost),
      0
    );

    const stats = {
      totalProducts,
      totalInventoryValue,
      todaySales: {
        count: todaySalesData._count.id,
        total: Number(todaySalesData._sum.netAmount ?? 0),
      },
      totalCustomers,
      pendingRepairs,
      activeJobs,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard stats",
    };
  }
}

