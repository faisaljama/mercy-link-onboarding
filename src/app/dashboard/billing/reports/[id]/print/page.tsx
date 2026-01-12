import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

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

export default async function BillingReportPrintPage({
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

  const printDate = format(new Date(), "MMMM d, yyyy");
  const servicePeriod = `${format(new Date(report.serviceDateStart), "MM/dd/yyyy")}-${format(new Date(report.serviceDateEnd), "MM/dd/yyyy")}`;

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
            @page {
              size: portrait;
              margin: 0.5in;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-white">
        {/* Print Controls */}
        <div className="no-print sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl font-bold">Billing Report</h1>
            <p className="text-sm text-slate-500">
              Service Period: {servicePeriod}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/dashboard/billing/reports/${report.id}`}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
            >
              Back to Report
            </a>
            <PrintButton />
          </div>
        </div>

        {/* Print Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold mb-1">MERCY LINK 2025</h1>
            <h2 className="text-lg font-semibold">{servicePeriod}</h2>
          </div>

          {/* Table */}
          <table className="w-full text-sm border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black px-3 py-2 text-center font-bold">House</th>
                <th className="border border-black px-3 py-2 text-center font-bold">Date Processed</th>
                <th className="border border-black px-3 py-2 text-center font-bold">Service Date Range</th>
                <th className="border border-black px-3 py-2 text-center font-bold">Total Claims</th>
                <th className="border border-black px-3 py-2 text-center font-bold">Total Charges</th>
                <th className="border border-black px-3 py-2 text-center font-bold">Insurance Provider</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(entriesByHouse).map(([houseName, entries]) => {
                const houseTotal = entries.reduce(
                  (sum, e) => sum + Number(e.totalCharges),
                  0
                );

                return entries.map((entry, entryIndex) => (
                  <tr key={entry.id}>
                    {entryIndex === 0 && (
                      <td
                        className="border border-black px-3 py-2 font-bold text-center align-middle"
                        rowSpan={entries.length}
                      >
                        {houseName}
                      </td>
                    )}
                    <td className="border border-black px-3 py-2 text-center">
                      {entry.entryStatus && entry.entryStatus !== "Billed" ? "" : format(new Date(report.dateProcessed), "MM/dd/yyyy")}
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      {entry.entryStatus && entry.entryStatus !== "Billed" ? entry.entryStatus : servicePeriod}
                    </td>
                    <td className="border border-black px-3 py-2 text-right">
                      {entry.entryStatus && entry.entryStatus !== "Billed" ? "" : entry.totalClaims}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-bold">
                      {formatCurrency(Number(entry.totalCharges))}
                    </td>
                    {entryIndex === 0 && (
                      <td
                        className="border border-black px-3 py-2 font-bold text-center align-middle"
                        rowSpan={entries.length}
                      >
                        {formatCurrency(houseTotal)}
                      </td>
                    )}
                  </tr>
                ));
              })}
              {/* Total Row */}
              <tr className="bg-yellow-100">
                <td colSpan={3} className="border border-black px-3 py-2"></td>
                <td className="border border-black px-3 py-2 text-right font-bold text-lg">
                  Total
                </td>
                <td className="border border-black px-3 py-2 text-right font-bold text-lg">
                  {formatCurrency(Number(report.totalCharges))}
                </td>
                <td className="border border-black px-3 py-2 text-center font-bold text-lg">
                  {formatCurrency(Number(report.totalCharges))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-sm text-slate-500">
            <p>Submitted by: {report.createdBy.name}</p>
            <p>Date Processed: {format(new Date(report.dateProcessed), "MMMM d, yyyy")}</p>
            {report.billingCycle && <p>MHCP Billing Cycle: {report.billingCycle}</p>}
            {report.eftPaymentDate && (
              <p>Expected EFT Payment: {format(new Date(report.eftPaymentDate), "MMMM d, yyyy")}</p>
            )}
            <p className="mt-2">Report generated: {printDate}</p>
          </div>
        </div>
      </div>
    </>
  );
}
