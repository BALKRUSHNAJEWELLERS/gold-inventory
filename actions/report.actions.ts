"use server";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function getReportSummary() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "reports")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      inventoryVal,
      monthlySales,
      monthlyPurchases,
      karigarOutstanding,
      customerOutstanding,
      totalRepairs,
    ] = await Promise.all([
      prisma.inventory.aggregate({ _sum: { currentCost: true } }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { netAmount: true },
        _count: true,
      }),
      prisma.purchase.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.karigar.aggregate({ _sum: { outstandingBalance: true } }),
      prisma.customer.aggregate({ _sum: { outstandingBalance: true } }),
      prisma.repair.count({
        where: { status: { in: ["RECEIVED", "ASSIGNED", "IN_PROGRESS", "READY"] } },
      }),
    ]);

    return {
      success: true,
      data: {
        inventoryValue: Number(inventoryVal._sum.currentCost ?? 0),
        monthlySalesTotal: Number(monthlySales._sum.netAmount ?? 0),
        monthlySalesCount: monthlySales._count ?? 0,
        monthlyPurchaseTotal: Number(monthlyPurchases._sum.totalAmount ?? 0),
        monthlyPurchaseCount: monthlyPurchases._count ?? 0,
        karigarOutstanding: Number(karigarOutstanding._sum.outstandingBalance ?? 0),
        customerOutstanding: Number(customerOutstanding._sum.outstandingBalance ?? 0),
        activeRepairs: totalRepairs,
      },
    };
  } catch (error) {
    console.error("getReportSummary error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch report summary",
    };
  }
}

