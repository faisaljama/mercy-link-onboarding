import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Calendar,
  Home,
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { NewAttendanceReportDialog } from "./new-attendance-report-dialog";
import { AttendanceFilters } from "./attendance-filters";

async function getAttendanceData(houseIds: string[], houseFilter?: string) {
  const where: Record<string, unknown> = {
    houseId: { in: houseIds },
  };

  if (houseFilter) {
    where.houseId = houseFilter;
  }

  const reports = await prisma.attendanceReport.findMany({
    where,
    include: {
      house: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      entries: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ startDate: "desc" }],
  });

  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    orderBy: { name: "asc" },
  });

  // Get clients for each house (for the form)
  const clients = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    include: {
      house: true,
      serviceAgreements: {
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }],
  });

  return {
    reports,
    houses,
    clients,
  };
}

function getStatusBadge(status: string) {
  if (status === "SUBMITTED") {
    return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Submitted
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-100 text-yellow-800">
      <Clock className="mr-1 h-3 w-3" />
      Draft
    </Badge>
  );
}

function formatPeriod(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${format(start, "M/d/yy")} - ${format(end, "M/d/yy")}`;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ houseId?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { reports, houses, clients: rawClients } = await getAttendanceData(
    houseIds,
    params.houseId
  );

  // Transform clients to convert Decimal dailyRate to string for the dialog component
  const clients = rawClients.map((client) => ({
    ...client,
    serviceAgreements: client.serviceAgreements.map((sa) => ({
      ...sa,
      dailyRate: sa.dailyRate ? sa.dailyRate.toString() : null,
    })),
  }));

  // Calculate stats
  const totalBillableDays = reports.reduce(
    (sum, r) => sum + r.entries.reduce((s, e) => s + e.billableDays, 0),
    0
  );
  const totalNonBillableDays = reports.reduce(
    (sum, r) => sum + r.entries.reduce((s, e) => s + e.nonBillableDays, 0),
    0
  );
  const totalClients = reports.reduce((sum, r) => sum + r.entries.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bi-Weekly Attendance Reports</h1>
          <p className="text-slate-500">
            Track bi-weekly attendance for CRS billing (14-day periods)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/billing/accounts-receivable">
            <Button variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Accounts Receivable
            </Button>
          </Link>
          <NewAttendanceReportDialog houses={houses} clients={clients} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Clients</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Billable Days</p>
                <p className="text-2xl font-bold text-green-600">{totalBillableDays}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Non-Billable Days</p>
                <p className="text-2xl font-bold text-red-600">{totalNonBillableDays}</p>
              </div>
              <Clock className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <AttendanceFilters
        houses={houses}
        currentHouseId={params.houseId}
      />

      {/* Attendance Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Reports</CardTitle>
          <CardDescription>
            Bi-weekly attendance tracking by house (14-day billing periods)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No attendance reports found</p>
              <p className="text-sm">Create a new attendance report to start tracking</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead className="text-center">Clients</TableHead>
                  <TableHead className="text-center">Billable Days</TableHead>
                  <TableHead className="text-center">Non-Billable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const billableDays = report.entries.reduce((s, e) => s + e.billableDays, 0);
                  const nonBillableDays = report.entries.reduce((s, e) => s + e.nonBillableDays, 0);

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{report.house.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatPeriod(report.startDate, report.endDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {report.entries.length}
                      </TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {billableDays}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {nonBillableDays}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {report.createdBy.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/billing/attendance/${report.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/billing/attendance/${report.id}/print`}
                            className="text-slate-600 hover:underline text-sm"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attendance Codes Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Codes Legend</CardTitle>
          <CardDescription>
            Use these codes when entering daily attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 w-10 justify-center">P</Badge>
              <span className="text-sm">Present (Billable)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 w-10 justify-center">A</Badge>
              <span className="text-sm">Absent (Not Billable)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 w-10 justify-center">H</Badge>
              <span className="text-sm">Hospitalized (Not Billable)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 w-10 justify-center">V</Badge>
              <span className="text-sm">Vacation (Not Billable)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 w-10 justify-center">DC</Badge>
              <span className="text-sm">Discharged (Not Billable)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
