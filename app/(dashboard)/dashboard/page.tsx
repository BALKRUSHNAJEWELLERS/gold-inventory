import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard.actions";
import {
  Package,
  IndianRupee,
  TrendingUp,
  Users,
  Wrench,
  Hammer,
} from "lucide-react";

export default async function DashboardPage() {
  const result = await getDashboardStats();

  const stats = result.success && result.data
    ? result.data
    : {
        totalProducts: 0,
        totalInventoryValue: 0,
        todaySales: { count: 0, total: 0 },
        totalCustomers: 0,
        pendingRepairs: 0,
        activeJobs: 0,
      };

  const formatINR = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const cards = [
    {
      title: "Total Products",
      value: String(stats.totalProducts),
      subtitle: "Items in catalog",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Inventory Value",
      value: formatINR(stats.totalInventoryValue),
      subtitle: "Current stock valuation",
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Today's Sales",
      value: formatINR(stats.todaySales.total),
      subtitle: `${stats.todaySales.count} invoice(s) today`,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Total Customers",
      value: String(stats.totalCustomers),
      subtitle: "Registered customers",
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "Pending Repairs",
      value: String(stats.pendingRepairs),
      subtitle: "Awaiting completion",
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Active Jobs",
      value: String(stats.activeJobs),
      subtitle: "Karigar jobs in progress",
      icon: Hammer,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your jewelry business today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
