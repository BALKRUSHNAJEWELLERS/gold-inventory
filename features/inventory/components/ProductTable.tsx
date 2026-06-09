"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProduct } from "@/actions/product.actions";

interface ProductRow {
  id: string;
  code: string;
  name: string;
  category: string;
  purity: string;
  netWeight: number;
  makingCharge: number;
  sellingPrice: number;
  totalStock: number;
}

export function ProductTable({ products }: { products: ProductRow[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeletingId(id);
    try {
      const result = await deleteProduct(id);
      if (!result.success) {
        alert(result.error || "Failed to delete product");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const formatINR = (value: number) =>
    `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  if (products.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No products found. Click &quot;Add Product&quot; to create one.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Purity</TableHead>
            <TableHead className="text-right">Net Wt (g)</TableHead>
            <TableHead className="text-right">Making (₹)</TableHead>
            <TableHead className="text-right">Selling Price (₹)</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.code}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{product.category}</Badge>
              </TableCell>
              <TableCell>{product.purity}</TableCell>
              <TableCell className="text-right">
                {Number(product.netWeight).toFixed(3)}
              </TableCell>
              <TableCell className="text-right">
                {formatINR(product.makingCharge)}
              </TableCell>
              <TableCell className="text-right">
                {formatINR(product.sellingPrice)}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={product.totalStock > 5 ? "secondary" : "destructive"}
                >
                  {product.totalStock}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                >
                  {deletingId === product.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
