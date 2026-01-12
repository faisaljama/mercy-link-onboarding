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
import {
  Plus,
  Home,
  Users,
  UserCog,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

async function getHouses(houseIds: string[]) {
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    include: {
      clients: {
        where: { status: "ACTIVE" },
        include: {
          _count: {
            select: {
              complianceItems: {
                where: { status: "OVERDUE" },
              },
            },
          },
        },
      },
      employees: {
        include: {
          employee: {
            include: {
              _count: {
                select: {
                  complianceItems: {
                    where: { status: "OVERDUE" },
                  },
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          clients: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return houses;
}

function getComplianceStatus(overdueCount: number) {
  if (overdueCount > 0) {
    return {
      label: `${overdueCount} Overdue`,
      color: "bg-red-100 text-red-800",
      icon: AlertTriangle,
    };
  }
  return {
    label: "Compliant",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  };
}

export default async function HousesPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const houses = await getHouses(houseIds);

  // Calculate stats
  const totalClients = houses.reduce((acc, h) => acc + h._count.clients, 0);
  const totalEmployees = houses.reduce((acc, h) => acc + h.employees.length, 0);
  const totalOverdue = houses.reduce((acc, h) => {
    const clientOverdue = h.clients.reduce(
      (a, c) => a + c._count.complianceItems,
      0
    );
    const employeeOverdue = h.employees.reduce(
      (a, e) => a + e.employee._count.complianceItems,
      0
    );
    return acc + clientOverdue + employeeOverdue;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Houses</h1>
          <p className="text-slate-500">
            Manage Community Residential Settings (CRS)
          </p>
        </div>
        {session.role === "ADMIN" && (
          <Link href="/dashboard/houses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add House
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Houses</p>
                <p className="text-2xl font-bold">{houses.length}</p>
              </div>
              <Home className="h-8 w-8 text-blue-200" />
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
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Staff Assigned</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
              <UserCog className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue Items</p>
                <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Houses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {houses.map((house) => {
          const clientOverdue = house.clients.reduce(
            (a, c) => a + c._count.complianceItems,
            0
          );
          const employeeOverdue = house.employees.reduce(
            (a, e) => a + e.employee._count.complianceItems,
            0
          );
          const totalHouseOverdue = clientOverdue + employeeOverdue;
          const status = getComplianceStatus(totalHouseOverdue);
          const StatusIcon = status.icon;

          return (
            <Link key={house.id} href={`/dashboard/houses/${house.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Home className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{house.name}</CardTitle>
                        <p className="text-xs text-slate-500">{house.county} County</p>
                      </div>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{house.address}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{house._count.clients}</p>
                        <p className="text-xs text-slate-500">Clients</p>
                      </div>
                      <div className="text-center border-x">
                        <p className="text-lg font-semibold">{house.employees.length}</p>
                        <p className="text-xs text-slate-500">Staff</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{house.capacity}</p>
                        <p className="text-xs text-slate-500">Capacity</p>
                      </div>
                    </div>

                    {house.licenseNumber && (
                      <p className="text-xs text-slate-400 pt-2 border-t">
                        License: {house.licenseNumber}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {houses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Home className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p>No houses found</p>
            {session.role === "ADMIN" && (
              <Link href="/dashboard/houses/new">
                <Button className="mt-4">Add Your First House</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
