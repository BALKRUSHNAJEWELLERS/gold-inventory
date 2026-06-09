"use server";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { RepairStatus } from "@prisma/client";

async function getDefaultBranchId() {
  const branch = await prisma.branch.findFirst();
  if (!branch) throw new Error("No branch found");
  return branch.id;
}

export async function getRepairs() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "repairs")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const repairs = await prisma.repair.findMany({
      include: {
        customer: { select: { name: true, mobile: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: repairs };
  } catch (error) {
    console.error("getRepairs error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch repairs",
    };
  }
}

export async function addRepair(data: {
  customerId: string;
  productDesc: string;
  estimatedCost?: number;
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "repairs")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const branchId = await getDefaultBranchId();
    const count = await prisma.repair.count();
    const repairNumber = `REP-${String(count + 1).padStart(5, "0")}`;

    const repair = await prisma.repair.create({
      data: {
        repairNumber,
        branchId,
        customerId: data.customerId,
        productDesc: data.productDesc,
        estimatedCost: data.estimatedCost,
      },
    });

    revalidatePath("/repairs");
    revalidatePath("/dashboard");
    return { success: true, data: repair };
  } catch (error) {
    console.error("addRepair error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add repair",
    };
  }
}

export async function updateRepairStatus(id: string, status: RepairStatus, actualCost?: number) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "repairs")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const updateData: Record<string, unknown> = { status };
    if (status === "DELIVERED") {
      updateData.deliveryDate = new Date();
    }
    if (actualCost !== undefined) {
      updateData.actualCost = actualCost;
    }

    const repair = await prisma.repair.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/repairs");
    revalidatePath("/dashboard");
    return { success: true, data: repair };
  } catch (error) {
    console.error("updateRepairStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update repair status",
    };
  }
}

export async function deleteRepair(id: string) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "repairs")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    await prisma.repair.delete({ where: { id } });
    revalidatePath("/repairs");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("deleteRepair error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete repair",
    };
  }
}

