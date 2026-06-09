"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getRepairs, addRepair, updateRepairStatus, deleteRepair } from "@/actions/repair.actions";
import { getCustomers } from "@/actions/customer.actions";
import type { RepairStatus } from "@prisma/client";

const repairSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  productDesc: z.string().min(3, "Description is required."),
  estimatedCost: z.coerce.number().min(0).optional(),
});

type RepairFormData = z.infer<typeof repairSchema>;

type RepairRow = {
  id: string;
  repairNumber: string;
  productDesc: string;
  status: RepairStatus;
  estimatedCost: unknown;
  actualCost: unknown;
  receiveDate: string | Date;
  deliveryDate: string | Date | null;
  customer: { name: string; mobile: string };
};

type CustomerRow = { id: string; name: string; mobile: string };

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  RECEIVED: "secondary",
  ASSIGNED: "secondary",
  IN_PROGRESS: "default",
  READY: "default",
  DELIVERED: "outline",
};

const statusFlow: RepairStatus[] = ["RECEIVED", "ASSIGNED", "IN_PROGRESS", "READY", "DELIVERED"];

export default function RepairsClient() {
const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const form = useForm<RepairFormData>({
    resolver: zodResolver(repairSchema),
    defaultValues: { customerId: "", productDesc: "", estimatedCost: 0 },
  });

  const fetchData = async () => {
    const [repairRes, customerRes] = await Promise.all([getRepairs(), getCustomers()]);
    if (repairRes.success && repairRes.data) setRepairs(repairRes.data as unknown as RepairRow[]);
    if (customerRes.success && customerRes.data) setCustomers(customerRes.data as unknown as CustomerRow[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function onSubmit(values: RepairFormData) {
    setLoading(true);
    try {
      const result = await addRepair(values);
      if (result.success) {
        setOpen(false);
        form.reset();
        fetchData();
      } else {
        alert(result.error || "Failed to add repair");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, currentStatus: RepairStatus) {
    const currentIdx = statusFlow.indexOf(currentStatus);
    if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[currentIdx + 1];

    setUpdatingId(id);
    try {
      const result = await updateRepairStatus(id, nextStatus);
      if (result.success) fetchData();
      else alert(result.error || "Failed to update");
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this repair?")) return;
    setDeletingId(id);
    try {
      const result = await deleteRepair(id);
      if (result.success) fetchData();
      else alert(result.error || "Failed to delete");
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  }

  const formatINR = (v: unknown) => {
    const n = Number(v);
    return n ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";
  };

  const getNextStatusLabel = (status: RepairStatus): string | null => {
    const idx = statusFlow.indexOf(status);
    if (idx < 0 || idx >= statusFlow.length - 1) return null;
    return statusFlow[idx + 1].replace("_", " ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repairs</h2>
          <p className="text-muted-foreground">
            Manage customer jewelry repairs and workflow. All costs in ₹ (INR).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button className="gap-2"><Plus className="h-4 w-4" />New Repair Receipt</Button>}
          />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Repair</DialogTitle>
              <DialogDescription>
                Register a new jewelry repair. Costs are in ₹ (INR).
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <FormField<RepairFormData> control={form.control} name="customerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <select {...field} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                        <option value="">Select customer</option>
                        {customers.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField<RepairFormData> control={form.control} name="productDesc" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gold ring - resize and polish" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField<RepairFormData> control={form.control} name="estimatedCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); }}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Repair
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statusFlow.map((status) => {
          const count = repairs.filter((r) => r.status === status).length;
          return (
            <Card key={status} size="sm">
              <CardContent className="pt-3">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{status.replace("_", " ")}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repair Pipeline</CardTitle>
          <CardDescription>View repair statuses from Received to Delivered.</CardDescription>
        </CardHeader>
        <CardContent>
          {repairs.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              No active repairs. Click &quot;New Repair Receipt&quot; to add one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repair #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Est. Cost (₹)</TableHead>
                    <TableHead className="text-right">Actual (₹)</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((repair) => (
                    <TableRow key={repair.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{repair.repairNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>{repair.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{repair.customer.mobile}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{repair.productDesc}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[repair.status] || "outline"}>
                          {repair.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatINR(repair.estimatedCost)}</TableCell>
                      <TableCell className="text-right">{formatINR(repair.actualCost)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(repair.receiveDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {getNextStatusLabel(repair.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(repair.id, repair.status)}
                              disabled={updatingId === repair.id}
                            >
                              {updatingId === repair.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                `→ ${getNextStatusLabel(repair.status)}`
                              )}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(repair.id)} disabled={deletingId === repair.id}>
                            {deletingId === repair.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


