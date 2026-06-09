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

export async function getCustomers() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "customers")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const customers = await prisma.customer.findMany({
      include: {
        branch: { select: { name: true } },
        _count: { select: { sales: true, repairs: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: customers };
  } catch (error) {
    console.error("getCustomers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch customers",
    };
  }
}

export async function addCustomer(data: {
  name: string;
  mobile: string;
  address?: string;
  panNumber?: string;
  gstNumber?: string;
}) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "customers")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const branchId = await getDefaultBranchId();

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        address: data.address,
        panNumber: data.panNumber,
        gstNumber: data.gstNumber,
        branchId,
      },
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true, data: customer };
  } catch (error) {
    console.error("addCustomer error:", error);

    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A customer with this mobile number already exists"
        : error instanceof Error
          ? error.message
          : "Failed to add customer";

    return { success: false, error: message };
  }
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    mobile?: string;
    address?: string;
    panNumber?: string;
    gstNumber?: string;
  }
) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "customers")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    revalidatePath("/customers");
    return { success: true, data: customer };
  } catch (error) {
    console.error("updateCustomer error:", error);

    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A customer with this mobile number already exists"
        : error instanceof Error
          ? error.message
          : "Failed to update customer";

    return { success: false, error: message };
  }
}

export async function deleteCustomer(id: string) {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "customers")) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    // Check for existing sales or repairs
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { sales: true, repairs: true } },
      },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    if (customer._count.sales > 0 || customer._count.repairs > 0) {
      return {
        success: false,
        error:
          "Cannot delete customer with existing sales or repairs. Remove those records first.",
      };
    }

    await prisma.customer.delete({ where: { id } });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("deleteCustomer error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete customer",
    };
  }
}

