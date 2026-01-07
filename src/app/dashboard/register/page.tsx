import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Calendar,
  Home,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { AddEntryDialog } from "./add-entry-dialog";

async function getRegisterData(houseIds: string[]) {
  const entries = await prisma.admissionDischarge.findMany({
    where: {
      client: {
        houseId: { in: houseIds },
      },
    },
    include: {
      client: {
        include: {
          house: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
    },
    include: {
      house: true,
    },
    orderBy: { lastName: "asc" },
  });

  const houses = await prisma.house.findMany({
    where: {
      id: { in: houseIds },
    },
    orderBy: { name: "asc" },
  });

  return { entries, clients, houses };
}

function getTypeIcon(type: string) {
  switch (type) {
    case "ADMISSION":
      return <UserPlus className="h-4 w-4 text-green-600" />;
    case "DISCHARGE":
      return <UserMinus className="h-4 w-4 text-red-600" />;
    case "TRANSFER_IN":
      return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    case "TRANSFER_OUT":
      return <ArrowRightLeft className="h-4 w-4 text-orange-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-600" />;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case "ADMISSION":
      return <Badge className="bg-green-100 text-green-800">Admission</Badge>;
    case "DISCHARGE":
      return <Badge className="bg-red-100 text-red-800">Discharge</Badge>;
    case "TRANSFER_IN":
      return <Badge className="bg-blue-100 text-blue-800">Transfer In</Badge>;
    case "TRANSFER_OUT":
      return <Badge className="bg-orange-100 text-orange-800">Transfer Out</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getDischargeTypeBadge(type: string | null) {
  if (!type) return null;

  switch (type) {
    case "PLANNED":
      return <Badge variant="outline" className="text-xs">Planned</Badge>;
    case "UNPLANNED":
      return <Badge variant="outline" className="text-xs text-orange-600">Unplanned</Badge>;
    case "EMERGENCY":
      return <Badge variant="outline" className="text-xs text-red-600">Emergency</Badge>;
    case "DEATH":
      return <Badge variant="outline" className="text-xs text-slate-600">Death</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{type}</Badge>;
  }
}

export default async function AdmissionDischargeRegisterPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const { entries, clients, houses } = await getRegisterData(houseIds);

  // Stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const admissionsThisMonth = entries.filter(
    (e) => e.type === "ADMISSION" && new Date(e.date) >= thisMonth
  ).length;
  const dischargesThisMonth = entries.filter(
    (e) => e.type === "DISCHARGE" && new Date(e.date) >= thisMonth
  ).length;
  const transfersThisMonth = entries.filter(
    (e) => (e.type === "TRANSFER_IN" || e.type === "TRANSFER_OUT") && new Date(e.date) >= thisMonth
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admission/Discharge Register</h1>
          <p className="text-slate-500">
            Track all client admissions, discharges, and transfers per 245D requirements
          </p>
        </div>
        <AddEntryDialog clients={clients} houses={houses} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Entries</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Admissions (This Month)</p>
                <p className="text-2xl font-bold text-green-600">{admissionsThisMonth}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Discharges (This Month)</p>
                <p className="text-2xl font-bold text-red-600">{dischargesThisMonth}</p>
              </div>
              <UserMinus className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Transfers (This Month)</p>
                <p className="text-2xl font-bold text-blue-600">{transfersThisMonth}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Register Table */}
      <Card>
        <CardHeader>
          <CardTitle>Register Entries</CardTitle>
          <CardDescription>
            Complete log of all admission and discharge events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No register entries yet</p>
              <p className="text-sm">Add an entry to start tracking admissions and discharges</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(entry.type)}
                        {getTypeBadge(entry.type)}
                        {entry.dischargeType && getDischargeTypeBadge(entry.dischargeType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/clients/${entry.client.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {entry.client.firstName} {entry.client.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-slate-400" />
                        {entry.client.house.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {entry.type === "ADMISSION" && entry.fromLocation && (
                          <span>From: {entry.fromLocation}</span>
                        )}
                        {entry.type === "DISCHARGE" && entry.toLocation && (
                          <span>To: {entry.toLocation}</span>
                        )}
                        {(entry.type === "TRANSFER_IN" || entry.type === "TRANSFER_OUT") && (
                          <>
                            {entry.fromLocation && <span>From: {entry.fromLocation}</span>}
                            {entry.fromLocation && entry.toLocation && <span> → </span>}
                            {entry.toLocation && <span>To: {entry.toLocation}</span>}
                          </>
                        )}
                        {entry.reason && (
                          <div className="text-xs text-slate-500 mt-1">
                            Reason: {entry.reason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500 max-w-[200px] truncate block">
                        {entry.notes || "—"}
                      </span>
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
