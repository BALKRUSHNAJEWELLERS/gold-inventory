"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Search, ScanBarcode, Trash2, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchProducts, createSale } from "@/actions/sale.actions";
import { getCustomers } from "@/actions/customer.actions";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  code: string;
  netWeight: number;
  rate: number;
  makingCharges: number;
  gstAmount: number;
  total: number;
}

interface ProductResult {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  netWeight: unknown;
  makingCharge: unknown;
  inventory: { quantity: number }[];
}

interface CustomerResult {
  id: string;
  name: string;
  mobile: string;
}

export function POSInterface() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [customers, setCustomers] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [completing, setCompleting] = useState(false);

  const goldRateToday = 7500; // ₹ per gram

  useEffect(() => {
    getCustomers().then((res) => {
      if (res.success && res.data) setCustomers(res.data as unknown as CustomerResult[]);
    });
  }, []);

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const result = await searchProducts(query);
    if (result.success && result.data) {
      setSearchResults(result.data as unknown as ProductResult[]);
      setShowResults(true);
    }
  };

  const handleScan = async () => {
    if (!searchTerm || searchTerm.length < 2) return;
    const result = await searchProducts(searchTerm);
    if (result.success && result.data) {
      const products = result.data as unknown as ProductResult[];
      if (products.length === 1) {
        addToCart(products[0]);
      } else if (products.length > 1) {
        const exactMatch = products.find(p => 
          p.code.toLowerCase() === searchTerm.toLowerCase() || 
          p.barcode?.toLowerCase() === searchTerm.toLowerCase()
        );
        if (exactMatch) {
          addToCart(exactMatch);
        } else {
          setSearchResults(products);
          setShowResults(true);
        }
      } else {
        alert("Product not found");
      }
    }
  };

  const addToCart = (product: ProductResult) => {
    const weight = Number(product.netWeight);
    const making = Number(product.makingCharge);
    const subtotal = weight * goldRateToday + making;
    const gst = subtotal * 0.03;
    const total = subtotal + gst;

    const newItem: CartItem = {
      id: Math.random().toString(36),
      productId: product.id,
      name: product.name,
      code: product.code,
      netWeight: weight,
      rate: goldRateToday,
      makingCharges: making,
      gstAmount: gst,
      total,
    };

    setCart([...cart, newItem]);
    setSearchTerm("");
    setShowResults(false);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.total - item.gstAmount), 0);
  const gstAmount = cart.reduce((sum, item) => sum + item.gstAmount, 0);
  const grandTotal = subtotal + gstAmount;

  const formatINR = (v: number) =>
    `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const handleComplete = async () => {
    if (cart.length === 0) return;
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    setCompleting(true);
    try {
      const result = await createSale({
        customerId: selectedCustomer,
        paymentMode: "CASH",
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: 1,
          goldRate: item.rate,
          netWeight: item.netWeight,
          wastage: 0,
          makingCharges: item.makingCharges,
          stoneCharges: 0,
          gstAmount: item.gstAmount,
          totalPrice: item.total,
        })),
      });

      if (result.success) {
        alert(`Sale completed! Invoice: ${result.data?.invoiceNumber}`);
        setCart([]);
        setSelectedCustomer("");
      } else {
        alert(result.error || "Failed to create sale");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row gap-6 p-6">
      {/* Left Panel - Scanner & Products */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan Barcode or Search by Code/Name"
                className="pl-9 h-12 text-lg"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleScan();
                  }
                }}
              />
            </div>
            <Button size="lg" className="h-12 px-8 gap-2" onClick={handleScan}>
              <ScanBarcode className="h-5 w-5" />
              Scan
            </Button>
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b last:border-b-0 flex justify-between items-center"
                  onClick={() => addToCart(product)}
                >
                  <div>
                    <div className="font-medium">{product.code} — {product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Weight: {Number(product.netWeight).toFixed(3)}g | Making: {formatINR(Number(product.makingCharge))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stock: {product.inventory.reduce((s, i) => s + i.quantity, 0)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 border rounded-lg overflow-y-auto bg-background min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Item Details</TableHead>
                <TableHead className="text-right">Weight (g)</TableHead>
                <TableHead className="text-right">Rate/g (₹)</TableHead>
                <TableHead className="text-right">Making (₹)</TableHead>
                <TableHead className="text-right">Total (₹)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                    Search products to add them to the cart.
                  </TableCell>
                </TableRow>
              ) : (
                cart.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                    </TableCell>
                    <TableCell className="text-right">{item.netWeight.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{formatINR(item.rate)}</TableCell>
                    <TableCell className="text-right">{formatINR(item.makingCharges)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatINR(item.total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Panel - Billing Summary */}
      <div className="w-full lg:w-[400px]">
        <Card className="h-full flex flex-col shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4 border-b">
            <CardTitle>Invoice Summary</CardTitle>
            <div className="mt-2">
              <label className="text-xs text-muted-foreground mb-1 block">Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-6 overflow-y-auto min-h-0">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-medium">{cart.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gold Rate (Today)</span>
                <span className="font-medium">₹{goldRateToday.toLocaleString("en-IN")}/g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST (3%)</span>
                <span className="font-medium">{formatINR(gstAmount)}</span>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Grand Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-6 bg-muted/20 border-t">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" className="w-full">
                Hold Cart
              </Button>
              <Button variant="destructive" className="w-full" onClick={() => setCart([])}>
                Clear All
              </Button>
            </div>
            <Button
              size="lg"
              className="w-full text-lg h-14"
              disabled={cart.length === 0 || completing}
              onClick={handleComplete}
            >
              {completing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Complete Payment
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
