"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getVisibleMenuItems, ROLE_DISPLAY_NAMES } from "@/lib/permissions";
import { UserRole } from "@/lib/auth";
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
  DollarSign,
  Receipt,
  Calendar,
  Eye,
  FileBarChart,
  BookOpen,
  Building2,
  ChevronRight,
  ChevronDown,
  UsersRound,
  Briefcase,
  Wallet,
  FolderOpen,
  ListTodo,
  Pill,
  Flame,
  Sparkles,
  History,
  Scale,
  UserCheck,
  CheckSquare,
  StickyNote,
  IdCard,
  FileSignature,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/notification-bell";

// Icon mapping from string name to component
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
  DollarSign,
  Receipt,
  Calendar,
  Eye,
  FileBarChart,
  BookOpen,
  Building2,
  UsersRound,
  Briefcase,
  Wallet,
  FolderOpen,
  ListTodo,
  Pill,
  Flame,
  Sparkles,
  History,
  Scale,
  UserCheck,
  CheckSquare,
  StickyNote,
  IdCard,
  FileSignature,
  MessageSquare,
  FileCheck,
};

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  // Get menu items based on user role
  const { topItems, groups, bottomItems, adminItems } = useMemo(
    () => getVisibleMenuItems(user.role as UserRole),
    [user.role]
  );

  // Load expanded state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded-groups");
    if (saved) {
      try {
        setExpandedGroups(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
    setInitialized(true);
  }, []);

  // Auto-expand groups that contain the active page
  useEffect(() => {
    if (!initialized) return;

    const newExpanded = { ...expandedGroups };
    let changed = false;

    groups.forEach((group) => {
      const hasActiveChild = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
      if (hasActiveChild && !newExpanded[group.name]) {
        newExpanded[group.name] = true;
        changed = true;
      }
    });

    if (changed) {
      setExpandedGroups(newExpanded);
      localStorage.setItem("sidebar-expanded-groups", JSON.stringify(newExpanded));
    }
  }, [pathname, initialized, groups]);

  // Save to localStorage when expanded state changes
  const toggleGroup = (groupName: string) => {
    const newExpanded = {
      ...expandedGroups,
      [groupName]: !expandedGroups[groupName],
    };
    setExpandedGroups(newExpanded);
    localStorage.setItem("sidebar-expanded-groups", JSON.stringify(newExpanded));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const isLinkActive = (href: string) => {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  };

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || FileText;
  };

  const renderNavLink = (item: { name: string; href: string; icon: string }, isChild = false) => {
    const isActive = isLinkActive(item.href);
    const Icon = getIcon(item.icon);
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isChild && "ml-4 pl-4",
          isActive
            ? "bg-blue-100 text-blue-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <Icon className={cn("h-5 w-5", isChild && "h-4 w-4")} />
        {item.name}
      </Link>
    );
  };

  const renderNavGroup = (group: { name: string; icon: string; items: { name: string; href: string; icon: string }[] }) => {
    const isExpanded = expandedGroups[group.name];
    const hasActiveChild = group.items.some((item) => isLinkActive(item.href));
    const Icon = getIcon(group.icon);

    return (
      <div key={group.name}>
        <button
          onClick={() => toggleGroup(group.name)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            hasActiveChild
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            {group.name}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {group.items.map((item) => renderNavLink(item, true))}
          </div>
        )}
      </div>
    );
  };

  // Get display name for role
  const roleDisplayName = ROLE_DISPLAY_NAMES[user.role as UserRole] || user.role.replace(/_/g, " ");

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
          {/* Top navigation items */}
          {topItems.map((item) => renderNavLink(item))}

          {/* Grouped navigation */}
          {groups.map((group) => renderNavGroup(group))}

          {/* Bottom navigation items */}
          {bottomItems.map((item) => renderNavLink(item))}
        </nav>

        {/* Admin section - only visible to ADMIN */}
        {adminItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <nav className="space-y-1">
              {adminItems.map((item) => renderNavLink(item))}
            </nav>
          </>
        )}

        {/* User section */}
        <Separator className="my-4" />
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{roleDisplayName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-600"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
