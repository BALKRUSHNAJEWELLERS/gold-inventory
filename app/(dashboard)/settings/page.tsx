import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, KeyRound, Building2, Users, IndianRupee, Shield } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || !hasAccess(session?.user?.role as string, "settings")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your store configuration and preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Branch Settings
            </CardTitle>
            <CardDescription>
              Configure your branch name, address, and contact info.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch Name</span>
                <span className="font-medium">Main Branch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">+91 98765 43210</span>
              </div>
            </div>
            <Button variant="outline">Edit Branch</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> User Management
            </CardTitle>
            <CardDescription>
              Add or edit staff accounts and assign roles (Owner, Manager, Sales, Accountant).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Manage user accounts, passwords, and role-based access control.
            </div>
            <Button variant="outline">Manage Users</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Security
            </CardTitle>
            <CardDescription>
              Change your password and configure session settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Password management, session timeouts, and two-factor authentication.
            </div>
            <Button variant="outline">Security Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" /> Pricing & Rates
            </CardTitle>
            <CardDescription>
              Set default gold rate, GST rates, and making charge defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">₹ INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default Gold Rate</span>
                <span className="font-medium">₹7,500/g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default GST</span>
                <span className="font-medium">3%</span>
              </div>
            </div>
            <Button variant="outline">Edit Rates</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Backup & Data
            </CardTitle>
            <CardDescription>
              Database backup, data export, and audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Schedule automatic backups and export data in CSV/Excel format.
            </div>
            <Button variant="outline">Backup Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> General Preferences
            </CardTitle>
            <CardDescription>
              Invoice format, print settings, and notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Customize invoice templates, thermal printer settings, and SMS notifications.
            </div>
            <Button variant="outline">Edit Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

