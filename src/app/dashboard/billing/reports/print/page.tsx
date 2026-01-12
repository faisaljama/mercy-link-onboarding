import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

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
    orderBy: [{ dateProcessed: "asc" }],
  });

  return reports;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function BillingReportsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const month = params.month ? parseInt(params.month) : undefined;
  const year = params.year ? parseInt(params.year) : undefined;

  const reports = await getBillingReports(month, year);

  const printDate = format(new Date(), "MMMM d, yyyy");

  // Calculate totals
  const grandTotal = reports.reduce(
    (sum, r) => sum + Number(r.totalCharges),
    0
  );

  const totalClaims = reports.reduce((sum, r) => sum + r.totalClaims, 0);

  // Determine period label
  let periodLabel = "All Time";
  if (month && year) {
    periodLabel = `${MONTHS[month - 1]} ${year}`;
  } else if (month) {
    periodLabel = MONTHS[month - 1];
  } else if (year) {
    periodLabel = String(year);
  }

  return (
    <>
      <style>
        {`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .no-print { display: none !important; }
            .print-page {
              page-break-after: always;
            }
            .print-page:last-child { page-break-after: avoid; }
            @page {
              size: landscape;
              margin: 0.5in;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-white">
        {/* Print Controls */}
        <div className="no-print sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl font-bold">Billing Reports Summary</h1>
            <p className="text-sm text-slate-500">
              {reports.length} report{reports.length !== 1 ? "s" : ""} | {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/billing/reports"
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
            >
              Back to Reports
            </a>
            <PrintButton />
          </div>
        </div>

        {/* Print Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold mb-1">MERCY LINK 245D SERVICES</h1>
            <h2 className="text-xl font-semibold mb-1">Billing Reports Summary</h2>
            <h3 className="text-lg">{periodLabel}</h3>
            <p className="text-sm text-slate-600 mt-2">Generated: {printDate}</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Reports</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Claims</p>
              <p className="text-2xl font-bold">{totalClaims}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Charges</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>

          {/* Reports Table */}
          {reports.length > 0 ? (
            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black px-3 py-2 text-left font-bold">Date Processed</th>
                  <th className="border border-black px-3 py-2 text-left font-bold">Service Period</th>
                  <th className="border border-black px-3 py-2 text-center font-bold">Billing Cycle</th>
                  <th className="border border-black px-3 py-2 text-right font-bold">Claims</th>
                  <th className="border border-black px-3 py-2 text-right font-bold">Total Charges</th>
                  <th className="border border-black px-3 py-2 text-center font-bold">EFT Date</th>
                  <th className="border border-black px-3 py-2 text-center font-bold">Status</th>
                  <th className="border border-black px-3 py-2 text-left font-bold">Submitted By</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="border border-black px-3 py-2">
                      {format(new Date(report.dateProcessed), "MM/dd/yyyy")}
                    </td>
                    <td className="border border-black px-3 py-2">
                      {format(new Date(report.serviceDateStart), "MM/dd/yyyy")} -{" "}
                      {format(new Date(report.serviceDateEnd), "MM/dd/yyyy")}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {report.billingCycle || "-"}
                    </td>
                    <td className="border border-black px-3 py-2 text-right">
                      {report.totalClaims}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-bold text-green-600">
                      {formatCurrency(Number(report.totalCharges))}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {report.eftPaymentDate
                        ? format(new Date(report.eftPaymentDate), "MM/dd/yyyy")
                        : "-"}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          report.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : report.status === "PARTIAL"
                            ? "bg-yellow-100 text-yellow-800"
                            : report.status === "ISSUE"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="border border-black px-3 py-2">
                      {report.createdBy.name}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-yellow-100 font-bold">
                  <td colSpan={3} className="border border-black px-3 py-2 text-right">
                    Totals:
                  </td>
                  <td className="border border-black px-3 py-2 text-right">
                    {totalClaims}
                  </td>
                  <td className="border border-black px-3 py-2 text-right text-green-600">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td colSpan={3} className="border border-black px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>No billing reports found for this period.</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-sm text-slate-500">
            <p>Mercy Link 245D Services - Confidential Billing Report</p>
            <p>Generated by {session.name} on {printDate}</p>
          </div>
        </div>
      </div>
    </>
  );
}
