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
import {
  getPurchases,
  addPurchase,
  deletePurchase,
  getSuppliers,
  addSupplier,
} from "@/actions/purchase.actions";
import { getProducts } from "@/actions/product.actions";

const purchaseSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  supplierId: z.string().min(1, "Supplier is required."),
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().int().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().positive("Unit price must be positive."),
});

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  mobile: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;
type SupplierFormData = z.infer<typeof supplierSchema>;

type PurchaseRow = {
  id: string;
  invoiceNumber: string;
  totalAmount: unknown;
  createdAt: string | Date;
  supplier: { name: string };
  items: { id: string; quantity: number; unitPrice: unknown; totalPrice: unknown; product: { name: string; code: string } }[];
};

type SupplierRow = { id: string; name: string };
type ProductRow = { id: string; code: string; name: string };

export default function PurchasesClient() {
const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const purchaseForm = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      invoiceNumber: "",
      supplierId: "",
      productId: "",
      quantity: 1,
      unitPrice: 0,
    },
  });

  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", mobile: "", address: "", gstNumber: "" },
  });

  const fetchData = async () => {
    const [purchaseRes, supplierRes, productRes] = await Promise.all([
      getPurchases(),
      getSuppliers(),
      getProducts(),
    ]);
    if (purchaseRes.success && purchaseRes.data) setPurchases(purchaseRes.data as unknown as PurchaseRow[]);
    if (supplierRes.success && supplierRes.data) setSuppliers(supplierRes.data);
    if (productRes.success && productRes.data) setProducts(productRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function onPurchaseSubmit(values: PurchaseFormData) {
    setLoading(true);
    try {
      const result = await addPurchase({
        invoiceNumber: values.invoiceNumber,
        supplierId: values.supplierId,
        items: [
          {
            productId: values.productId,
            quantity: values.quantity,
            unitPrice: values.unitPrice,
          },
        ],
      });
      if (result.success) {
        setPurchaseOpen(false);
        purchaseForm.reset();
        fetchData();
      } else {
        alert(result.error || "Failed to add purchase");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function onSupplierSubmit(values: SupplierFormData) {
    setLoading(true);
    try {
      const result = await addSupplier(values);
      if (result.success) {
        setSupplierOpen(false);
        supplierForm.reset();
        fetchData();
      } else {
        alert(result.error || "Failed to add supplier");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase?")) return;
    setDeletingId(id);
    try {
      const result = await deletePurchase(id);
      if (result.success) fetchData();
      else alert(result.error || "Failed to delete");
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  }

  const formatINR = (v: unknown) =>
    `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchases</h2>
          <p className="text-muted-foreground">
            Manage inventory purchases and supplier bills.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Add Supplier Dialog */}
          <Dialog open={supplierOpen} onOpenChange={setSupplierOpen}>
            <DialogTrigger
              render={<Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Add Supplier</Button>}
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Supplier</DialogTitle>
                <DialogDescription>Add a new supplier to your directory.</DialogDescription>
              </DialogHeader>
              <Form {...supplierForm}>
                <form onSubmit={supplierForm.handleSubmit(onSupplierSubmit)} className="space-y-4 mt-2">
                  <FormField<SupplierFormData> control={supplierForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Supplier name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField<SupplierFormData> control={supplierForm.control} name="mobile" render={({ field }) => (
                    <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField<SupplierFormData> control={supplierForm.control} name="gstNumber" render={({ field }) => (
                    <FormItem><FormLabel>GST Number</FormLabel><FormControl><Input placeholder="GST number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setSupplierOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* New Purchase Dialog */}
          <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
            <DialogTrigger
              render={<Button className="gap-2"><Plus className="h-4 w-4" />New Purchase</Button>}
            />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Purchase</DialogTitle>
                <DialogDescription>Record a new purchase from a supplier. All amounts in ₹.</DialogDescription>
              </DialogHeader>
              <Form {...purchaseForm}>
                <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-4 mt-2">
                  <FormField<PurchaseFormData> control={purchaseForm.control} name="invoiceNumber" render={({ field }) => (
                    <FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input placeholder="INV-001" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField<PurchaseFormData> control={purchaseForm.control} name="supplierId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                          <option value="">Select supplier</option>
                          {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField<PurchaseFormData> control={purchaseForm.control} name="productId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                          <option value="">Select product</option>
                          {products.map((p) => (<option key={p.id} value={p.id}>{p.code} - {p.name}</option>))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField<PurchaseFormData> control={purchaseForm.control} name="quantity" render={({ field }) => (
                      <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField<PurchaseFormData> control={purchaseForm.control} name="unitPrice" render={({ field }) => (
                      <FormItem><FormLabel>Unit Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setPurchaseOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Purchase
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>A list of all recent purchases from your suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              No purchases found. Click &quot;New Purchase&quot; to add one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total (₹)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{purchase.invoiceNumber}</Badge>
                      </TableCell>
                      <TableCell>{purchase.supplier.name}</TableCell>
                      <TableCell>
                        {purchase.items.map((item) => (
                          <div key={item.id} className="text-xs">
                            {item.product.code} × {item.quantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatINR(purchase.totalAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(purchase.id)} disabled={deletingId === purchase.id}>
                          {deletingId === purchase.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
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


