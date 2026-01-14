"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  User,
  Shield,
  UserCog,
  Briefcase,
  Mail,
} from "lucide-react";

interface House {
  id: string;
  name: string;
  address: string;
  assignedUsers: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }[];
  employees: {
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      position: string;
    };
  }[];
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrator", color: "bg-red-100 text-red-700" },
  DESIGNATED_MANAGER: { label: "Designated Manager", color: "bg-indigo-100 text-indigo-700" },
  DESIGNATED_COORDINATOR: { label: "Designated Coordinator", color: "bg-blue-100 text-blue-700" },
  HR: { label: "HR", color: "bg-pink-100 text-pink-700" },
  OPERATIONS: { label: "Operations", color: "bg-orange-100 text-orange-700" },
  FINANCE: { label: "Finance", color: "bg-emerald-100 text-emerald-700" },
  DSP: { label: "DSP", color: "bg-green-100 text-green-700" },
};

const POSITION_CONFIG: Record<string, { label: string; color: string }> = {
  DSP: { label: "DSP", color: "bg-slate-100 text-slate-700" },
  LEAD_DSP: { label: "Lead DSP", color: "bg-emerald-100 text-emerald-700" },
  DC: { label: "DC", color: "bg-blue-100 text-blue-700" },
  DM: { label: "DM", color: "bg-purple-100 text-purple-700" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamSection({ houses }: { houses: House[] }) {
  // Get unique coordinators and their houses
  const coordinatorMap = new Map<string, { user: House["assignedUsers"][0]["user"]; houses: string[] }>();

  houses.forEach((house) => {
    house.assignedUsers.forEach((au) => {
      if (au.user.role === "DESIGNATED_COORDINATOR" || au.user.role === "ADMIN") {
        if (!coordinatorMap.has(au.user.id)) {
          coordinatorMap.set(au.user.id, { user: au.user, houses: [] });
        }
        coordinatorMap.get(au.user.id)!.houses.push(house.name);
      }
    });
  });

  const coordinators = Array.from(coordinatorMap.values());

  return (
    <div className="space-y-6">
      {/* Coordinators Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Designated Coordinators</CardTitle>
              <CardDescription>Staff members responsible for house oversight</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {coordinators.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coordinators.map((coord) => (
                <div
                  key={coord.user.id}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-slate-50"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(coord.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{coord.user.name}</p>
                    <Badge className={ROLE_CONFIG[coord.user.role]?.color || "bg-slate-100"}>
                      {ROLE_CONFIG[coord.user.role]?.label || coord.user.role}
                    </Badge>
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1">Assigned Houses:</p>
                      <div className="flex flex-wrap gap-1">
                        {coord.houses.map((house) => (
                          <Badge key={house} variant="outline" className="text-xs">
                            {house}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
                      <Mail className="h-3 w-3" />
                      <span className="text-xs">{coord.user.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <UserCog className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p>No coordinators assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* House-by-House Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Team by House</h2>
        {houses.map((house) => (
          <Card key={house.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Home className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{house.name}</CardTitle>
                  <CardDescription className="text-xs">{house.address}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Assigned Users (Coordinators/Admins) */}
                {house.assignedUsers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Coordinators
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {house.assignedUsers.map((au) => (
                        <div
                          key={au.user.id}
                          className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-600 text-white">
                              {getInitials(au.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{au.user.name}</span>
                          <Badge className={`text-xs ${ROLE_CONFIG[au.user.role]?.color}`}>
                            {au.user.role === "DESIGNATED_COORDINATOR" ? "DC" : au.user.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employees */}
                {house.employees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      Staff ({house.employees.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {house.employees.map((emp) => (
                          <TableRow key={emp.employee.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-slate-200">
                                    {getInitials(`${emp.employee.firstName} ${emp.employee.lastName}`)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {emp.employee.firstName} {emp.employee.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  POSITION_CONFIG[emp.employee.position]?.color || "bg-slate-100"
                                }
                              >
                                {POSITION_CONFIG[emp.employee.position]?.label || emp.employee.position}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {house.assignedUsers.length === 0 && house.employees.length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <User className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                    <p className="text-sm">No team members assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {houses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <Home className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p>No houses available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
