import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

async function getBillingData(houseIds: string[], houseId?: string) {
  const where: Record<string, unknown> = {
    houseId: houseId || { in: houseIds },
  };

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
    orderBy: [{ house: { name: "asc" } }, { client: { lastName: "asc" } }],
  });

  const house = houseId
    ? await prisma.house.findUnique({ where: { id: houseId } })
    : null;

  // Calculate totals
  const activeAgreements = agreements.filter((a) => a.status === "ACTIVE");
  const totalDaily = activeAgreements.reduce(
    (sum, a) => sum + Number(a.dailyRate),
    0
  );

  return { agreements, house, totalDaily };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  CRS: "CRS",
  ICS: "ICS",
  IHS_WITH_TRAINING: "IHS w/Training",
  IHS_WITHOUT_TRAINING: "IHS w/o Training",
  NIGHT_SUPERVISION: "Night Supervision",
  HOMEMAKING: "Homemaking",
  EA_24_HOUR: "EA 24-Hour",
};

export default async function BillingPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ houseId?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const { agreements, house, totalDaily } = await getBillingData(
    houseIds,
    params.houseId
  );

  const printDate = format(new Date(), "MMMM d, yyyy");

  // Group agreements by house for display
  const agreementsByHouse = agreements.reduce(
    (acc, agreement) => {
      const houseName = agreement.house.name;
      if (!acc[houseName]) {
        acc[houseName] = [];
      }
      acc[houseName].push(agreement);
      return acc;
    },
    {} as Record<string, typeof agreements>
  );

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
              padding: 0;
              margin: 0;
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
        {/* Print Controls - Hidden when printing */}
        <div className="no-print sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl font-bold">
              Service Agreements Report
              {house && ` - ${house.name}`}
            </h1>
            <p className="text-sm text-slate-500">
              {agreements.length} agreement{agreements.length !== 1 ? "s" : ""} |
              Generated {printDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/billing"
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
            >
              Back to Billing
            </a>
            <PrintButton />
          </div>
        </div>

        {/* Print Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-2xl font-bold mb-2">
              MERCY LINK 245D SERVICES
            </h1>
            <h2 className="text-xl font-semibold mb-1">
              Service Agreements Report
            </h2>
            {house && (
              <h3 className="text-lg font-medium text-slate-700 mb-1">
                {house.name}
              </h3>
            )}
            <p className="text-sm text-slate-600">
              Report Generated: {printDate}
            </p>
          </div>

          {/* Summary Section */}
          <div className="mb-8 p-4 bg-slate-50 rounded-lg border">
            <h3 className="font-semibold mb-3">Billing Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-600">Total Agreements</p>
                <p className="text-2xl font-bold">{agreements.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Agreements</p>
                <p className="text-2xl font-bold text-green-600">
                  {agreements.filter((a) => a.status === "ACTIVE").length}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Daily Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalDaily)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Monthly Total (30 days)</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalDaily * 30)}
                </p>
              </div>
            </div>
          </div>

          {/* Agreements by House */}
          {Object.entries(agreementsByHouse).map(([houseName, houseAgreements]) => {
            const houseActiveAgreements = houseAgreements.filter(
              (a) => a.status === "ACTIVE"
            );
            const houseDailyTotal = houseActiveAgreements.reduce(
              (sum, a) => sum + Number(a.dailyRate),
              0
            );

            return (
              <div key={houseName} className="mb-8">
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-300">
                  <h3 className="text-lg font-bold">{houseName}</h3>
                  <div className="text-sm">
                    <span className="text-slate-600">Daily Total: </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(houseDailyTotal)}
                    </span>
                  </div>
                </div>

                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border px-3 py-2 text-left">Client</th>
                      <th className="border px-3 py-2 text-left">Agreement #</th>
                      <th className="border px-3 py-2 text-left">Service Type</th>
                      <th className="border px-3 py-2 text-right">Daily Rate</th>
                      <th className="border px-3 py-2 text-center">Units</th>
                      <th className="border px-3 py-2 text-center">Start Date</th>
                      <th className="border px-3 py-2 text-center">End Date</th>
                      <th className="border px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {houseAgreements.map((agreement) => (
                      <tr key={agreement.id} className="hover:bg-slate-50">
                        <td className="border px-3 py-2 font-medium">
                          {agreement.client.firstName} {agreement.client.lastName}
                        </td>
                        <td className="border px-3 py-2">
                          {agreement.agreementNumber || "-"}
                        </td>
                        <td className="border px-3 py-2">
                          {SERVICE_TYPE_LABELS[agreement.serviceType] ||
                            agreement.serviceType}
                        </td>
                        <td className="border px-3 py-2 text-right font-medium text-green-600">
                          {formatCurrency(Number(agreement.dailyRate))}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {agreement.units ? Number(agreement.units) : "-"}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {format(new Date(agreement.startDate), "MM/dd/yyyy")}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {format(new Date(agreement.endDate), "MM/dd/yyyy")}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              agreement.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : agreement.status === "PENDING"
                                ? "bg-blue-100 text-blue-800"
                                : agreement.status === "EXPIRED"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {agreement.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* House subtotal row */}
                    <tr className="bg-slate-50 font-semibold">
                      <td
                        colSpan={3}
                        className="border px-3 py-2 text-right"
                      >
                        Subtotal ({houseActiveAgreements.length} active):
                      </td>
                      <td className="border px-3 py-2 text-right text-green-600">
                        {formatCurrency(houseDailyTotal)}
                      </td>
                      <td colSpan={4} className="border px-3 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="mt-8 p-4 bg-slate-100 rounded-lg border-2 border-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Grand Total (Active Agreements)</span>
              <div className="text-right">
                <p className="text-sm text-slate-600">Daily</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalDaily)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Monthly (30 days)</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalDaily * 30)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Yearly (365 days)</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalDaily * 365)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-slate-500">
            <p>Mercy Link 245D Services - Confidential Billing Report</p>
            <p>Generated on {printDate} by {session.name}</p>
          </div>
        </div>
      </div>
    </>
  );
}
