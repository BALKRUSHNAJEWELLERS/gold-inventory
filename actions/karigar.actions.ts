"use server";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { JobStatus } from "@prisma/client";

async function getDefaultBranchId() {
  const branch = await prisma.branch.findFirst();
  if (!branch) throw new Error("No branch found");
  return branch.id;
}

export async function getKarigars() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "karigar")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const karigars = await prisma.karigar.findMany({
      include: {
        _count: { select: { jobWorks: true } },
        jobWorks: {
          where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
          orderBy: { issueDate: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: karigars };
  } catch (error) {
    console.error("getKarigars error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch karigars",
    };
  }
}

export async function addKarigar(data: {
  name: string;
  mobile: string;
  address?: string;
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "karigar")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const karigar = await prisma.karigar.create({ data });
    revalidatePath("/karigar");
    return { success: true, data: karigar };
  } catch (error) {
    console.error("addKarigar error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add karigar",
    };
  }
}

export async function deleteKarigar(id: string) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "karigar")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const karigar = await prisma.karigar.findUnique({
      where: { id },
      include: { _count: { select: { jobWorks: true } } },
    });
    if (!karigar) return { success: false, error: "Karigar not found" };
    if (karigar._count.jobWorks > 0) {
      return { success: false, error: "Cannot delete karigar with existing job works" };
    }
    await prisma.karigar.delete({ where: { id } });
    revalidatePath("/karigar");
    return { success: true };
  } catch (error) {
    console.error("deleteKarigar error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete karigar",
    };
  }
}

export async function getJobWorks() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "karigar")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const jobWorks = await prisma.jobWork.findMany({
      include: {
        karigar: { select: { name: true, mobile: true } },
        branch: { select: { name: true } },
      },
      orderBy: { issueDate: "desc" },
    });

    return { success: true, data: jobWorks };
  } catch (error) {
    console.error("getJobWorks error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch job works",
    };
  }
}

export async function addJobWork(data: {
  karigarId: string;
  description: string;
  issueWeight: number;
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "karigar")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const branchId = await getDefaultBranchId();
    const count = await prisma.jobWork.count();
    const jobNumber = `JOB-${String(count + 1).padStart(5, "0")}`;

    const jobWork = await prisma.jobWork.create({
      data: {
        jobNumber,
        branchId,
        karigarId: data.karigarId,
        description: data.description,
        issueWeight: data.issueWeight,
      },
    });

    revalidatePath("/karigar");
    revalidatePath("/dashboard");
    return { success: true, data: jobWork };
  } catch (error) {
    console.error("addJobWork error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create job work",
    };
  }
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "karigar")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const updateData: Record<string, unknown> = { status };
    if (status === "COMPLETED" || status === "DELIVERED") {
      updateData.receiveDate = new Date();
    }

    const jobWork = await prisma.jobWork.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/karigar");
    revalidatePath("/dashboard");
    return { success: true, data: jobWork };
  } catch (error) {
    console.error("updateJobStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update job status",
    };
  }
}

