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
  FileText,
  Calendar,
  DollarSign,
  Home,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ClipboardList,
  Users,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { NewAgreementDialog } from "./new-agreement-dialog";
import { BillingFilters } from "./billing-filters";
import { PrintSelector } from "./print-selector";

async function getBillingData(houseIds: string[], houseFilter?: string, showExpiring?: boolean) {
  const where: Record<string, unknown> = {
    houseId: { in: houseIds },
  };

  if (houseFilter) {
    where.houseId = houseFilter;
  }

  // Get agreements expiring within 45 days if filter is set
  if (showExpiring) {
    const today = new Date();
    const in45Days = new Date();
    in45Days.setDate(today.getDate() + 45);
    where.endDate = {
      gte: today,
      lte: in45Days,
    };
    where.status = "ACTIVE";
  }

  const agreements = await prisma.serviceAgreement.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      house: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ endDate: "asc" }],
  });

  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    orderBy: { name: "asc" },
  });

  const clients = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    include: { house: true },
    orderBy: [{ lastName: "asc" }],
  });

  // Calculate billing summary by house for active agreements only
  const activeAgreements = agreements.filter((a) => a.status === "ACTIVE");

  const houseSummaries = houses.map((house) => {
    const houseAgreements = activeAgreements.filter((a) => a.houseId === house.id);
    const totalDailyRate = houseAgreements.reduce(
      (sum, a) => sum + Number(a.dailyRate),
      0
    );

    return {
      house,
      agreementCount: houseAgreements.length,
      totalDailyRate,
      totalMonthlyRate: totalDailyRate * 30,
      totalYearlyRate: totalDailyRate * 365,
    };
  });

  // Overall totals (from all active agreements, not just filtered)
  const allActiveAgreements = await prisma.serviceAgreement.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
  });

  const overallDailyTotal = allActiveAgreements.reduce(
    (sum, a) => sum + Number(a.dailyRate),
    0
  );

  // Count expiring within 45 days
  const today = new Date();
  const in45Days = new Date();
  in45Days.setDate(today.getDate() + 45);
  const expiringCount = allActiveAgreements.filter((a) => {
    const endDate = new Date(a.endDate);
    return endDate >= today && endDate <= in45Days;
  }).length;

  return {
    agreements,
    houses,
    clients,
    houseSummaries,
    totals: {
      daily: overallDailyTotal,
      monthly: overallDailyTotal * 30,
      yearly: overallDailyTotal * 365,
      activeCount: allActiveAgreements.length,
      expiringCount,
    },
  };
}

function getStatusBadge(status: string, endDate: Date) {
  const today = new Date();
  const daysUntilEnd = differenceInDays(new Date(endDate), today);

  if (status === "EXPIRED") {
    return (
      <Badge className="bg-slate-100 text-slate-800">
        <Clock className="mr-1 h-3 w-3" />
        Expired
      </Badge>
    );
  }

  if (status === "TERMINATED") {
    return (
      <Badge className="bg-red-100 text-red-800">
        Terminated
      </Badge>
    );
  }

  if (status === "PENDING") {
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Clock className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    );
  }

  // Active - check if expiring soon
  if (daysUntilEnd <= 45 && daysUntilEnd >= 0) {
    return (
      <Badge className="bg-orange-100 text-orange-800">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Expires in {daysUntilEnd} days
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      Active
    </Badge>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ houseId?: string; expiring?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { agreements, houses, clients, houseSummaries, totals } = await getBillingData(
    houseIds,
    params.houseId,
    params.expiring === "true"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-500">
            Manage service agreements and track billing rates by home
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/billing/attendance">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Attendance
            </Button>
          </Link>
          <Link href="/dashboard/billing/reports">
            <Button variant="outline">
              <ClipboardList className="mr-2 h-4 w-4" />
              Billing Reports
            </Button>
          </Link>
          <Link href="/dashboard/billing/accounts-receivable">
            <Button variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Accounts Receivable
            </Button>
          </Link>
          <Link href="/dashboard/billing/reconciliation">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Reconciliation
            </Button>
          </Link>
          <PrintSelector houses={houses} />
          <NewAgreementDialog houses={houses} clients={clients} />
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Daily Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.daily)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Monthly Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totals.monthly)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Yearly Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totals.yearly)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totals.expiringCount}
                </p>
                <p className="text-xs text-slate-400">within 45 days</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Summary by House */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Summary by House</CardTitle>
          <CardDescription>
            Daily rates aggregated by house for active service agreements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>House</TableHead>
                <TableHead className="text-center">Active Agreements</TableHead>
                <TableHead className="text-right">Daily Rate</TableHead>
                <TableHead className="text-right">Monthly (30 days)</TableHead>
                <TableHead className="text-right">Yearly (365 days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {houseSummaries.map(({ house, agreementCount, totalDailyRate, totalMonthlyRate, totalYearlyRate }) => (
                <TableRow key={house.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{house.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{agreementCount}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(totalDailyRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalMonthlyRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalYearlyRate)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-slate-50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{totals.activeCount}</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(totals.daily)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.monthly)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.yearly)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Filters */}
      <BillingFilters
        houses={houses}
        currentHouseId={params.houseId}
        showExpiring={params.expiring === "true"}
      />

      {/* Service Agreements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Agreements</CardTitle>
          <CardDescription>
            {params.expiring === "true"
              ? "Showing agreements expiring within 45 days"
              : params.houseId
              ? `Filtered by house`
              : "All service agreements"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No service agreements found</p>
              <p className="text-sm">Add a new service agreement to start tracking</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          {agreement.client.firstName} {agreement.client.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-slate-400" />
                        {agreement.house.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{agreement.serviceType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(Number(agreement.dailyRate))}
                    </TableCell>
                    <TableCell>
                      {agreement.units ? Number(agreement.units) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(agreement.startDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(agreement.endDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(agreement.status, agreement.endDate)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/billing/${agreement.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
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
