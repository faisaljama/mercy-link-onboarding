import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Home,
  Users,
  UserCog,
  MapPin,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Building,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { HouseUtilities } from "./house-utilities";
import { HouseTasks } from "./house-tasks";

async function getHouse(id: string, houseIds: string[]) {
  if (!houseIds.includes(id)) return null;

  const house = await prisma.house.findUnique({
    where: { id },
    include: {
      clients: {
        where: { status: "ACTIVE" },
        include: {
          complianceItems: {
            where: { status: { in: ["PENDING", "OVERDUE"] } },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
          _count: {
            select: {
              complianceItems: { where: { status: "OVERDUE" } },
            },
          },
        },
        orderBy: { lastName: "asc" },
      },
      employees: {
        include: {
          employee: {
            include: {
              complianceItems: {
                where: { status: { in: ["PENDING", "OVERDUE"] } },
                orderBy: { dueDate: "asc" },
                take: 1,
              },
              _count: {
                select: {
                  complianceItems: { where: { status: "OVERDUE" } },
                },
              },
            },
          },
        },
      },
      assignedUsers: {
        include: {
          user: true,
        },
      },
    },
  });

  return house;
}

function getComplianceStatus(overdueCount: number) {
  if (overdueCount > 0) {
    return { color: "bg-red-100 text-red-800", icon: AlertTriangle };
  }
  return { color: "bg-green-100 text-green-800", icon: CheckCircle2 };
}

export default async function HouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const house = await getHouse(id, houseIds);

  if (!house) {
    notFound();
  }

  const clientOverdue = house.clients.reduce(
    (a, c) => a + c._count.complianceItems,
    0
  );
  const employeeOverdue = house.employees.reduce(
    (a, e) => a + e.employee._count.complianceItems,
    0
  );
  const totalOverdue = clientOverdue + employeeOverdue;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/houses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Houses
          </Button>
        </Link>
      </div>

      {/* House Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
            <Home className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{house.name}</h1>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="h-4 w-4" />
              {house.address}
            </div>
          </div>
        </div>
        {session.role === "ADMIN" && (
          <Link href={`/dashboard/houses/${house.id}/edit`}>
            <Button variant="outline">Edit House</Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Clients</p>
                <p className="text-2xl font-bold">{house.clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Staff</p>
                <p className="text-2xl font-bold">{house.employees.length}</p>
              </div>
              <UserCog className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Capacity</p>
                <p className="text-2xl font-bold">{house.capacity}</p>
              </div>
              <Building className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Occupancy</p>
                <p className="text-2xl font-bold">
                  {Math.round((house.clients.length / house.capacity) * 100)}%
                </p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue</p>
                <p className={`text-2xl font-bold ${totalOverdue > 0 ? "text-red-600" : "text-green-600"}`}>
                  {totalOverdue}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${totalOverdue > 0 ? "text-red-200" : "text-green-200"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* House Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>House Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="font-medium">{house.address}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">County</p>
              <p className="font-medium">{house.county}</p>
            </div>
            {house.licenseNumber && (
              <div>
                <p className="text-sm text-slate-500">License Number</p>
                <p className="font-medium">{house.licenseNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Capacity</p>
              <p className="font-medium">{house.capacity} residents</p>
            </div>

            {house.assignedUsers.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-slate-700 mb-2">Assigned Staff Users</p>
                <div className="space-y-2">
                  {house.assignedUsers.map((au) => (
                    <div key={au.id} className="flex items-center justify-between">
                      <span className="text-sm">{au.user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {au.user.role.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients & Employees Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Residents & Staff</CardTitle>
            <CardDescription>People assigned to this house</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="clients">
              <TabsList>
                <TabsTrigger value="clients">
                  Clients ({house.clients.length})
                </TabsTrigger>
                <TabsTrigger value="employees">
                  Staff ({house.employees.length})
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  Tasks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clients" className="mt-4">
                {house.clients.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No clients assigned to this house
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Waiver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {house.clients.map((client) => {
                        const status = getComplianceStatus(client._count.complianceItems);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={client.id}>
                            <TableCell>
                              <Link
                                href={`/dashboard/clients/${client.id}`}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {client.lastName}, {client.firstName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{client.waiverType || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {client._count.complianceItems > 0
                                  ? `${client._count.complianceItems} Overdue`
                                  : "On Track"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {client.complianceItems[0] ? (
                                <span className="text-sm">
                                  {format(client.complianceItems[0].dueDate, "MMM d")}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="employees" className="mt-4">
                {house.employees.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No staff assigned to this house
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {house.employees.map((eh) => {
                        const employee = eh.employee;
                        const status = getComplianceStatus(employee._count.complianceItems);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={eh.id}>
                            <TableCell>
                              <Link
                                href={`/dashboard/employees/${employee.id}`}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {employee.lastName}, {employee.firstName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{employee.position}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {employee._count.complianceItems > 0
                                  ? `${employee._count.complianceItems} Overdue`
                                  : "On Track"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {employee.complianceItems[0] ? (
                                <span className="text-sm">
                                  {format(employee.complianceItems[0].dueDate, "MMM d")}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <HouseTasks houseId={house.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Utilities Section */}
      <HouseUtilities houseId={house.id} userRole={session.role} />
    </div>
  );
}
