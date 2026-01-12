import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
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
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteReportButton } from "./delete-report-button";
import { UpdateStatusForm } from "./update-status-form";

async function getReport(id: string) {
  const report = await prisma.billingReport.findUnique({
    where: { id },
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
  });

  return report;
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
          Partial Payment
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

export default async function BillingReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  // Group entries by house
  const entriesByHouse = report.entries.reduce(
    (acc, entry) => {
      if (!acc[entry.houseName]) {
        acc[entry.houseName] = [];
      }
      acc[entry.houseName].push(entry);
      return acc;
    },
    {} as Record<string, typeof report.entries>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Billing Report</h1>
          <p className="text-slate-500">
            Service Period: {format(new Date(report.serviceDateStart), "MM/dd/yyyy")} -{" "}
            {format(new Date(report.serviceDateEnd), "MM/dd/yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          <Link href={`/dashboard/billing/reports/${report.id}/print`}>
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </Link>
          {session.role === "ADMIN" && <DeleteReportButton reportId={report.id} />}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Charges</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(Number(report.totalCharges))}
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
                <p className="text-sm text-slate-500">Total Claims</p>
                <p className="text-2xl font-bold">{report.totalClaims}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Date Processed</p>
                <p className="text-lg font-bold">
                  {format(new Date(report.dateProcessed), "MMM d, yyyy")}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">EFT Payment Date</p>
                <p className="text-lg font-bold">
                  {report.eftPaymentDate
                    ? format(new Date(report.eftPaymentDate), "MMM d, yyyy")
                    : "Not set"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Billing Cycle</p>
                <p className="font-medium">
                  {report.billingCycle ? `Cycle ${report.billingCycle}` : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Claim Cut-Off Date</p>
                <p className="font-medium">
                  {report.claimCutOffDate
                    ? format(new Date(report.claimCutOffDate), "MMM d, yyyy")
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Houses Billed</p>
                <p className="font-medium">{Object.keys(entriesByHouse).length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Entries</p>
                <p className="font-medium">{report.entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submitted By</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{report.createdBy.name}</p>
                <p className="text-sm text-slate-500">
                  {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Status */}
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
          <CardDescription>Mark this report as paid or flag any issues</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateStatusForm reportId={report.id} currentStatus={report.status} notes={report.notes || ""} />
        </CardContent>
      </Card>

      {/* Billing Entries by House */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Entries by House</CardTitle>
          <CardDescription>
            Detailed breakdown of charges per house and client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(entriesByHouse).map(([houseName, entries]) => {
            const houseTotal = entries.reduce(
              (sum, e) => sum + Number(e.totalCharges),
              0
            );

            return (
              <div key={houseName} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-200">
                  <h3 className="text-lg font-bold">{houseName}</h3>
                  <span className="font-bold text-green-600">
                    {formatCurrency(houseTotal)}
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Claims</TableHead>
                      <TableHead className="text-right">Charges</TableHead>
                      <TableHead>Insurance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.clientName || "-"}
                        </TableCell>
                        <TableCell>
                          {entry.entryStatus && entry.entryStatus !== "Billed" ? (
                            <Badge variant="outline" className="text-orange-600">
                              {entry.entryStatus}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              Billed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.totalClaims}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(Number(entry.totalCharges))}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {entry.insuranceProvider || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="mt-6 pt-4 border-t-2 border-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Grand Total</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(report.totalCharges))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">{report.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
