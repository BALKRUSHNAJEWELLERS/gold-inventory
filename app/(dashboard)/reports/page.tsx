import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getReportSummary } from "@/actions/report.actions";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Users,
  Wrench,
  Hammer,
  IndianRupee,
  Receipt,
} from "lucide-react";

export default async function ReportsPage() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "reports")) {
    redirect("/dashboard");
  }

  const result = await getReportSummary();

  const data = result.success && result.data
    ? result.data
    : {
        inventoryValue: 0,
        monthlySalesTotal: 0,
        monthlySalesCount: 0,
        monthlyPurchaseTotal: 0,
        monthlyPurchaseCount: 0,
        karigarOutstanding: 0,
        customerOutstanding: 0,
        activeRepairs: 0,
      };

  const formatINR = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const reports = [
    {
      title: "Inventory Valuation",
      description: "Current stock value across all branches",
      value: formatINR(data.inventoryValue),
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Monthly Sales",
      description: `${data.monthlySalesCount} invoices this month`,
      value: formatINR(data.monthlySalesTotal),
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      title: "Monthly Purchases",
      description: `${data.monthlyPurchaseCount} purchases this month`,
      value: formatINR(data.monthlyPurchaseTotal),
      icon: ShoppingCart,
      color: "text-amber-600",
    },
    {
      title: "Customer Outstanding",
      description: "Total receivables from customers",
      value: formatINR(data.customerOutstanding),
      icon: Users,
      color: "text-violet-600",
    },
    {
      title: "Karigar Outstanding",
      description: "Total payables to artisans",
      value: formatINR(data.karigarOutstanding),
      icon: Hammer,
      color: "text-rose-600",
    },
    {
      title: "Active Repairs",
      description: "Repairs awaiting completion",
      value: String(data.activeRepairs),
      icon: Wrench,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Business performance summary. All amounts in ₹ (INR).
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{report.title}</CardTitle>
                <report.icon className={`h-5 w-5 ${report.color}`} />
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <CardTitle>Profit Summary</CardTitle>
            </div>
            <CardDescription>Sales minus purchases this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sales Revenue</span>
                <span className="font-semibold text-emerald-600">{formatINR(data.monthlySalesTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Cost</span>
                <span className="font-semibold text-red-600">-{formatINR(data.monthlyPurchaseTotal)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold">Gross Profit</span>
                <span className="font-bold text-primary">
                  {formatINR(data.monthlySalesTotal - data.monthlyPurchaseTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-600" />
              <CardTitle>Outstanding Summary</CardTitle>
            </div>
            <CardDescription>Receivables and payables overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Receivables</span>
                <span className="font-semibold">{formatINR(data.customerOutstanding)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Karigar Payables</span>
                <span className="font-semibold">{formatINR(data.karigarOutstanding)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold">Net Position</span>
                <span className="font-bold text-primary">
                  {formatINR(data.customerOutstanding - data.karigarOutstanding)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

