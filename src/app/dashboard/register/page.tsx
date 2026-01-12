import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  FileText,
  AlertCircle,
} from "lucide-react";
import { subMonths } from "date-fns";
import { AddEntryDialog } from "./add-entry-dialog";
import { RegisterTable } from "./register-tables";
import { PrintRegisterButton } from "./print-register";

async function getRegisterData(houseIds: string[]) {
  // Get all entries for stats
  const allEntries = await prisma.admissionDischarge.findMany({
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
    orderBy: { date: "asc" }, // Chronological order - earliest first
  });

  // Six months ago for discharge filtering
  const sixMonthsAgo = subMonths(new Date(), 6);

  // Separate admissions and discharges
  // Admissions include: ADMISSION, TRANSFER_IN
  const admissions = allEntries.filter(
    (e) => e.type === "ADMISSION" || e.type === "TRANSFER_IN"
  );

  // Discharges include: DISCHARGE, TRANSFER_OUT
  // Only show discharges from the last 6 months (245D requirement)
  const discharges = allEntries.filter(
    (e) =>
      (e.type === "DISCHARGE" || e.type === "TRANSFER_OUT") &&
      new Date(e.date) >= sixMonthsAgo
  );

  // All-time discharges for stats
  const allDischarges = allEntries.filter(
    (e) => e.type === "DISCHARGE" || e.type === "TRANSFER_OUT"
  );

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

  return { admissions, discharges, allDischarges, clients, houses };
}

export default async function AdmissionDischargeRegisterPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const { admissions, discharges, allDischarges, clients, houses } = await getRegisterData(houseIds);

  // Stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const admissionsThisMonth = admissions.filter(
    (e) => e.type === "ADMISSION" && new Date(e.date) >= thisMonth
  ).length;
  const dischargesThisMonth = allDischarges.filter(
    (e) => e.type === "DISCHARGE" && new Date(e.date) >= thisMonth
  ).length;
  const transfersThisMonth = [...admissions, ...allDischarges].filter(
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
        <div className="flex gap-2">
          <PrintRegisterButton admissions={admissions} discharges={discharges} />
          <AddEntryDialog clients={clients} houses={houses} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Admissions</p>
                <p className="text-2xl font-bold">{admissions.filter(e => e.type === "ADMISSION").length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-200" />
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

      {/* Admission Register */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <CardTitle>Admission Register</CardTitle>
          </div>
          <CardDescription>
            All client admissions and transfers in, sorted chronologically (earliest to latest)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterTable entries={admissions} />
        </CardContent>
      </Card>

      {/* Discharge Register */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-600" />
              <div>
                <CardTitle>Discharge Register</CardTitle>
                <CardDescription>
                  Client discharges and transfers out from the last 6 months (per 245D requirements)
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              6-Month Retention
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {discharges.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>No discharges in the last 6 months</p>
            </div>
          ) : (
            <RegisterTable entries={discharges} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
