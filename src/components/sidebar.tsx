"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Home,
  Bell,
  Settings,
  LogOut,
  FileText,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/notification-bell";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Employees", href: "/dashboard/employees", icon: UserCog },
  { name: "Houses", href: "/dashboard/houses", icon: Home },
  { name: "Register", href: "/dashboard/register", icon: ClipboardList },
  { name: "QA Checklist", href: "/dashboard/qa-checklist", icon: ClipboardCheck },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

const adminNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-slate-50">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/mercy-link-logo.png"
              alt="Mercy Link"
              className="h-10 w-10 object-contain rounded-lg"
              onError={(e) => {
                // Fallback to text if logo not found
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">ML</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Mercy Link</h1>
              <p className="text-xs text-slate-500">245D Compliance</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {user.role === "ADMIN" && (
          <>
            <Separator className="my-4" />
            <nav className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <div className="mb-3 rounded-lg bg-white p-3 shadow-sm">
          <p className="text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
          <p className="mt-1 text-xs text-blue-600">{user.role.replace("_", " ")}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
