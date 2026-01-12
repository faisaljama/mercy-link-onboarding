import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCog,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Home,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";

async function getDashboardStats(houseIds: string[]) {
  const today = new Date();

  const [
    totalClients,
    totalEmployees,
    totalHouses,
    overdueItems,
    upcomingItems,
    completedItems,
    recentItems,
  ] = await Promise.all([
    prisma.client.count({
      where: { houseId: { in: houseIds }, status: "ACTIVE" },
    }),
    prisma.employee.count({
      where: {
        assignedHouses: { some: { houseId: { in: houseIds } } },
        status: "ACTIVE",
      },
    }),
    prisma.house.count({
      where: { id: { in: houseIds } },
    }),
    prisma.complianceItem.count({
      where: {
        status: "OVERDUE",
        OR: [
          { client: { houseId: { in: houseIds } } },
          { employee: { assignedHouses: { some: { houseId: { in: houseIds } } } } },
        ],
      },
    }),
    prisma.complianceItem.count({
      where: {
        status: "PENDING",
        dueDate: { lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
        OR: [
          { client: { houseId: { in: houseIds } } },
          { employee: { assignedHouses: { some: { houseId: { in: houseIds } } } } },
        ],
      },
    }),
    prisma.complianceItem.count({
      where: {
        status: "COMPLETED",
        OR: [
          { client: { houseId: { in: houseIds } } },
          { employee: { assignedHouses: { some: { houseId: { in: houseIds } } } } },
        ],
      },
    }),
    prisma.complianceItem.findMany({
      where: {
        OR: [
          { client: { houseId: { in: houseIds } } },
          { employee: { assignedHouses: { some: { houseId: { in: houseIds } } } } },
        ],
        status: { in: ["PENDING", "OVERDUE"] },
      },
      include: {
        client: { include: { house: true } },
        employee: true,
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
  ]);

  const totalItems = overdueItems + upcomingItems + completedItems;
  const complianceRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

  return {
    totalClients,
    totalEmployees,
    totalHouses,
    overdueItems,
    upcomingItems,
    completedItems,
    complianceRate,
    recentItems,
  };
}

function getStatusColor(status: string, dueDate: Date) {
  if (status === "COMPLETED") return "bg-green-100 text-green-800";
  if (status === "OVERDUE") return "bg-red-100 text-red-800";

  const daysUntilDue = differenceInDays(dueDate, new Date());
  if (daysUntilDue <= 7) return "bg-orange-100 text-orange-800";
  if (daysUntilDue <= 14) return "bg-yellow-100 text-yellow-800";
  return "bg-blue-100 text-blue-800";
}

function getStatusText(status: string, dueDate: Date) {
  if (status === "COMPLETED") return "Completed";
  if (status === "OVERDUE") return "Overdue";

  const daysUntilDue = differenceInDays(dueDate, new Date());
  if (daysUntilDue === 0) return "Due Today";
  if (daysUntilDue === 1) return "Due Tomorrow";
  if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
  return `Due ${format(dueDate, "MMM d")}`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const stats = await getDashboardStats(houseIds);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back, {session.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Clients
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-slate-500">Active service recipients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Employees
            </CardTitle>
            <UserCog className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-slate-500">Active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Overdue Items
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overdueItems}</div>
            <p className="text-xs text-slate-500">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Compliance Rate
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.complianceRate}%</div>
            <p className="text-xs text-slate-500">Items completed on time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Houses</p>
                <p className="text-2xl font-bold">{stats.totalHouses}</p>
              </div>
              <Home className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Due This Week</p>
                <p className="text-2xl font-bold">{stats.upcomingItems}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-2xl font-bold">{stats.completedItems}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Compliance Items */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>
            Compliance items requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="space-y-3">
                {stats.recentItems.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No upcoming deadlines. Great job staying on top of compliance!
                  </p>
                ) : (
                  stats.recentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-slate-500">
                          {item.client
                            ? `${item.client.firstName} ${item.client.lastName} - ${item.client.house.name}`
                            : item.employee
                            ? `${item.employee.firstName} ${item.employee.lastName}`
                            : "Unknown"}
                        </p>
                        {item.statuteRef && (
                          <p className="text-xs text-slate-400">{item.statuteRef}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(item.status, item.dueDate)}>
                          {getStatusText(item.status, item.dueDate)}
                        </Badge>
                        <Link
                          href={
                            item.client
                              ? `/dashboard/clients/${item.client.id}`
                              : `/dashboard/employees/${item.employee?.id}`
                          }
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="clients" className="mt-4">
              <div className="space-y-3">
                {stats.recentItems
                  .filter((item) => item.entityType === "CLIENT")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-slate-500">
                          {item.client
                            ? `${item.client.firstName} ${item.client.lastName} - ${item.client.house.name}`
                            : "Unknown"}
                        </p>
                      </div>
                      <Badge className={getStatusColor(item.status, item.dueDate)}>
                        {getStatusText(item.status, item.dueDate)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="employees" className="mt-4">
              <div className="space-y-3">
                {stats.recentItems
                  .filter((item) => item.entityType === "EMPLOYEE")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-slate-500">
                          {item.employee
                            ? `${item.employee.firstName} ${item.employee.lastName}`
                            : "Unknown"}
                        </p>
                      </div>
                      <Badge className={getStatusColor(item.status, item.dueDate)}>
                        {getStatusText(item.status, item.dueDate)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
