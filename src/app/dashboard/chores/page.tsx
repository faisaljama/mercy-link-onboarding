import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Home, Camera } from "lucide-react";
import { ChoreManagement } from "./chore-management";

const ALLOWED_ROLES = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "OPERATIONS"];

const CATEGORY_LABELS: Record<string, string> = {
  room_checks: "Room Checks",
  common_areas: "Common Areas",
  kitchen_meals: "Kitchen & Meals",
  medication_area: "Medication Area",
  safety: "Safety",
  laundry: "Laundry",
  other: "Other",
};

interface SearchParams {
  house?: string;
}

async function getChoreData(houseIds: string[], filters: SearchParams) {
  const { house } = filters;

  const effectiveHouseIds = house && houseIds.includes(house) ? [house] : houseIds;

  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Get staff assigned to these houses
  const staff = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      assignedHouses: {
        some: { houseId: { in: houseIds } },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      assignedHouses: {
        select: { houseId: true },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const chores = await prisma.chore.findMany({
    where: {
      houseId: { in: effectiveHouseIds },
    },
    include: {
      house: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ house: { name: "asc" } }, { category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  // Stats
  const activeChores = chores.filter((c) => c.isActive);
  const inactiveChores = chores.filter((c) => !c.isActive);
  const photoRequiredCount = activeChores.filter((c) => c.requiresPhoto).length;

  // Group by category for display
  const choresByCategory = activeChores.reduce((acc, chore) => {
    if (!acc[chore.category]) acc[chore.category] = [];
    acc[chore.category].push(chore);
    return acc;
  }, {} as Record<string, typeof chores>);

  return {
    houses,
    staff,
    chores,
    activeChores,
    inactiveChores,
    choresByCategory,
    stats: {
      total: activeChores.length,
      inactive: inactiveChores.length,
      photoRequired: photoRequiredCount,
    },
  };
}

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!ALLOWED_ROLES.includes(session.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);

  const { houses, staff, chores, stats } = await getChoreData(houseIds, params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            Chore Management
          </h1>
          <p className="text-slate-500 mt-1">
            Create and manage chores for each house
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Chores</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Photo Required</p>
                <p className="text-2xl font-bold text-purple-600">{stats.photoRequired}</p>
              </div>
              <Camera className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Houses</p>
                <p className="text-2xl font-bold">{houses.length}</p>
              </div>
              <Home className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chore Management Component */}
      <ChoreManagement
        houses={houses}
        staff={staff}
        chores={chores}
        categoryLabels={CATEGORY_LABELS}
        currentHouseFilter={params.house}
      />
    </div>
  );
}
