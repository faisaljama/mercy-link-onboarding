import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  AlertTriangle,
  FileWarning,
  Clock,
  Users,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { DisciplineFilters } from "./discipline-filters";
import { NewActionDialog } from "./new-action-dialog";

interface SearchParams {
  houseId?: string;
  status?: string;
  severity?: string;
  search?: string;
}

async function getCorrectiveActions(
  houseIds: string[],
  userRole: string,
  userId: string,
  filters: SearchParams
) {
  const ninetyDaysAgo = subDays(new Date(), 90);

  // Build where clause based on role
  const whereClause: Record<string, unknown> = {};

  if (userRole === "ADMIN" || userRole === "HR") {
    // Admin/HR see all
  } else if (userRole === "DESIGNATED_MANAGER") {
    whereClause.houseId = { in: houseIds };
  } else {
    whereClause.OR = [
      { issuedById: userId },
      { houseId: { in: houseIds } },
    ];
  }

  // Apply filters
  if (filters.houseId) {
    whereClause.houseId = filters.houseId;
  }
  if (filters.status) {
    whereClause.status = filters.status;
  }
  if (filters.severity) {
    whereClause.violationCategory = { severityLevel: filters.severity };
  }

  const actions = await prisma.correctiveAction.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
      issuedBy: {
        select: { id: true, name: true },
      },
      house: {
        select: { id: true, name: true },
      },
      violationCategory: true,
      signatures: {
        select: { signerType: true },
      },
    },
    orderBy: { violationDate: "desc" },
    take: 100,
  });

  // Calculate stats
  const stats = {
    total: actions.length,
    pendingSignatures: actions.filter((a) => a.status === "PENDING_SIGNATURE").length,
    thisWeek: actions.filter((a) => {
      const sevenDaysAgo = subDays(new Date(), 7);
      return new Date(a.createdAt) >= sevenDaysAgo;
    }).length,
  };

  // Get at-risk employees (14+ points in rolling 90 days)
  const atRiskCount = await prisma.$queryRaw<{ count: string }[]>`
    SELECT COUNT(*) as count FROM (
      SELECT "employeeId"
      FROM "CorrectiveAction"
      WHERE "violationDate" >= ${ninetyDaysAgo}
        AND status != 'VOIDED'
      GROUP BY "employeeId"
      HAVING SUM(COALESCE("pointsAdjusted", "pointsAssigned")) >= 14
    ) as at_risk
  `;

  return {
    actions,
    stats: {
      ...stats,
      atRiskEmployees: parseInt(atRiskCount[0]?.count || "0"),
    },
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING_SIGNATURE":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Signature</Badge>;
    case "ACKNOWLEDGED":
      return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>;
    case "DISPUTED":
      return <Badge className="bg-orange-100 text-orange-800">Disputed</Badge>;
    case "VOIDED":
      return <Badge className="bg-slate-100 text-slate-800">Voided</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "MINOR":
      return <Badge variant="outline" className="border-blue-300 text-blue-700">Minor</Badge>;
    case "MODERATE":
      return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Moderate</Badge>;
    case "SERIOUS":
      return <Badge variant="outline" className="border-orange-300 text-orange-700">Serious</Badge>;
    case "CRITICAL":
      return <Badge variant="outline" className="border-red-300 text-red-700">Critical</Badge>;
    case "IMMEDIATE_TERMINATION":
      return <Badge className="bg-red-600 text-white">Immediate Review</Badge>;
    default:
      return <Badge variant="outline">{severity}</Badge>;
  }
}

export default async function DisciplinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { actions, stats } = await getCorrectiveActions(
    houseIds,
    session.role,
    session.id,
    params
  );

  // Get houses and employees for filters/form
  const houses = await prisma.house.findMany({
    where: session.role === "ADMIN" || session.role === "HR"
      ? {}
      : { id: { in: houseIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      ...(session.role === "ADMIN" || session.role === "HR"
        ? {}
        : { assignedHouses: { some: { houseId: { in: houseIds } } } }),
    },
    select: { id: true, firstName: true, lastName: true, position: true },
    orderBy: { lastName: "asc" },
  });

  const canCreate = ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"].includes(session.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Discipline Tracker</h1>
          <p className="text-slate-500">
            Manage employee corrective actions and track discipline points
          </p>
        </div>
        {canCreate && (
          <NewActionDialog houses={houses} employees={employees} />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Actions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">At-Risk Employees</p>
                <p className="text-2xl font-bold text-red-600">{stats.atRiskEmployees}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
            <p className="text-xs text-slate-400 mt-1">14+ points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Signatures</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingSignatures}</p>
              </div>
              <FileWarning className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Week</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <Clock className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DisciplineFilters houses={houses} />

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corrective Actions</CardTitle>
          <CardDescription>
            All corrective actions with their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p>No corrective actions found</p>
              <p className="text-sm mt-1">
                Create a new corrective action to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(action.violationDate), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/employees/${action.employee.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        <div className="font-medium">
                          {action.employee.lastName}, {action.employee.firstName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {action.employee.position}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {action.house ? (
                        <span className="text-sm">{action.house.name}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium truncate max-w-[200px]">
                          {action.violationCategory.categoryName}
                        </div>
                        {getSeverityBadge(action.violationCategory.severityLevel)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {action.pointsAdjusted ?? action.pointsAssigned}
                      </span>
                      {action.pointsAdjusted && action.pointsAdjusted !== action.pointsAssigned && (
                        <span className="text-xs text-slate-400 ml-1">
                          (was {action.pointsAssigned})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{action.issuedBy.name}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(action.status)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/discipline/${action.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
