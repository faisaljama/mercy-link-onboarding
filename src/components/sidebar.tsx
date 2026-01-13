"use client";

import { useState, useEffect } from "react";
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
  Mic,
  MessageSquare,
  FileCheck,
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

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

// Direct navigation items (not grouped)
const directNavigation: NavItem[] = [
  { name: "Welcome", href: "/dashboard/welcome", icon: Sparkles },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

// Grouped navigation
const groupedNavigation: NavGroup[] = [
  {
    name: "People",
    icon: UsersRound,
    items: [
      { name: "Clients", href: "/dashboard/clients", icon: Users },
      { name: "Employees", href: "/dashboard/employees", icon: UserCog },
      { name: "Discipline", href: "/dashboard/discipline", icon: Scale },
      { name: "Register", href: "/dashboard/register", icon: ClipboardCheck },
    ],
  },
  {
    name: "DSP Portal",
    icon: UserCheck,
    items: [
      { name: "My Dashboard", href: "/dsp", icon: LayoutDashboard },
      { name: "Chores", href: "/dsp/chores", icon: CheckSquare },
      { name: "Shift Notes", href: "/dsp/shift-notes", icon: StickyNote },
      { name: "Resident Profiles", href: "/dsp/residents", icon: IdCard },
      { name: "Documents", href: "/dsp/documents", icon: FileSignature },
    ],
  },
];

// Houses as direct link
const housesNav: NavItem = { name: "Houses", href: "/dashboard/houses", icon: Home };

// More grouped navigation
const moreGroupedNavigation: NavGroup[] = [
  {
    name: "Operations",
    icon: Briefcase,
    items: [
      { name: "Daily Operations", href: "/dashboard/daily-operations", icon: ClipboardList },
      { name: "Notes Review", href: "/dashboard/notes-review", icon: FileCheck },
      { name: "ChatGPT Prompts", href: "/dashboard/resident-prompts", icon: MessageSquare },
      { name: "DC Checklist", href: "/dashboard/dc-checklist", icon: Eye },
      { name: "Weekly Reports", href: "/dashboard/weekly-reports", icon: FileBarChart },
      { name: "QA Checklist", href: "/dashboard/qa-checklist", icon: ClipboardCheck },
      { name: "Genoa Deliveries", href: "/dashboard/genoa-deliveries", icon: Pill },
      { name: "Med Verification", href: "/dashboard/medications", icon: Pill },
      { name: "Fire Drills", href: "/dashboard/fire-drills", icon: Flame },
      { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
    ],
  },
  {
    name: "Finance",
    icon: Wallet,
    items: [
      { name: "Billing", href: "/dashboard/billing", icon: FileText },
      { name: "Rent", href: "/dashboard/rent", icon: DollarSign },
      { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    ],
  },
  {
    name: "Resources",
    icon: FolderOpen,
    items: [
      { name: "Resource Hub", href: "/dashboard/resources", icon: BookOpen },
      { name: "Documents", href: "/dashboard/documents", icon: FileText },
    ],
  },
];

// Calendar and Notifications as direct links
const bottomDirectNavigation: NavItem[] = [
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

const adminNavigation: NavItem[] = [
  { name: "Organization", href: "/dashboard/organization", icon: Building2 },
  { name: "Audit Log", href: "/dashboard/audit-log", icon: History },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

// Combine all groups for state management
const allGroups = [...groupedNavigation, ...moreGroupedNavigation];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);

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

    allGroups.forEach((group) => {
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
  }, [pathname, initialized]);

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

  const renderNavLink = (item: NavItem, isChild = false) => {
    const isActive = isLinkActive(item.href);
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
        <item.icon className={cn("h-5 w-5", isChild && "h-4 w-4")} />
        {item.name}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups[group.name];
    const hasActiveChild = group.items.some((item) => isLinkActive(item.href));

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
            <group.icon className="h-5 w-5" />
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
          {/* Dashboard - direct link */}
          {directNavigation.map((item) => renderNavLink(item))}

          {/* People group */}
          {groupedNavigation.map((group) => renderNavGroup(group))}

          {/* Houses - direct link */}
          {renderNavLink(housesNav)}

          {/* Operations, Finance, Resources groups */}
          {moreGroupedNavigation.map((group) => renderNavGroup(group))}

          {/* Calendar, Notifications - direct links */}
          {bottomDirectNavigation.map((item) => renderNavLink(item))}
        </nav>

        {user.role === "ADMIN" && (
          <>
            <Separator className="my-4" />
            <nav className="space-y-1">
              {adminNavigation.map((item) => renderNavLink(item))}
            </nav>
          </>
        )}

        {/* User section */}
        <Separator className="my-4" />
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.role.replace("_", " ")}</p>
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
