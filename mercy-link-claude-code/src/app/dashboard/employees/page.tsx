import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
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
import { Plus, AlertTriangle, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { EmployeeFilters } from "./employee-filters";

async function getEmployees(houseIds: string[], houseFilter?: string) {
  const whereClause: Record<string, unknown> = {
    status: "ACTIVE",
    assignedHouses: {
      some: {
        houseId: { in: houseIds },
      },
    },
  };

  if (houseFilter && houseFilter !== "all") {
    whereClause.assignedHouses = {
      some: {
        houseId: houseFilter,
      },
    };
  }

  const employees = await prisma.employee.findMany({
    where: whereClause,
    include: {
      assignedHouses: {
        include: { house: true },
      },
      complianceItems: {
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
      _count: {
        select: {
          complianceItems: {
            where: { status: "OVERDUE" },
          },
        },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return employees;
}

async function getHouses(houseIds: string[]) {
  return prisma.house.findMany({
    where: { id: { in: houseIds } },
    orderBy: { name: "asc" },
  });
}

function getPositionLabel(position: string) {
  const labels: Record<string, string> = {
    DSP: "Direct Support Professional",
    LEAD_DSP: "Lead DSP",
    DC: "Designated Coordinator",
    DM: "Designated Manager",
  };
  return labels[position] || position;
}

function getComplianceStatus(overdueCount: number, nextItem: { dueDate: Date; status: string } | null) {
  if (overdueCount > 0) {
    return { label: `${overdueCount} Overdue`, color: "bg-red-100 text-red-800", icon: AlertTriangle };
  }
  if (nextItem) {
    const daysUntil = Math.ceil((nextItem.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return { label: `Due in ${daysUntil}d`, color: "bg-orange-100 text-orange-800", icon: Clock };
    }
    return { label: "On Track", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
  }
  return { label: "Complete", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const [employees, houses] = await Promise.all([
    getEmployees(houseIds, params.house),
    getHouses(houseIds),
  ]);

  const filteredEmployees = params.search
    ? employees.filter(
        (e) =>
          e.firstName.toLowerCase().includes(params.search!.toLowerCase()) ||
          e.lastName.toLowerCase().includes(params.search!.toLowerCase())
      )
    : employees;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500">Manage staff and their training compliance</p>
        </div>
        <Link href="/dashboard/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      <EmployeeFilters houses={houses} />

      <Card>
        <CardHeader>
          <CardTitle>All Employees ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Assigned Houses</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Training Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => {
                  const status = getComplianceStatus(
                    employee._count.complianceItems,
                    employee.complianceItems[0] || null
                  );
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {employee.lastName}, {employee.firstName}
                        </Link>
                        {employee.email && (
                          <p className="text-xs text-slate-500">{employee.email}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.position}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {employee.assignedHouses.slice(0, 2).map((ah) => (
                            <Badge key={ah.id} variant="secondary" className="text-xs">
                              {ah.house.name}
                            </Badge>
                          ))}
                          {employee.assignedHouses.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{employee.assignedHouses.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(employee.hireDate, "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                          {employee.experienceYears} {employee.experienceYears === 1 ? "year" : "years"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/employees/${employee.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
