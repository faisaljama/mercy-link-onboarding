import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

const BILLABLE_CODES = ["P"];
const PERIOD_DAYS = 14;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

async function getReport(id: string) {
  const report = await prisma.attendanceReport.findUnique({
    where: { id },
    include: {
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
      entries: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // Get service agreements for daily rates if not stored in entry
  if (report) {
    const clients = await prisma.client.findMany({
      where: { houseId: report.houseId },
      include: {
        serviceAgreements: {
          where: { status: "ACTIVE" },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });

    // Create a map of client name to daily rate
    const rateMap = new Map<string, number>();
    for (const client of clients) {
      const fullName = `${client.firstName} ${client.lastName}`;
      const rate = client.serviceAgreements[0]?.dailyRate;
      if (rate) {
        rateMap.set(fullName, Number(rate));
      }
    }

    // Attach rates to entries
    return {
      ...report,
      entries: report.entries.map((entry) => ({
        ...entry,
        dailyRate: entry.dailyRate || rateMap.get(entry.clientName) || null,
      })),
    };
  }

  return report;
}

// Get day of week abbreviation
function getDayOfWeek(startDate: Date, dayOffset: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
}

// Get date number
function getDateNumber(startDate: Date, dayOffset: number): number {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date.getDate();
}

// Format period for display
function formatPeriod(startDate: Date, endDate: Date): string {
  return `${format(startDate, "M/d/yy")} - ${format(endDate, "M/d/yy")}`;
}

export default async function AttendanceReportPrintPage({
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

  const startDate = new Date(report.startDate);
  const endDate = new Date(report.endDate);
  const printDate = format(new Date(), "MMMM d, yyyy");

  // Calculate totals
  const totalBillable = report.entries.reduce((s, e) => s + e.billableDays, 0);
  const totalNonBillable = report.entries.reduce((s, e) => s + e.nonBillableDays, 0);

  // Calculate billing totals
  const grandTotalBillable = report.entries.reduce((s, e) => {
    const rate = e.dailyRate ? Number(e.dailyRate) : 0;
    return s + (e.billableDays * rate);
  }, 0);

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
              size: landscape;
              margin: 0.25in;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-white">
        {/* Print Controls */}
        <div className="no-print sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl font-bold">CRS Bi-Weekly Attendance Report</h1>
            <p className="text-sm text-slate-500">
              {report.house.name} - {formatPeriod(startDate, endDate)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/dashboard/billing/attendance/${report.id}`}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
            >
              Back to Report
            </a>
            <PrintButton />
          </div>
        </div>

        {/* Print Content */}
        <div className="p-4">
          {/* Header */}
          <div className="text-center mb-4 border-b-2 border-blue-800 pb-2">
            <h1 className="text-xl font-bold text-blue-900">MERCY LINK LLC - CRS BI-WEEKLY ATTENDANCE REPORT</h1>
          </div>

          {/* Report Info */}
          <div className="flex justify-between mb-4 text-sm">
            <div>
              <p><strong>Billing Period:</strong> {formatPeriod(startDate, endDate)}</p>
              <p><strong>Facility Name:</strong> {report.house.name}</p>
            </div>
            <div>
              <p><strong>Period Days:</strong> 14 days</p>
              <p><strong>Prepared By:</strong> {report.createdBy.name}</p>
            </div>
            <div className="text-right">
              <p><strong>Date Prepared:</strong> {printDate}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-2 text-xs flex gap-4 flex-wrap">
            <span className="font-bold">LEGEND:</span>
            <span><span className="inline-block px-1 bg-green-100">P</span>=Present (Billable)</span>
            <span><span className="inline-block px-1 bg-red-100">A</span>=Absent</span>
            <span><span className="inline-block px-1 bg-red-100">H</span>=Hospitalized</span>
            <span><span className="inline-block px-1 bg-red-100">V</span>=Vacation</span>
            <span><span className="inline-block px-1 bg-red-100">DC</span>=Discharged</span>
          </div>

          {/* Attendance Grid */}
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border border-black px-1 py-1 text-left font-bold" style={{ minWidth: "120px" }}>
                  Resident Name
                </th>
                <th className="border border-black px-1 py-1 text-left font-bold" style={{ minWidth: "70px" }}>
                  MA ID / PMI
                </th>
                {Array.from({ length: PERIOD_DAYS }, (_, i) => (
                  <th key={i + 1} className="border border-black px-0.5 py-1 text-center font-bold" style={{ minWidth: "24px" }}>
                    <div className="text-[9px] opacity-75">{getDayOfWeek(startDate, i)}</div>
                    <div>{getDateNumber(startDate, i)}</div>
                  </th>
                ))}
                <th className="border border-black px-1 py-1 text-center font-bold bg-green-600" style={{ minWidth: "45px" }}>
                  Total Present
                </th>
                <th className="border border-black px-1 py-1 text-center font-bold bg-red-600" style={{ minWidth: "45px" }}>
                  Total Absent
                </th>
                <th className="border border-black px-1 py-1 text-center font-bold bg-green-700" style={{ minWidth: "50px" }}>
                  Billable Days
                </th>
                <th className="border border-black px-1 py-1 text-center font-bold bg-red-700" style={{ minWidth: "50px" }}>
                  Non-Billable
                </th>
                <th className="border border-black px-1 py-1 text-center font-bold bg-blue-600" style={{ minWidth: "60px" }}>
                  Daily Rate
                </th>
                <th className="border border-black px-1 py-1 text-center font-bold bg-green-800" style={{ minWidth: "70px" }}>
                  Total Billable
                </th>
              </tr>
            </thead>
            <tbody>
              {report.entries.map((entry, index) => (
                <tr key={entry.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="border border-black px-1 py-1 font-medium">
                    {entry.clientName}
                  </td>
                  <td className="border border-black px-1 py-1 text-slate-600">
                    {entry.maId || ""}
                  </td>
                  {Array.from({ length: PERIOD_DAYS }, (_, dayIndex) => {
                    const day = dayIndex + 1;
                    const code = entry[`day${day}` as keyof typeof entry] as string | null;
                    return (
                      <td
                        key={day}
                        className="border border-black px-0.5 py-1 text-center font-medium"
                        style={{ fontSize: "9px", ...(code ? { backgroundColor: code === "P" ? "#dcfce7" : "#fee2e2" } : {}) }}
                      >
                        {code || ""}
                      </td>
                    );
                  })}
                  <td className="border border-black px-1 py-1 text-center font-bold bg-green-100">
                    {entry.totalPresent}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-bold bg-red-100">
                    {entry.totalAbsent}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-bold bg-green-200 text-green-800">
                    {entry.billableDays}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-bold bg-red-200 text-red-800">
                    {entry.nonBillableDays}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-medium bg-blue-50">
                    {entry.dailyRate ? formatCurrency(Number(entry.dailyRate)) : "-"}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-bold bg-green-300 text-green-900">
                    {entry.dailyRate ? formatCurrency(entry.billableDays * Number(entry.dailyRate)) : "-"}
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-yellow-100 font-bold">
                <td colSpan={2 + PERIOD_DAYS} className="border border-black px-1 py-1 text-right">
                  TOTALS:
                </td>
                <td className="border border-black px-1 py-1 text-center bg-green-200">
                  {report.entries.reduce((s, e) => s + e.totalPresent, 0)}
                </td>
                <td className="border border-black px-1 py-1 text-center bg-red-200">
                  {report.entries.reduce((s, e) => s + e.totalAbsent, 0)}
                </td>
                <td className="border border-black px-1 py-1 text-center bg-green-300 text-green-900">
                  {totalBillable}
                </td>
                <td className="border border-black px-1 py-1 text-center bg-red-300 text-red-900">
                  {totalNonBillable}
                </td>
                <td className="border border-black px-1 py-1 text-center bg-blue-100">
                  -
                </td>
                <td className="border border-black px-1 py-1 text-center bg-green-400 text-green-900 text-sm">
                  {formatCurrency(grandTotalBillable)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Billing Summary */}
          <div className="mt-4 p-3 bg-green-50 border-2 border-green-600 rounded">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p className="font-bold text-green-900">BI-WEEKLY BILLING SUMMARY</p>
                <p className="text-green-700">Total Billable Days: {totalBillable} days</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-700">Total Billable Amount:</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(grandTotalBillable)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {report.notes && (
            <div className="mt-4 p-2 border border-slate-300 rounded">
              <p className="text-xs font-bold">Notes:</p>
              <p className="text-xs">{report.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-2 border-t text-xs text-slate-500 flex justify-between">
            <p>Mercy Link LLC - 245D Licensed Provider - Community Residential Services (CRS)</p>
            <p>Report generated: {printDate}</p>
          </div>
        </div>
      </div>
    </>
  );
}
