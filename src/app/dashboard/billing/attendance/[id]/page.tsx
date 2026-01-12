import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Printer,
  Home,
  Calendar,
  User,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteReportButton } from "./delete-report-button";

const BILLABLE_CODES = ["P"];
const PERIOD_DAYS = 14;

async function getReport(id: string) {
  const report = await prisma.attendanceReport.findUnique({
    where: { id },
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
  });

  return report;
}

// Get day of week abbreviation
function getDayOfWeek(startDate: Date, dayOffset: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
}

// Get date number
function getDateNumber(startDate: Date, dayOffset: number): number {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date.getDate();
}

function getCodeColor(code: string | null) {
  if (!code) return "";
  if (code === "P") {
    return "bg-green-100 text-green-800";
  }
  return "bg-red-100 text-red-800";
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
  return `${format(startDate, "M/d/yy")} - ${format(endDate, "M/d/yy")}`;
}

export default async function AttendanceReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  const startDate = new Date(report.startDate);
  const endDate = new Date(report.endDate);

  // Calculate totals
  const totalBillable = report.entries.reduce((s, e) => s + e.billableDays, 0);
  const totalNonBillable = report.entries.reduce((s, e) => s + e.nonBillableDays, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing/attendance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Attendance Reports
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bi-Weekly Attendance Report</h1>
          <p className="text-slate-500">
            {report.house.name} - {formatPeriod(startDate, endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          <Link href={`/dashboard/billing/attendance/${report.id}/print`}>
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </Link>
          {session.role === "ADMIN" && <DeleteReportButton reportId={report.id} />}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">House</p>
                <p className="text-lg font-bold">{report.house.name}</p>
              </div>
              <Home className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Billing Period</p>
                <p className="text-lg font-bold">
                  {formatPeriod(startDate, endDate)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Billable Days</p>
                <p className="text-2xl font-bold text-green-600">{totalBillable}</p>
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
                <p className="text-2xl font-bold text-red-600">{totalNonBillable}</p>
              </div>
              <Clock className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
          <CardDescription>
            Attendance codes for each resident by day (14-day period)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border px-3 py-2 text-left font-bold sticky left-0 bg-slate-100 z-10 min-w-[180px]">
                  Resident Name
                </th>
                <th className="border px-2 py-2 text-left font-bold min-w-[100px]">MA ID</th>
                {Array.from({ length: PERIOD_DAYS }, (_, i) => (
                  <th key={i + 1} className="border px-1 py-2 text-center font-bold min-w-[40px]">
                    <div className="text-[10px] text-slate-500">{getDayOfWeek(startDate, i)}</div>
                    <div>{getDateNumber(startDate, i)}</div>
                  </th>
                ))}
                <th className="border px-2 py-2 text-center font-bold bg-green-100 min-w-[60px]">
                  Billable
                </th>
                <th className="border px-2 py-2 text-center font-bold bg-red-100 min-w-[60px]">
                  Non-Bill
                </th>
              </tr>
            </thead>
            <tbody>
              {report.entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-3 py-2 font-medium sticky left-0 bg-white z-10">
                    {entry.clientName}
                  </td>
                  <td className="border px-2 py-2 text-slate-600">
                    {entry.maId || "-"}
                  </td>
                  {Array.from({ length: PERIOD_DAYS }, (_, dayIndex) => {
                    const day = dayIndex + 1;
                    const code = entry[`day${day}` as keyof typeof entry] as string | null;
                    return (
                      <td key={day} className="border px-1 py-1 text-center">
                        {code && (
                          <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${getCodeColor(code)}`}>
                            {code}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border px-2 py-2 text-center font-bold text-green-600 bg-green-50">
                    {entry.billableDays}
                  </td>
                  <td className="border px-2 py-2 text-center font-bold text-red-600 bg-red-50">
                    {entry.nonBillableDays}
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={2} className="border px-3 py-2 text-right">
                  TOTALS:
                </td>
                {Array.from({ length: PERIOD_DAYS }, (_, i) => (
                  <td key={i + 1} className="border px-1 py-2"></td>
                ))}
                <td className="border px-2 py-2 text-center text-green-600 bg-green-100">
                  {totalBillable}
                </td>
                <td className="border px-2 py-2 text-center text-red-600 bg-red-100">
                  {totalNonBillable}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Report Info */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Created By</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{report.createdBy.name}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created At</p>
              <p className="font-medium">
                {format(new Date(report.createdAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Last Updated</p>
              <p className="font-medium">
                {format(new Date(report.updatedAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Residents</p>
              <p className="font-medium">{report.entries.length}</p>
            </div>
          </div>
          {report.notes && (
            <div>
              <p className="text-sm text-slate-500">Notes</p>
              <p className="text-slate-700 whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Codes Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 font-medium">P</span>
              <span>Present (Billable)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-medium">A</span>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-medium">H</span>
              <span>Hospitalized</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-medium">V</span>
              <span>Vacation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-medium">DC</span>
              <span>Discharged</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
