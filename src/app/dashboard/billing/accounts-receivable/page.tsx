import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
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
  DollarSign,
  Calendar,
  Home,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { NewReceivableDialog } from "./new-receivable-dialog";
import { ReceivableActions } from "./receivable-actions";

async function getReceivablesData(houseIds: string[], houseFilter?: string, statusFilter?: string) {
  const where: Record<string, unknown> = {
    houseId: { in: houseIds },
  };

  if (houseFilter) {
    where.houseId = houseFilter;
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  const receivables = await prisma.accountsReceivable.findMany({
    where,
    include: {
      house: {
        select: {
          id: true,
          name: true,
        },
      },
      attendanceReport: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    orderBy: { name: "asc" },
  });

  // Get clients for the dialog
  const clients = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    include: {
      house: true,
      serviceAgreements: {
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }],
  });

  // Calculate summary stats from all receivables (not just filtered)
  const allReceivables = await prisma.accountsReceivable.findMany({
    where: { houseId: { in: houseIds } },
  });

  const pending = allReceivables.filter((r) => r.status === "PENDING");
  const totalOwed = pending.reduce((sum, r) => sum + Number(r.amountOwed), 0);
  const totalDays = pending.reduce((sum, r) => sum + r.daysUnbilled, 0);

  return {
    receivables,
    houses,
    clients,
    stats: {
      totalPending: pending.length,
      totalOwed,
      totalDays,
      collected: allReceivables.filter((r) => r.status === "COLLECTED").length,
      writtenOff: allReceivables.filter((r) => r.status === "WRITTEN_OFF").length,
    },
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPeriod(startDate: Date, endDate: Date): string {
  return `${format(new Date(startDate), "M/d/yy")} - ${format(new Date(endDate), "M/d/yy")}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COLLECTED":
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Collected
        </Badge>
      );
    case "WRITTEN_OFF":
      return (
        <Badge className="bg-slate-100 text-slate-800">
          <XCircle className="mr-1 h-3 w-3" />
          Written Off
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Resolved
        </Badge>
      );
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

function getReasonBadge(reason: string) {
  const reasons: Record<string, { label: string; color: string }> = {
    MISSING_SERVICE_AGREEMENT: { label: "Missing SA", color: "bg-red-100 text-red-800" },
    SERVICE_AGREEMENT_EXPIRED: { label: "SA Expired", color: "bg-orange-100 text-orange-800" },
    SERVICE_AGREEMENT_ISSUE: { label: "SA Issue", color: "bg-yellow-100 text-yellow-800" },
    INSURANCE_ISSUE: { label: "Insurance", color: "bg-purple-100 text-purple-800" },
    OTHER: { label: "Other", color: "bg-slate-100 text-slate-800" },
  };

  const config = reasons[reason] || { label: reason, color: "bg-slate-100 text-slate-800" };
  return <Badge className={config.color}>{config.label}</Badge>;
}

export default async function AccountsReceivablePage({
  searchParams,
}: {
  searchParams: Promise<{ houseId?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { receivables, houses, clients, stats } = await getReceivablesData(
    houseIds,
    params.houseId,
    params.status
  );

  // Transform clients for dialog
  const transformedClients = clients.map((client) => ({
    ...client,
    serviceAgreements: client.serviceAgreements.map((sa) => ({
      ...sa,
      dailyRate: sa.dailyRate ? sa.dailyRate.toString() : null,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing/attendance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Attendance
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Accounts Receivable</h1>
          <p className="text-slate-500">
            Track unbilled amounts by client and billing period
          </p>
        </div>
        <NewReceivableDialog houses={houses} clients={transformedClients} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Items</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Owed</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalOwed)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Unbilled Days</p>
                <p className="text-2xl font-bold">{stats.totalDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Collected</p>
                <p className="text-2xl font-bold text-green-600">{stats.collected}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Receivable Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable</CardTitle>
          <CardDescription>
            Running list of unbilled amounts by client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receivables.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No accounts receivable entries found</p>
              <p className="text-sm">All billing is up to date</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Days</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((receivable) => (
                  <TableRow key={receivable.id}>
                    <TableCell>
                      <span className="font-medium">{receivable.clientName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-slate-400" />
                        {receivable.house.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {formatPeriod(receivable.periodStart, receivable.periodEnd)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getReasonBadge(receivable.reason)}
                    </TableCell>
                    <TableCell className="text-center">
                      {receivable.daysUnbilled}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(Number(receivable.amountOwed))}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(receivable.status)}
                    </TableCell>
                    <TableCell>
                      <ReceivableActions
                        receivableId={receivable.id}
                        currentStatus={receivable.status}
                        isAdmin={session.role === "ADMIN"}
                      />
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
