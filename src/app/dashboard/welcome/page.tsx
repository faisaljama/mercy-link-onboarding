"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCog,
  Home,
  FileText,
  Calendar,
  ClipboardCheck,
  Shield,
  Bell,
  DollarSign,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Target,
  ListTodo,
  Flame,
  Pill,
} from "lucide-react";
import Link from "next/link";

interface UserSession {
  id: string;
  name: string;
  role: string;
}

// Feature cards by role
const ADMIN_FEATURES = [
  {
    icon: Users,
    title: "Client Management",
    description: "Add, edit, and manage all client records, face sheets, and service agreements",
    link: "/dashboard/clients",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: UserCog,
    title: "Employee Management",
    description: "Manage staff records, training compliance, and house assignments",
    link: "/dashboard/employees",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Home,
    title: "House Management",
    description: "Oversee all houses, utilities, calendars, and operational details",
    link: "/dashboard/houses",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: DollarSign,
    title: "Billing & Attendance",
    description: "Manage bi-weekly attendance reports, service agreements, and accounts receivable",
    link: "/dashboard/billing/attendance",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    icon: ListTodo,
    title: "Staff Tasks",
    description: "Create, assign, and track monthly tasks with approval workflows",
    link: "/dashboard/tasks",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    icon: Shield,
    title: "Compliance Tracking",
    description: "Monitor 245D compliance deadlines for clients and employees",
    link: "/dashboard",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
];

const DC_FEATURES = [
  {
    icon: ClipboardCheck,
    title: "DC Daily Checklists",
    description: "Complete daily remote oversight and onsite visit checklists",
    link: "/dashboard/dc-checklist",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: FileText,
    title: "Weekly Reports",
    description: "Submit weekly reports to your DM with house updates and concerns",
    link: "/dashboard/weekly-reports",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Calendar,
    title: "House Calendar",
    description: "Manage appointments and activities for your assigned houses",
    link: "/dashboard/calendar",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: Pill,
    title: "Genoa Deliveries",
    description: "Log and verify pharmacy medication deliveries",
    link: "/dashboard/genoa-deliveries",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    icon: Flame,
    title: "Fire Drills",
    description: "Record bi-monthly fire drill completion for each house",
    link: "/dashboard/fire-drills",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    icon: ListTodo,
    title: "My Tasks",
    description: "View and complete assigned monthly tasks",
    link: "/dashboard/tasks",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
];

const DSP_FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Daily Operations",
    description: "Complete daily shift reports and document client activities",
    link: "/dashboard/daily-operations",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: Calendar,
    title: "House Calendar",
    description: "View upcoming appointments and activities for your house",
    link: "/dashboard/calendar",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: Users,
    title: "Client Information",
    description: "Access client face sheets and important care information",
    link: "/dashboard/clients",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: BookOpen,
    title: "Resource Hub",
    description: "Access policies, forms, templates, and training materials",
    link: "/dashboard/resources",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Stay updated on deadlines and important reminders",
    link: "/dashboard/notifications",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    icon: ListTodo,
    title: "My Tasks",
    description: "View tasks assigned to you and your role",
    link: "/dashboard/tasks",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
];

function getFeaturesByRole(role: string) {
  switch (role) {
    case "ADMIN":
    case "DESIGNATED_MANAGER":
      return ADMIN_FEATURES;
    case "DESIGNATED_COORDINATOR":
      return DC_FEATURES;
    default:
      return DSP_FEATURES;
  }
}

function getRoleTitle(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "DESIGNATED_MANAGER":
      return "Designated Manager";
    case "DESIGNATED_COORDINATOR":
      return "Designated Coordinator";
    case "DSP":
      return "DSP";
    default:
      return "Team Member";
  }
}

export default function WelcomePage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session data
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setSession(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Please log in to continue.</div>
      </div>
    );
  }

  const features = getFeaturesByRole(session.role);
  const roleTitle = getRoleTitle(session.role);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 md:p-12 text-white">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
              <img
                src="/images/mercy-link-logo.png"
                alt="Mercy Link"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden h-16 w-16 items-center justify-center rounded-xl bg-blue-600">
                <span className="text-2xl font-bold text-white">ML</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mercy Link</h2>
              <p className="text-blue-200">245D Compliance Portal</p>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome, {session.name}!
          </h1>

          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-6">
            Your central hub for 245D compliance, client care, and daily operations.
            Everything you need to provide excellent care while staying compliant is right here.
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <Target className="h-5 w-5" />
              <span className="text-sm font-medium">Role: {roleTitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Purpose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            What is Mercy Link Portal?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Stay Compliant
              </div>
              <p className="text-sm text-slate-600">
                Track 245D compliance deadlines, training requirements, and documentation for all clients and employees automatically.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Streamline Operations
              </div>
              <p className="text-sm text-slate-600">
                Daily checklists, weekly reports, and task management keep everyone on the same page and nothing falls through the cracks.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-600 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Centralize Information
              </div>
              <p className="text-sm text-slate-600">
                Client records, house information, policies, forms, and resources all in one secure, accessible location.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Based Features */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          What You Can Do
        </h2>
        <p className="text-slate-500 mb-6">
          As a {roleTitle}, here are the key features available to you:
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.link}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${feature.bgColor}`}>
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Start */}
      <Card className="border-2 border-blue-100 bg-blue-50/50">
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Jump right into your most important tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button variant="default">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/notifications">
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Check Notifications
              </Button>
            </Link>
            <Link href="/dashboard/tasks">
              <Button variant="outline">
                <ListTodo className="h-4 w-4 mr-2" />
                View My Tasks
              </Button>
            </Link>
            <Link href="/dashboard/resources">
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Resources
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Go to Dashboard */}
      <div className="flex justify-center pt-4 pb-8">
        <Link href="/dashboard">
          <Button size="lg">
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
