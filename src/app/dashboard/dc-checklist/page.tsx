import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Calendar,
  Home,
  CheckCircle2,
  AlertCircle,
  Eye,
  MapPin,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { NewChecklistDialog } from "./new-checklist-dialog";
import { ChecklistTable } from "./checklist-table";

async function getChecklistData(houseIds: string[], month: number, year: number) {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const checklists = await prisma.dCDailyChecklist.findMany({
    where: {
      houseId: { in: houseIds },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const houses = await prisma.house.findMany({
    where: {
      id: { in: houseIds },
    },
    orderBy: { name: "asc" },
  });

  // Stats
  const totalRemote = checklists.filter((c) => c.visitType === "REMOTE").length;
  const totalOnsite = checklists.filter((c) => c.visitType === "ONSITE").length;

  return { checklists, houses, totalRemote, totalOnsite };
}

export default async function DCChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; houseId?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const currentDate = new Date();
  const month = params.month ? parseInt(params.month) : currentDate.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : currentDate.getFullYear();
  const filterHouseId = params.houseId;

  const houseIds = await getUserHouseIds(session.id);
  const { checklists, houses, totalRemote, totalOnsite } = await getChecklistData(
    filterHouseId ? [filterHouseId] : houseIds,
    month,
    year
  );

  // Get unique dates with checklists for this month
  const datesWithChecklists = new Set(
    checklists.map((c) => format(new Date(c.date), "yyyy-MM-dd"))
  );
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">DC Daily Checklist</h1>
          <p className="text-slate-500">
            Track daily remote oversight and onsite visit tasks per 245D requirements
          </p>
        </div>
        <NewChecklistDialog houses={houses} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Checklists</p>
                <p className="text-2xl font-bold">{checklists.length}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Remote Oversight</p>
                <p className="text-2xl font-bold text-purple-600">{totalRemote}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Onsite Visits</p>
                <p className="text-2xl font-bold text-green-600">{totalOnsite}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Coverage</p>
                <p className="text-2xl font-bold text-amber-600">
                  {datesWithChecklists.size}/{daysInMonth} days
                </p>
              </div>
              <Calendar className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Daily Oversight Requirements</h4>
              <p className="text-sm text-blue-700 mt-1">
                Per 245D requirements, DCs must complete daily remote oversight and regular onsite
                visits. Remote tasks include reviewing log notes, medications, and appointments.
                Onsite visits include narcotic counts, facility inspection, and staff interactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklists Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Checklists - {format(new Date(year, month - 1), "MMMM yyyy")}</CardTitle>
                <CardDescription>
                  Daily oversight and visit records
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Eye className="h-3 w-3 mr-1" />
                Remote
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <MapPin className="h-3 w-3 mr-1" />
                Onsite
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChecklistTable
            checklists={checklists}
            houses={houses}
            currentMonth={month}
            currentYear={year}
          />
        </CardContent>
      </Card>
    </div>
  );
}
