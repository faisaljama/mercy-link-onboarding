import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Flame,
  Calendar,
  Clock,
  Home,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { NewFireDrillDialog } from "./new-fire-drill-dialog";
import { PrintSelector } from "./print-selector";

// Helper to calculate bi-monthly period from a date
function getBiMonthlyPeriod(date: Date): number {
  const month = date.getMonth() + 1;
  return Math.ceil(month / 2);
}

// Helper to get period label
function getPeriodLabel(period: number): string {
  const labels: Record<number, string> = {
    1: "Jan-Feb",
    2: "Mar-Apr",
    3: "May-Jun",
    4: "Jul-Aug",
    5: "Sep-Oct",
    6: "Nov-Dec",
  };
  return labels[period] || "";
}

async function getFireDrillData(houseIds: string[]) {
  const currentYear = new Date().getFullYear();

  const drills = await prisma.fireDrill.findMany({
    where: {
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      completedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ drillDate: "desc" }],
  });

  const houses = await prisma.house.findMany({
    where: {
      id: { in: houseIds },
    },
    orderBy: { name: "asc" },
  });

  const clients = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    include: {
      house: true,
    },
    orderBy: [{ houseId: "asc" }, { lastName: "asc" }],
  });

  const employees = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "LEAD_STAFF"],
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate completion status for current year
  const now = new Date();
  const currentPeriod = getBiMonthlyPeriod(now);

  const completionStatus = houses.map((house) => {
    const houseDrills = drills.filter(
      (d) => d.houseId === house.id && d.year === currentYear
    );
    const periods = [];

    for (let period = 1; period <= 6; period++) {
      const drill = houseDrills.find((d) => d.biMonthlyPeriod === period);
      const isPast = period < currentPeriod;
      const isCurrent = period === currentPeriod;

      periods.push({
        period,
        label: getPeriodLabel(period),
        completed: !!drill,
        drillId: drill?.id,
        drillDate: drill?.drillDate,
        isPast,
        isCurrent,
        isOverdue: isPast && !drill,
      });
    }

    const completedCount = periods.filter((p) => p.completed).length;
    const overdueCount = periods.filter((p) => p.isOverdue).length;

    return {
      house,
      periods,
      completedCount,
      overdueCount,
    };
  });

  return {
    drills,
    houses,
    clients,
    employees,
    completionStatus,
    currentYear,
    currentPeriod,
  };
}

export default async function FireDrillsPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const {
    drills,
    houses,
    clients,
    employees,
    completionStatus,
    currentYear,
    currentPeriod,
  } = await getFireDrillData(houseIds);

  // Stats
  const totalDrillsThisYear = drills.filter((d) => d.year === currentYear).length;
  const housesCompliant = completionStatus.filter((h) => h.overdueCount === 0).length;
  const totalOverdue = completionStatus.reduce((sum, h) => sum + h.overdueCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fire Drill Log</h1>
          <p className="text-slate-500">
            Track fire drills for each house (required every 2 months)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintSelector houses={houses} />
          <NewFireDrillDialog
            houses={houses}
            clients={clients}
            employees={employees}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{currentYear} Drills</p>
                <p className="text-2xl font-bold">{totalDrillsThisYear}</p>
              </div>
              <Flame className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Houses Compliant</p>
                <p className="text-2xl font-bold text-green-600">
                  {housesCompliant}/{houses.length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue Drills</p>
                <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Current Period</p>
                <p className="text-2xl font-bold">{getPeriodLabel(currentPeriod)}</p>
              </div>
              <Calendar className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>{currentYear} Compliance Status</CardTitle>
          <CardDescription>
            Fire drill completion by house and bi-monthly period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead className="text-center">Jan-Feb</TableHead>
                  <TableHead className="text-center">Mar-Apr</TableHead>
                  <TableHead className="text-center">May-Jun</TableHead>
                  <TableHead className="text-center">Jul-Aug</TableHead>
                  <TableHead className="text-center">Sep-Oct</TableHead>
                  <TableHead className="text-center">Nov-Dec</TableHead>
                  <TableHead className="text-center">Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completionStatus.map(({ house, periods }) => (
                  <TableRow key={house.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{house.name}</span>
                      </div>
                    </TableCell>
                    {periods.map((period) => (
                      <TableCell key={period.period} className="text-center">
                        {period.completed ? (
                          <Link
                            href={`/dashboard/fire-drills/${period.drillId}`}
                            className="inline-flex"
                          >
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              <CheckCircle2 className="h-3 w-3" />
                            </Badge>
                          </Link>
                        ) : period.isOverdue ? (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3" />
                          </Badge>
                        ) : period.isCurrent ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Due
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">
                            -
                          </Badge>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Link
                        href={`/dashboard/fire-drills/print?houseId=${house.id}`}
                        target="_blank"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Print
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Drills */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Fire Drills</CardTitle>
          <CardDescription>
            All recorded fire drills
          </CardDescription>
        </CardHeader>
        <CardContent>
          {drills.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Flame className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No fire drills recorded yet</p>
              <p className="text-sm">Add a new fire drill to start tracking</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Completed By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drills.slice(0, 20).map((drill) => {
                  const participants = JSON.parse(drill.participants || "[]");
                  return (
                    <TableRow key={drill.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {format(new Date(drill.drillDate), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="h-3 w-3" />
                            {drill.drillTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-slate-400" />
                          {drill.house.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPeriodLabel(drill.biMonthlyPeriod)} {drill.year}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {participants.length} participant{participants.length !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">{drill.completedBy.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/fire-drills/${drill.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
