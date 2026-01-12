import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Camera,
  ArrowLeft,
  Home,
} from "lucide-react";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { ShiftSelector } from "../shift-selector";
import { ChoreItem } from "./chore-item";

const CATEGORY_LABELS: Record<string, string> = {
  room_checks: "Room Checks",
  common_areas: "Common Areas",
  kitchen_meals: "Kitchen & Meals",
  medication_area: "Medication Area",
  safety: "Safety",
  laundry: "Laundry",
  other: "Other",
};

const CATEGORY_ORDER = [
  "room_checks",
  "common_areas",
  "kitchen_meals",
  "medication_area",
  "safety",
  "laundry",
  "other",
];

async function getChoresData(houseIds: string[], houseId: string | null, shiftDate: Date, shiftType: string) {
  const selectedDate = startOfDay(shiftDate);

  // Get houses user has access to
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true, eveningEndsMidnight: true },
    orderBy: { name: "asc" },
  });

  const selectedHouseId = houseId && houseIds.includes(houseId) ? houseId : houses[0]?.id;

  if (!selectedHouseId) {
    return { houses: [], selectedHouse: null, choresByCategory: {} as Record<string, Array<{
      id: string;
      name: string;
      description: string | null;
      requiresPhoto: boolean;
      isRequired: boolean;
      completion: {
        completedAt: Date;
        completedBy: { firstName: string; lastName: string };
        photoUrls: string;
        notes: string | null;
      } | null;
    }>> };
  }

  const selectedHouse = houses.find(h => h.id === selectedHouseId);

  // Get chores for this house
  const allChores = await prisma.chore.findMany({
    where: {
      houseId: selectedHouseId,
      isActive: true,
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  // Filter chores for the selected shift
  const shiftChores = allChores.filter((chore) => {
    try {
      const shifts = JSON.parse(chore.shifts);
      return shifts.includes(shiftType);
    } catch {
      return false;
    }
  });

  // Get completed chores for this date and shift
  const completions = await prisma.choreCompletion.findMany({
    where: {
      houseId: selectedHouseId,
      shiftDate: selectedDate,
      shiftType: shiftType,
    },
    include: {
      completedBy: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  const completionsByChoreId = new Map(completions.map(c => [c.choreId, c]));

  // Group chores by category
  const choresByCategory: Record<string, Array<{
    id: string;
    name: string;
    description: string | null;
    requiresPhoto: boolean;
    isRequired: boolean;
    completion: {
      completedAt: Date;
      completedBy: { firstName: string; lastName: string };
      photoUrls: string;
      notes: string | null;
    } | null;
  }>> = {};

  for (const chore of shiftChores) {
    const completion = completionsByChoreId.get(chore.id);
    const choreData = {
      id: chore.id,
      name: chore.name,
      description: chore.description,
      requiresPhoto: chore.requiresPhoto,
      isRequired: chore.isRequired,
      completion: completion ? {
        completedAt: completion.completedAt,
        completedBy: completion.completedBy,
        photoUrls: completion.photoUrls,
        notes: completion.notes,
      } : null,
    };

    if (!choresByCategory[chore.category]) {
      choresByCategory[chore.category] = [];
    }
    choresByCategory[chore.category].push(choreData);
  }

  return { houses, selectedHouse, choresByCategory };
}

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; date?: string; shift?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);

  // Determine current shift based on time
  const now = new Date();
  const hour = now.getHours();
  let defaultShift = "day";
  if (hour >= 16 || hour < 8) {
    defaultShift = hour >= 23 || hour < 8 ? "overnight" : "evening";
  }

  const shiftDate = params.date ? new Date(params.date) : new Date();
  const shiftType = params.shift || defaultShift;

  const { houses, selectedHouse, choresByCategory } = await getChoresData(
    houseIds,
    params.house || null,
    shiftDate,
    shiftType
  );

  if (houses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Home className="h-12 w-12 mb-4 text-slate-300" />
        <p className="text-lg font-medium">No houses assigned</p>
        <p className="text-sm">Contact your supervisor to get assigned to a house.</p>
      </div>
    );
  }

  // Calculate totals
  const allChores = Object.values(choresByCategory).flat();
  const completedCount = allChores.filter(c => c.completion).length;
  const totalCount = allChores.length;

  const shiftTimes = {
    day: "8:00 AM - 4:00 PM",
    evening: selectedHouse?.eveningEndsMidnight ? "4:00 PM - 12:00 AM" : "4:00 PM - 11:00 PM",
    overnight: selectedHouse?.eveningEndsMidnight ? "12:00 AM - 8:00 AM" : "11:00 PM - 8:00 AM",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dsp">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shift Chores</h1>
          <p className="text-slate-500 mt-1">
            {format(shiftDate, "EEEE, MMMM d, yyyy")} • {shiftType.charAt(0).toUpperCase() + shiftType.slice(1)} Shift ({shiftTimes[shiftType as keyof typeof shiftTimes]})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={completedCount === totalCount ? "default" : "secondary"} className="text-lg px-4 py-1">
            {completedCount} / {totalCount} Complete
          </Badge>
        </div>
      </div>

      {/* Shift Selector */}
      <ShiftSelector
        houses={houses}
        selectedHouseId={selectedHouse?.id || ""}
        selectedDate={format(shiftDate, "yyyy-MM-dd")}
        selectedShift={shiftType}
      />

      {/* Progress Bar */}
      <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-green-500 h-full transition-all duration-300"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Chores by Category */}
      {CATEGORY_ORDER.filter(cat => choresByCategory[cat]?.length).map((category) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {CATEGORY_LABELS[category] || category}
              <Badge variant="outline" className="ml-2">
                {choresByCategory[category].filter(c => c.completion).length} / {choresByCategory[category].length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {choresByCategory[category].map((chore) => (
                <ChoreItem
                  key={chore.id}
                  chore={chore}
                  houseId={selectedHouse?.id || ""}
                  shiftDate={format(shiftDate, "yyyy-MM-dd")}
                  shiftType={shiftType}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {Object.keys(choresByCategory).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <p className="text-lg font-medium">No chores configured for this shift</p>
            <p className="text-sm mt-2">Contact your supervisor to set up the chore checklist.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
