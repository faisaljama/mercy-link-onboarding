import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  Users,
  UserPlus,
  Shield,
  Home,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteUserButton } from "./delete-user-button";

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      assignedHouses: {
        include: {
          house: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return users;
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800";
    case "DESIGNATED_COORDINATOR":
      return "bg-purple-100 text-purple-800";
    case "DESIGNATED_MANAGER":
      return "bg-indigo-100 text-indigo-800";
    case "HR":
      return "bg-pink-100 text-pink-800";
    case "OPERATIONS":
      return "bg-orange-100 text-orange-800";
    case "FINANCE":
      return "bg-green-100 text-green-800";
    case "DSP":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function formatRole(role: string) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "DESIGNATED_COORDINATOR":
      return "Designated Coordinator";
    case "DESIGNATED_MANAGER":
      return "Designated Manager";
    case "HR":
      return "HR";
    case "OPERATIONS":
      return "Operations";
    case "FINANCE":
      return "Finance";
    case "DSP":
      return "DSP";
    default:
      return role;
  }
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  // Only admins can access settings
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  // Stats
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const dcCount = users.filter((u) => u.role === "DESIGNATED_COORDINATOR").length;
  const dspCount = users.filter((u) => u.role === "DSP").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">
            Manage users and system settings
          </p>
        </div>
        <Link href="/dashboard/settings/users/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Admins</p>
                <p className="text-2xl font-bold">{adminCount}</p>
              </div>
              <Shield className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Coordinators</p>
                <p className="text-2xl font-bold">{dcCount}</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">DSP</p>
                <p className="text-2xl font-bold">{dspCount}</p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts and their house assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Houses</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-600">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === "ADMIN" ? (
                      <span className="text-sm text-slate-500">All houses</span>
                    ) : user.assignedHouses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.assignedHouses.slice(0, 3).map((ah) => (
                          <Badge key={ah.id} variant="outline" className="text-xs">
                            <Home className="mr-1 h-3 w-3" />
                            {ah.house.name}
                          </Badge>
                        ))}
                        {user.assignedHouses.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.assignedHouses.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">None assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Calendar className="h-3 w-3" />
                      {format(user.createdAt, "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/settings/users/${user.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {user.id !== session.id && (
                        <DeleteUserButton userId={user.id} userName={user.name} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
