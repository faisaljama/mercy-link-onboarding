import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DollarSign,
  Calendar,
  Home,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { NewPaymentDialog } from "./new-payment-dialog";
import { NewReconciliationDialog } from "./new-reconciliation-dialog";
import { ReconciliationFilters } from "./reconciliation-filters";

const ALLOWED_ROLES = ["ADMIN", "FINANCE"];

async function getReconciliationData(houseIds: string[], houseFilter?: string, year?: string) {
  const currentYear = year ? parseInt(year) : new Date().getFullYear();

  // Get payments
  const paymentWhere: Record<string, unknown> = {
    OR: [
      { houseId: { in: houseIds } },
      { houseId: null },
    ],
    paymentDate: {
      gte: new Date(currentYear, 0, 1),
      lte: new Date(currentYear, 11, 31),
    },
  };

  const payments = await prisma.paymentReceipt.findMany({
    where: paymentWhere,
    include: {
      house: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
  });

  // Get reconciliations
  const reconciliationWhere: Record<string, unknown> = {
    houseId: { in: houseIds },
    periodStart: {
      gte: new Date(currentYear, 0, 1),
      lte: new Date(currentYear, 11, 31),
    },
  };

  if (houseFilter && houseIds.includes(houseFilter)) {
    reconciliationWhere.houseId = houseFilter;
  }

  const reconciliations = await prisma.periodReconciliation.findMany({
    where: reconciliationWhere,
    include: {
      house: { select: { id: true, name: true } },
      paymentReceipt: {
        select: {
          id: true,
          paymentNumber: true,
          paymentDate: true,
          totalAmount: true,
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ house: { name: "asc" } }, { periodStart: "desc" }],
  });

  // Get houses
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    orderBy: { name: "asc" },
  });

  // Calculate stats
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const totalBilled = reconciliations.reduce((sum, r) => sum + Number(r.billedAmount), 0);
  const totalPaid = reconciliations.reduce((sum, r) => sum + Number(r.paidAmount), 0);
  const totalPending = reconciliations.reduce((sum, r) => sum + Number(r.pendingAmount), 0);

  // Group reconciliations by house for summary
  const houseSummaries = houses.map((house) => {
    const houseReconciliations = reconciliations.filter((r) => r.houseId === house.id);
    return {
      house,
      totalBilled: houseReconciliations.reduce((sum, r) => sum + Number(r.billedAmount), 0),
      totalPaid: houseReconciliations.reduce((sum, r) => sum + Number(r.paidAmount), 0),
      totalPending: houseReconciliations.reduce((sum, r) => sum + Number(r.pendingAmount), 0),
      periods: houseReconciliations.length,
    };
  });

  return {
    payments,
    reconciliations,
    houses,
    houseSummaries,
    stats: {
      totalPayments,
      totalBilled,
      totalPaid,
      totalPending,
      paymentCount: payments.length,
      pendingPeriods: reconciliations.filter((r) => r.status === "PENDING").length,
    },
    currentYear,
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
    case "PAID":
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      );
    case "PARTIAL":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Partial
        </Badge>
      );
    case "ISSUE":
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Issue
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-100 text-slate-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ houseId?: string; year?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!ALLOWED_ROLES.includes(session.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { payments, reconciliations, houses, houseSummaries, stats, currentYear } =
    await getReconciliationData(houseIds, params.houseId, params.year);

  const activeTab = params.tab || "overview";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payment Reconciliation</h1>
          <p className="text-slate-500">
            Track billing vs payments by period and house for {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewPaymentDialog houses={houses} />
          <NewReconciliationDialog
            houses={houses}
            payments={payments.map((p) => ({
              id: p.id,
              paymentNumber: p.paymentNumber,
              paymentDate: p.paymentDate.toISOString(),
              totalAmount: p.totalAmount,
            }))}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Payments Received</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalPayments)}
                </p>
                <p className="text-xs text-slate-400">{stats.paymentCount} payments</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Billed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalBilled)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalPaid)}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-xs text-slate-400">{stats.pendingPeriods} periods</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ReconciliationFilters
        houses={houses}
        currentHouseId={params.houseId}
        currentYear={currentYear.toString()}
      />

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview by House</TabsTrigger>
          <TabsTrigger value="payments">Payment Ledger</TabsTrigger>
          <TabsTrigger value="periods">Period Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Summary by House</CardTitle>
              <CardDescription>
                Year-to-date billing and payment summary for {currentYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead className="text-center">Periods</TableHead>
                    <TableHead className="text-right">Total Billed</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {houseSummaries.map(({ house, totalBilled, totalPaid, totalPending, periods }) => (
                    <TableRow key={house.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{house.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{periods}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalBilled)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(totalPaid)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(totalPending)}
                      </TableCell>
                      <TableCell className="text-center">
                        {totalPending === 0 && totalBilled > 0 ? (
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        ) : totalPending > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-800">No Data</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-slate-50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">
                      {houseSummaries.reduce((sum, h) => sum + h.periods, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(stats.totalBilled)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(stats.totalPaid)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(stats.totalPending)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Ledger</CardTitle>
              <CardDescription>
                All payments received for {currentYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No payments recorded</p>
                  <p className="text-sm">Add a new payment to start tracking</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Check/EFT #</TableHead>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Customized Living</TableHead>
                      <TableHead className="text-right">PCA</TableHead>
                      <TableHead className="text-right">ICS</TableHead>
                      <TableHead className="text-right">Other</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>House</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.paymentNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {format(new Date(payment.paymentDate), "M/d/yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.paymentType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(payment.paidCustomizedLiving) > 0
                            ? formatCurrency(Number(payment.paidCustomizedLiving))
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(payment.paidPCA) > 0
                            ? formatCurrency(Number(payment.paidPCA))
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(payment.paidICS) > 0
                            ? formatCurrency(Number(payment.paidICS))
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(payment.paidOther) > 0
                            ? formatCurrency(Number(payment.paidOther))
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(Number(payment.totalAmount))}
                        </TableCell>
                        <TableCell>
                          {payment.house ? (
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-slate-400" />
                              {payment.house.name}
                            </div>
                          ) : (
                            <span className="text-slate-400">All Houses</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {payment.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-slate-50 font-semibold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          payments.reduce((sum, p) => sum + Number(p.paidCustomizedLiving), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          payments.reduce((sum, p) => sum + Number(p.paidPCA), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          payments.reduce((sum, p) => sum + Number(p.paidICS), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          payments.reduce((sum, p) => sum + Number(p.paidOther), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(stats.totalPayments)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Period Details Tab */}
        <TabsContent value="periods">
          <Card>
            <CardHeader>
              <CardTitle>Period Reconciliation Details</CardTitle>
              <CardDescription>
                Billing vs payment details by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reconciliations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No reconciliation entries</p>
                  <p className="text-sm">Add a new period reconciliation to start tracking</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>House</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-center">Units</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Ref</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliations.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{rec.house.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {formatPeriod(rec.periodStart, rec.periodEnd)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rec.serviceType}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{rec.billedUnits}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(rec.billedAmount))}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(Number(rec.paidAmount))}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(Number(rec.pendingAmount))}
                        </TableCell>
                        <TableCell>{getStatusBadge(rec.status)}</TableCell>
                        <TableCell>
                          {rec.paymentReceipt ? (
                            <span className="text-sm text-blue-600">
                              {rec.paymentReceipt.paymentNumber || "Payment"}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {rec.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
