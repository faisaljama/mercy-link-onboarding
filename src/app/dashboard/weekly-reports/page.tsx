import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Home,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { NewReportDialog } from "./new-report-dialog";
import { ReportsTable } from "./reports-table";

async function getReportsData(houseIds: string[], month: number, year: number) {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const reports = await prisma.weeklyDCReport.findMany({
    where: {
      houseId: { in: houseIds },
      weekStartDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      house: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      submittedBy: {
        select: { id: true, name: true, email: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { weekStartDate: "desc" },
  });

  const houses = await prisma.house.findMany({
    where: {
      id: { in: houseIds },
    },
    orderBy: { name: "asc" },
  });

  // Stats
  const drafts = reports.filter((r) => r.status === "DRAFT").length;
  const submitted = reports.filter((r) => r.status === "SUBMITTED").length;
  const reviewed = reports.filter((r) => r.status === "REVIEWED").length;

  return { reports, houses, drafts, submitted, reviewed };
}

export default async function WeeklyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; houseId?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const currentDate = new Date();
  const month = params.month ? parseInt(params.month) : currentDate.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : currentDate.getFullYear();
  const filterHouseId = params.houseId;
  const filterStatus = params.status;

  const houseIds = await getUserHouseIds(session.id);
  const { reports, houses, drafts, submitted, reviewed } = await getReportsData(
    filterHouseId ? [filterHouseId] : houseIds,
    month,
    year
  );

  // Filter by status if specified
  const filteredReports = filterStatus
    ? reports.filter((r) => r.status === filterStatus)
    : reports;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Weekly DC Reports</h1>
          <p className="text-slate-500">
            Submit weekly reports to DM about house operations and resident care
          </p>
        </div>
        <NewReportDialog houses={houses} />
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
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Drafts</p>
                <p className="text-2xl font-bold text-amber-600">{drafts}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Review</p>
                <p className="text-2xl font-bold text-blue-600">{submitted}</p>
              </div>
              <Send className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Reviewed</p>
                <p className="text-2xl font-bold text-green-600">{reviewed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
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
              <h4 className="font-medium text-blue-900">Weekly Report Workflow</h4>
              <p className="text-sm text-blue-700 mt-1">
                DCs should create a weekly report for each house. Complete all sections with updates
                about staffing, residents, incidents, and upcoming concerns. Submit to DM for review
                by end of each week.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Reports - {format(new Date(year, month - 1), "MMMM yyyy")}</CardTitle>
                <CardDescription>
                  Weekly reports submitted to management
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                <Clock className="h-3 w-3 mr-1" />
                Draft
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Send className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Reviewed
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ReportsTable
            reports={filteredReports}
            houses={houses}
            currentMonth={month}
            currentYear={year}
          />
        </CardContent>
      </Card>
    </div>
  );
}
