"use client";

import { signOut } from "next-auth/react";
import { LogOut, User, Bell } from "lucide-react";

export function Header({ user }: { user: any }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      <div className="flex items-center">
        {/* Placeholder for global search or breadcrumbs */}
        <span className="text-sm text-muted-foreground font-medium">Branch: Main Branch</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 border-l pl-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold leading-none">{user?.name || "Admin User"}</span>
            <span className="text-xs text-muted-foreground mt-1">{user?.role || "OWNER"}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            <User className="w-5 h-5" />
          </div>
          
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
