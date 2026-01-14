import { UserRole } from "./auth";

// Define which roles can access each route/feature
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin Only
  "/dashboard/settings": ["ADMIN"],
  "/dashboard/organization": ["ADMIN"],
  "/dashboard/audit-log": ["ADMIN"],

  // People Section
  "/dashboard/clients": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "FINANCE", "HR"],
  "/dashboard/employees": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR"],
  "/dashboard/discipline": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR"],
  "/dashboard/register": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"],

  // Houses
  "/dashboard/houses": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "FINANCE", "HR"],

  // Operations Section
  "/dashboard/daily-operations": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"],
  "/dashboard/notes-review": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
  "/dashboard/resident-prompts": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"],
  "/dashboard/dc-checklist": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"],
  "/dashboard/weekly-reports": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"],
  "/dashboard/qa-checklist": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"],
  "/dashboard/genoa-deliveries": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
  "/dashboard/medications": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"],
  "/dashboard/fire-drills": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"],
  "/dashboard/tasks": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"],
  "/dashboard/chores": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"],

  // Finance Section
  "/dashboard/billing": ["ADMIN", "FINANCE"],
  "/dashboard/billing/accounts-receivable": ["ADMIN", "FINANCE"],
  "/dashboard/billing/reconciliation": ["ADMIN", "FINANCE"],
  "/dashboard/billing/attendance": ["ADMIN", "FINANCE"],
  "/dashboard/billing/reports": ["ADMIN", "FINANCE"],
  "/dashboard/rent": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "FINANCE", "HR"],
  "/dashboard/expenses": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "FINANCE", "HR"],

  // Resources Section
  "/dashboard/resources": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"],
  "/dashboard/documents": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"],

  // DSP Portal - accessible by all except HR and FINANCE (who don't do direct care)
  "/dsp": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
  "/dsp/chores": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
  "/dsp/shift-notes": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
  "/dsp/notes": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
  "/dsp/residents": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
  "/dsp/documents": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],

  // General - accessible by all authenticated users
  "/dashboard": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"],
  "/dashboard/welcome": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE", "DSP"],
  "/dashboard/calendar": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"],
  "/dashboard/notifications": ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE", "DSP"],
};

