import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Video,
  Users,
  Heart,
  Shield,
  Briefcase,
  GraduationCap,
  Home,
} from "lucide-react";
import { ResourcesSection } from "./resources-section";
import { TutorialsSection } from "./tutorials-section";
import { TeamSection } from "./team-section";
import { WelcomeHeader } from "./welcome-header";

async function getResources() {
  const resources = await prisma.hubResource.findMany({
    where: { isActive: true },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
  });
  return resources;
}

async function getTutorials() {
  const tutorials = await prisma.hubTutorial.findMany({
    where: { isActive: true },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return tutorials;
}

async function getTeamAssignments(houseIds: string[]) {
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    include: {
      assignedUsers: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      employees: {
        where: {
          employee: { status: "ACTIVE" },
        },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, position: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return houses;
}

async function getWelcomeSettings() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: ["resourceHub.welcomeTitle", "resourceHub.welcomeDescription"],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return {
      title: settingsMap["resourceHub.welcomeTitle"] || "Welcome to the Resource Hub",
      description:
        settingsMap["resourceHub.welcomeDescription"] ||
        "Your central destination for 245D compliance resources, policies, forms, and training materials. Everything you need to provide excellent care while maintaining regulatory compliance is right here.",
    };
  } catch {
    // Return defaults if settings table doesn't exist yet
    return {
      title: "Welcome to the Resource Hub",
      description:
        "Your central destination for 245D compliance resources, policies, forms, and training materials. Everything you need to provide excellent care while maintaining regulatory compliance is right here.",
    };
  }
}

export default async function ResourceHubPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const [resources, tutorials, houses, welcomeSettings] = await Promise.all([
    getResources(),
    getTutorials(),
    getTeamAssignments(houseIds),
    getWelcomeSettings(),
  ]);

  const isAdmin = session.role === "ADMIN" || session.role === "DESIGNATED_COORDINATOR";

  // Group resources by category
  const resourcesByCategory = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  // Count stats by new department categories
  const totalHR = resourcesByCategory["HR"]?.length || 0;
  const totalOperations = resourcesByCategory["OPERATIONS"]?.length || 0;
  const totalCompliance = resourcesByCategory["COMPLIANCE"]?.length || 0;
  const totalTraining = resourcesByCategory["TRAINING"]?.length || 0;
  const totalClinical = resourcesByCategory["CLINICAL"]?.length || 0;
  const totalGeneral = resourcesByCategory["GENERAL"]?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeHeader
        title={welcomeSettings.title}
        description={welcomeSettings.description}
        totalDocuments={resources.length}
        totalCategories={Object.keys(resourcesByCategory).length}
        totalTutorials={tutorials.length}
        isAdmin={isAdmin}
      />

      {/* Department Quick Links */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">HR</p>
                <p className="text-xs text-slate-500">{totalHR} docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Home className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Operations</p>
                <p className="text-xs text-slate-500">{totalOperations} docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Compliance</p>
                <p className="text-xs text-slate-500">{totalCompliance} docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <GraduationCap className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Training</p>
                <p className="text-xs text-slate-500">{totalTraining} docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-pink-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100">
                <Heart className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Clinical</p>
                <p className="text-xs text-slate-500">{totalClinical} docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-slate-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Briefcase className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">General</p>
                <p className="text-xs text-slate-500">{totalGeneral} docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="resources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Tutorials
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6">
          <ResourcesSection
            resourcesByCategory={resourcesByCategory}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="tutorials" className="space-y-6">
          <TutorialsSection
            tutorials={tutorials}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamSection houses={houses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
