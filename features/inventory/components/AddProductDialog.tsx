"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { addProduct } from "@/actions/product.actions";

const productSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  category: z.enum(["GOLD", "SILVER", "DIAMOND", "PLATINUM", "GEMSTONE"]),
  purity: z.string().min(1, "Purity is required."),
  grossWeight: z.coerce.number().positive("Gross weight must be positive."),
  netWeight: z.coerce.number().positive("Net weight must be positive."),
  stoneWeight: z.coerce.number().min(0, "Stone weight cannot be negative."),
  makingCharge: z.coerce.number().min(0, "Making charge cannot be negative."),
  wastagePercent: z.coerce.number().min(0).max(100, "Must be 0-100"),
  gstPercent: z.coerce.number().min(0).max(100).default(3),
  purchasePrice: z.coerce.number().positive("Purchase price must be positive."),
  sellingPrice: z.coerce.number().positive("Selling price must be positive."),
});

type ProductFormData = z.infer<typeof productSchema>;

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "GOLD",
      purity: "22K",
      grossWeight: 0,
      netWeight: 0,
      stoneWeight: 0,
      makingCharge: 0,
      wastagePercent: 0,
      gstPercent: 3,
      purchasePrice: 0,
      sellingPrice: 0,
    },
  });

  async function onSubmit(values: ProductFormData) {
    setLoading(true);
    try {
      const barcode = `BC-${values.code}-${Date.now()}`;
      const result = await addProduct({
        ...values,
        barcode,
      });
      if (result.success) {
        setOpen(false);
        form.reset();
      } else {
        alert(result.error || "Failed to add product");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details of the new jewelry product. All prices are in ₹ (INR).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Row 1: Code + Name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField<ProductFormData>
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="G-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<ProductFormData>
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Gold Necklace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Category + Purity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField<ProductFormData>
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="GOLD">Gold</option>
                        <option value="SILVER">Silver</option>
                        <option value="DIAMOND">Diamond</option>
                        <option value="PLATINUM">Platinum</option>
                        <option value="GEMSTONE">Gemstone</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<ProductFormData>
                control={form.control}
                name="purity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purity</FormLabel>
                    <FormControl>
                      <Input placeholder="22K" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Gross Weight + Net Weight + Stone Weight */}
            <div className="grid grid-cols-3 gap-4">
              <FormField<ProductFormData>
                control={form.control}
                name="grossWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Wt (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<ProductFormData>
                control={form.control}
                name="netWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Wt (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<ProductFormData>
                control={form.control}
                name="stoneWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stone Wt (g)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Making Charge + Wastage + GST */}
            <div className="grid grid-cols-3 gap-4">
              <FormField<ProductFormData>
                control={form.control}
                name="makingCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Making (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<ProductFormData>
                control={form.control}
                name="wastagePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wastage %</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<ProductFormData>
                control={form.control}
                name="gstPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST %</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Purchase Price + Selling Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField<ProductFormData>
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<ProductFormData>
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Product
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
