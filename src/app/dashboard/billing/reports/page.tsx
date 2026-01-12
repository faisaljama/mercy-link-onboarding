import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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
  TrendingUp,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { NewBillingReportDialog } from "./new-billing-report-dialog";
import { BillingReportsFilters } from "./billing-reports-filters";
import { BillingReportsPrintSelector } from "./billing-reports-print-selector";

async function getBillingReports(month?: number, year?: number) {
  const where: Record<string, unknown> = {};

  if (month) {
    where.month = month;
  }

  if (year) {
    where.year = year;
  }

  const reports = await prisma.billingReport.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      entries: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ dateProcessed: "desc" }],
  });

  // Get houses for the form
  const houses = await prisma.house.findMany({
    orderBy: { name: "asc" },
  });

  // Get summary stats
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const yearlyTotal = await prisma.billingReport.aggregate({
    where: { year: currentYear },
    _sum: { totalCharges: true },
    _count: true,
  });

  const monthlyTotal = await prisma.billingReport.aggregate({
    where: { month: currentMonth, year: currentYear },
    _sum: { totalCharges: true },
    _count: true,
  });

  return {
    reports,
    houses,
    stats: {
      yearlyTotal: Number(yearlyTotal._sum.totalCharges || 0),
      yearlyCount: yearlyTotal._count,
      monthlyTotal: Number(monthlyTotal._sum.totalCharges || 0),
      monthlyCount: monthlyTotal._count,
    },
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
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
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="mr-1 h-3 w-3" />
          Submitted
        </Badge>
      );
  }
}

export default async function BillingReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const month = params.month ? parseInt(params.month) : undefined;
  const year = params.year ? parseInt(params.year) : undefined;

  const { reports, houses, stats } = await getBillingReports(month, year);

  const currentYear = new Date().getFullYear();

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
          <h1 className="text-3xl font-bold text-slate-900">Billing Reports</h1>
          <p className="text-slate-500">
            Submit and track billing reports after processing claims
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BillingReportsPrintSelector />
          <NewBillingReportDialog houses={houses} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.monthlyTotal)}
                </p>
                <p className="text-xs text-slate-400">
                  {stats.monthlyCount} report{stats.monthlyCount !== 1 ? "s" : ""}
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
                <p className="text-sm text-slate-500">Year to Date ({currentYear})</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.yearlyTotal)}
                </p>
                <p className="text-xs text-slate-400">
                  {stats.yearlyCount} report{stats.yearlyCount !== 1 ? "s" : ""}
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
                <p className="text-sm text-slate-500">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-xs text-slate-400">
                  {month
                    ? `${new Date(2026, month - 1).toLocaleString("default", { month: "long" })}`
                    : "All time"}
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
                <p className="text-sm text-slate-500">Pending Payment</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reports.filter((r) => r.status === "SUBMITTED").length}
                </p>
                <p className="text-xs text-slate-400">Awaiting EFT</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <BillingReportsFilters
        currentMonth={month}
        currentYear={year}
      />

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Reports</CardTitle>
          <CardDescription>
            {month && year
              ? `Showing reports for ${new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}`
              : month
              ? `Showing reports for ${new Date(2026, month - 1).toLocaleString("default", { month: "long" })}`
              : year
              ? `Showing reports for ${year}`
              : "All billing reports"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No billing reports found</p>
              <p className="text-sm">Submit a new billing report after processing claims</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Processed</TableHead>
                  <TableHead>Service Period</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead className="text-right">Total Claims</TableHead>
                  <TableHead className="text-right">Total Charges</TableHead>
                  <TableHead>EFT Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(report.dateProcessed), "MM/dd/yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {format(new Date(report.serviceDateStart), "MM/dd/yyyy")} -{" "}
                        {format(new Date(report.serviceDateEnd), "MM/dd/yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {report.billingCycle ? (
                        <Badge variant="outline">Cycle {report.billingCycle}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {report.totalClaims}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(Number(report.totalCharges))}
                    </TableCell>
                    <TableCell>
                      {report.eftPaymentDate ? (
                        <span className="text-sm">
                          {format(new Date(report.eftPaymentDate), "MM/dd/yyyy")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {report.createdBy.name}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/billing/reports/${report.id}`}
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
