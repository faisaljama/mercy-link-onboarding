import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Scale,
  AlertTriangle,
  Clock,
  FileWarning,
  Plus,
  Eye,
  Users,
} from "lucide-react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { DisciplineFilters } from "./discipline-filters";
import { NewActionDialog } from "./new-action-dialog";

interface SearchParams {
  house?: string;
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
  const whereClause: Record<string, unknown> = {};

  // Role-based filtering
  if (userRole === "ADMIN" || userRole === "HR") {
    // Admin/HR can see all records
  } else if (userRole === "DESIGNATED_MANAGER") {
    whereClause.houseId = { in: houseIds };
  } else {
    whereClause.OR = [
      { issuedById: userId },
      { houseId: { in: houseIds } },
    ];
  }

  // Apply filters
  if (filters.house && filters.house !== "all") {
    whereClause.houseId = filters.house;
  }
  if (filters.status && filters.status !== "all") {
    whereClause.status = filters.status;
  }
  if (filters.severity && filters.severity !== "all") {
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
        select: { signerType: true, signedAt: true },
      },
    },
    orderBy: { violationDate: "desc" },
    take: 100,
  });

  return actions;
}

async function getStats(houseIds: string[], userRole: string) {
  const ninetyDaysAgo = subDays(new Date(), 90);
  const sevenDaysAgo = subDays(new Date(), 7);

  const whereClause: Record<string, unknown> =
    userRole === "ADMIN" || userRole === "HR"
      ? {}
      : { houseId: { in: houseIds } };

  const [totalActions, pendingSignatures, thisWeek] = await Promise.all([
    prisma.correctiveAction.count({
      where: { ...whereClause, violationDate: { gte: ninetyDaysAgo } },
    }),
    prisma.correctiveAction.count({
      where: { ...whereClause, status: "PENDING_SIGNATURE" },
    }),
    prisma.correctiveAction.count({
      where: { ...whereClause, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  // Count employees at risk (14+ points in 90 days)
  const atRiskCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM (
      SELECT ca."employeeId"
      FROM "CorrectiveAction" ca
      WHERE ca."violationDate" >= ${ninetyDaysAgo}
        AND ca.status != 'VOIDED'
      GROUP BY ca."employeeId"
      HAVING SUM(COALESCE(ca."pointsAdjusted", ca."pointsAssigned")) >= 14
    ) as at_risk
  `;

  return {
    totalActions,
    pendingSignatures,
    thisWeek,
    atRiskEmployees: Number(atRiskCount[0]?.count || 0),
  };
}

async function getHouses(houseIds: string[]) {
  return prisma.house.findMany({
    where: { id: { in: houseIds } },
    orderBy: { name: "asc" },
  });
}

async function getEmployees(houseIds: string[]) {
  return prisma.employee.findMany({
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
      position: true,
    },
    orderBy: { lastName: "asc" },
  });
}

async function getViolationCategories() {
  return prisma.violationCategory.findMany({
    where: { isActive: true },
    orderBy: [{ severityLevel: "asc" }, { displayOrder: "asc" }],
  });
}

function getStatusBadge(status: string) {
  const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING_SIGNATURE: { label: "Pending Signature", variant: "secondary" },
    ACKNOWLEDGED: { label: "Acknowledged", variant: "default" },
    DISPUTED: { label: "Disputed", variant: "destructive" },
    VOIDED: { label: "Voided", variant: "outline" },
  };
  return badges[status] || { label: status, variant: "outline" };
}

function getSeverityBadge(severity: string) {
  const badges: Record<string, string> = {
    MINOR: "bg-blue-100 text-blue-800",
    MODERATE: "bg-yellow-100 text-yellow-800",
    SERIOUS: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
    IMMEDIATE_TERMINATION: "bg-red-600 text-white",
  };
  return badges[severity] || "bg-gray-100 text-gray-800";
}

function getDisciplineLevelBadge(level: string) {
  const labels: Record<string, string> = {
    COACHING: "Coaching",
    VERBAL_WARNING: "Verbal Warning",
    WRITTEN_WARNING: "Written Warning",
    FINAL_WARNING: "Final Warning",
    PIP: "PIP",
    TERMINATION: "Termination",
  };
  return labels[level] || level;
}

export default async function DisciplinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Check permissions
  const allowedRoles = ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  
  const [actions, stats, houses, employees, categories] = await Promise.all([
    getCorrectiveActions(houseIds, session.role, session.id, resolvedParams),
    getStats(houseIds, session.role),
    getHouses(houseIds),
    getEmployees(houseIds),
    getViolationCategories(),
  ]);

  // Check if categories are seeded
  const categoriesSeeded = categories.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Scale className="h-8 w-8 text-purple-600" />
            Discipline Tracker
          </h1>
          <p className="text-slate-500 mt-1">
            Progressive discipline with rolling 90-day point system
          </p>
        </div>
        {categoriesSeeded ? (
          <NewActionDialog
            employees={employees}
            houses={houses}
          />
        ) : (
          <SeedCategoriesButton />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active (90 Days)</p>
                <p className="text-2xl font-bold">{stats.totalActions}</p>
              </div>
              <Scale className="h-8 w-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={stats.atRiskEmployees > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">At-Risk Employees</p>
                <p className="text-2xl font-bold text-red-600">{stats.atRiskEmployees}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-300" />
            </div>
            <p className="text-xs text-slate-500 mt-2">14+ points in 90 days</p>
          </CardContent>
        </Card>

        <Card className={stats.pendingSignatures > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Signatures</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingSignatures}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-300" />
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
              <FileWarning className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DisciplineFilters houses={houses} />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Corrective Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Scale className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">No corrective actions found</p>
              <p className="text-sm mt-1">
                {categoriesSeeded
                  ? "Create a new corrective action to get started"
                  : "Seed violation categories first to create corrective actions"}
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
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => {
                  const statusBadge = getStatusBadge(action.status);
                  const severityClass = getSeverityBadge(action.violationCategory.severityLevel);
                  const points = action.pointsAdjusted ?? action.pointsAssigned;

                  return (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">
                        {format(new Date(action.violationDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {action.employee.firstName} {action.employee.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{action.employee.position}</p>
                        </div>
                      </TableCell>
                      <TableCell>{action.house?.name || "—"}</TableCell>
                      <TableCell>
                        <div>
                          <Badge className={severityClass}>
                            {action.violationCategory.severityLevel}
                          </Badge>
                          <p className="text-sm mt-1 max-w-[200px] truncate">
                            {action.violationCategory.categoryName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-lg">{points}</span>
                        {action.pointsAdjusted && action.pointsAdjusted !== action.pointsAssigned && (
                          <span className="text-xs text-slate-500 ml-1">
                            (was {action.pointsAssigned})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getDisciplineLevelBadge(action.disciplineLevel)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/discipline/${action.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
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

// Component to seed categories
function SeedCategoriesButton() {
  return (
    <form action="/api/violation-categories/seed" method="POST">
      <Button type="submit" className="gap-2">
        <Plus className="h-4 w-4" />
        Seed Violation Categories
      </Button>
    </form>
  );
}