// Sidebar menu configuration with role access
export interface MenuItem {
  name: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export interface MenuGroup {
  name: string;
  icon: string;
  items: MenuItem[];
  roles: UserRole[]; // Roles that can see this group at all
}

// Define sidebar structure
export const SIDEBAR_CONFIG: {
  topItems: MenuItem[];
  groups: MenuGroup[];
  bottomItems: MenuItem[];
  adminItems: MenuItem[];
} = {
  topItems: [
    {
      name: "Welcome",
      href: "/dashboard/welcome",
      icon: "Sparkles",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE", "DSP"],
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"],
    },
  ],

  groups: [
    {
      name: "People",
      icon: "Users",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "FINANCE"],
      items: [
        { name: "Clients", href: "/dashboard/clients", icon: "Users", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "FINANCE", "HR"] },
        { name: "Employees", href: "/dashboard/employees", icon: "UserCog", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR"] },
        { name: "Discipline", href: "/dashboard/discipline", icon: "Scale", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR"] },
        { name: "Register", href: "/dashboard/register", icon: "ClipboardCheck", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"] },
      ],
    },
    {
      name: "DSP Portal",
      icon: "Briefcase",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
      items: [
        { name: "My Dashboard", href: "/dsp", icon: "LayoutDashboard", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
        { name: "Chores", href: "/dsp/chores", icon: "CheckSquare", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
        { name: "Shift Notes", href: "/dsp/shift-notes", icon: "StickyNote", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
        { name: "Progress Notes", href: "/dsp/notes", icon: "FileText", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
        { name: "Residents", href: "/dsp/residents", icon: "IdCard", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
        { name: "DSP Documents", href: "/dsp/documents", icon: "FileSignature", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
      ],
    },
    {
      name: "Houses",
      icon: "Home",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "FINANCE", "HR"],
      items: [
        { name: "Houses", href: "/dashboard/houses", icon: "Home", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "FINANCE", "HR"] },
      ],
    },
    {
      name: "Operations",
      icon: "ClipboardList",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"],
      items: [
        { name: "Daily Operations", href: "/dashboard/daily-operations", icon: "ClipboardList", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"] },
        { name: "Notes Review", href: "/dashboard/notes-review", icon: "FileCheck", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
        { name: "ChatGPT Prompts", href: "/dashboard/resident-prompts", icon: "MessageSquare", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"] },
        { name: "DC Checklist", href: "/dashboard/dc-checklist", icon: "Eye", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"] },
        { name: "Weekly Reports", href: "/dashboard/weekly-reports", icon: "FileBarChart", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"] },
        { name: "QA Checklist", href: "/dashboard/qa-checklist", icon: "ClipboardCheck", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"] },
        { name: "Genoa Deliveries", href: "/dashboard/genoa-deliveries", icon: "Pill", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS", "DSP"] },
        { name: "Med Verification", href: "/dashboard/medications", icon: "Pill", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"] },
        { name: "Fire Drills", href: "/dashboard/fire-drills", icon: "Flame", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"] },
        { name: "Tasks", href: "/dashboard/tasks", icon: "ListTodo", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"] },
        { name: "Chore Management", href: "/dashboard/chores", icon: "CheckSquare", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"] },
      ],
    },
    {
      name: "Finance",
      icon: "Wallet",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "FINANCE", "HR"],
      items: [
        { name: "Billing", href: "/dashboard/billing", icon: "FileText", roles: ["ADMIN", "FINANCE"] },
        { name: "Accounts Receivable", href: "/dashboard/billing/accounts-receivable", icon: "DollarSign", roles: ["ADMIN", "FINANCE"] },
        { name: "Reconciliation", href: "/dashboard/billing/reconciliation", icon: "Receipt", roles: ["ADMIN", "FINANCE"] },
        { name: "Rent", href: "/dashboard/rent", icon: "DollarSign", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "FINANCE", "HR"] },
        { name: "Expenses", href: "/dashboard/expenses", icon: "Receipt", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "FINANCE", "HR"] },
      ],
    },
    {
      name: "Resources",
      icon: "BookOpen",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"],
      items: [
        { name: "Resource Hub", href: "/dashboard/resources", icon: "BookOpen", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"] },
        { name: "Documents", href: "/dashboard/documents", icon: "FileText", roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"] },
      ],
    },
  ],

  bottomItems: [
    {
      name: "Calendar",
      href: "/dashboard/calendar",
      icon: "Calendar",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE"],
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: "Bell",
      roles: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "HR", "OPERATIONS", "FINANCE", "DSP"],
    },
  ],

  adminItems: [
    { name: "Organization", href: "/dashboard/organization", icon: "Building2", roles: ["ADMIN"] },
    { name: "Audit Log", href: "/dashboard/audit-log", icon: "History", roles: ["ADMIN"] },
    { name: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["ADMIN"] },
  ],
};

// Helper function to check if a role can access a route
export function canAccessRoute(role: UserRole, route: string): boolean {
  // Check exact match first
  if (ROUTE_PERMISSIONS[route]) {
    return ROUTE_PERMISSIONS[route].includes(role);
  }

  // Check for parent route permissions (e.g., /dashboard/billing/123 should check /dashboard/billing)
  const segments = route.split("/");
  while (segments.length > 2) {
    segments.pop();
    const parentRoute = segments.join("/");
    if (ROUTE_PERMISSIONS[parentRoute]) {
      return ROUTE_PERMISSIONS[parentRoute].includes(role);
    }
  }

  // Default: allow access if no specific permission is defined
  return true;
}

// Helper function to get visible menu items for a role
export function getVisibleMenuItems(role: UserRole) {
  const topItems = SIDEBAR_CONFIG.topItems.filter((item) => item.roles.includes(role));

  const groups = SIDEBAR_CONFIG.groups
    .filter((group) => group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

  const bottomItems = SIDEBAR_CONFIG.bottomItems.filter((item) => item.roles.includes(role));
  const adminItems = SIDEBAR_CONFIG.adminItems.filter((item) => item.roles.includes(role));

  return { topItems, groups, bottomItems, adminItems };
}

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  ADMIN: "Administrator",
  DESIGNATED_MANAGER: "Designated Manager",
  DESIGNATED_COORDINATOR: "Designated Coordinator",
  HR: "HR",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  DSP: "DSP",
};
