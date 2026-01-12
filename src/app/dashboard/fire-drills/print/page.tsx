import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

async function getFireDrillsForHouse(houseId: string, houseIds: string[]) {
  // Verify access to this house
  if (!houseIds.includes(houseId)) {
    return null;
  }

  const house = await prisma.house.findUnique({
    where: { id: houseId },
  });

  if (!house) return null;

  const drills = await prisma.fireDrill.findMany({
    where: { houseId },
    include: {
      completedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { biMonthlyPeriod: "desc" }],
  });

  return { house, drills };
}

export default async function PrintFireDrillsPage({
  searchParams,
}: {
  searchParams: Promise<{ houseId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseId = params.houseId;

  if (!houseId) {
    redirect("/dashboard/fire-drills");
  }

  const houseIds = await getUserHouseIds(session.id);
  const data = await getFireDrillsForHouse(houseId, houseIds);

  if (!data) {
    redirect("/dashboard/fire-drills");
  }

  const { house, drills } = data;

  return (
    <div className="print-page bg-white min-h-screen">
      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
              .print-page {
                padding: 0 !important;
                margin: 0 !important;
              }
              @page {
                size: landscape;
                margin: 0.5in;
              }
            }
            @media screen {
              .print-page {
                max-width: 1100px;
                margin: 0 auto;
                padding: 20px;
              }
            }
          `,
        }}
      />

      {/* Print Controls - Hidden when printing */}
      <div className="no-print mb-6 flex items-center justify-between bg-slate-100 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <a
            href="/dashboard/fire-drills"
            className="text-blue-600 hover:underline text-sm"
          >
            &larr; Back to Fire Drills
          </a>
          <span className="text-slate-500">|</span>
          <span className="text-sm text-slate-600">
            Showing fire drill log for <strong>{house.name}</strong>
          </span>
        </div>
        <PrintButton />
      </div>

      {/* Document Content - Matches PDF format */}
      <div className="print-content">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Fire Drill Log</h1>
          <p className="text-sm text-slate-600">(Fire drills are to be completed every 2 months)</p>
        </div>

        {/* House Name */}
        <div className="mb-6">
          <p className="text-sm">
            <span className="font-semibold">House Name:</span>{" "}
            <span className="border-b border-black inline-block min-w-[300px] pb-1">
              {house.name}
            </span>
          </p>
        </div>

        {/* Fire Drill Table */}
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 text-left bg-slate-50 w-[140px]">
                Date/Time
              </th>
              <th className="border border-black p-2 text-left bg-slate-50 w-[250px]">
                Participant Names
              </th>
              <th className="border border-black p-2 text-left bg-slate-50">
                Summary/Analysis/Recommendations
              </th>
              <th className="border border-black p-2 text-left bg-slate-50 w-[140px]">
                Completed by:
              </th>
            </tr>
          </thead>
          <tbody>
            {drills.length === 0 ? (
              // Empty rows for blank form
              <>
                {[...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td className="border border-black p-3 h-20 align-top"></td>
                    <td className="border border-black p-3 h-20 align-top"></td>
                    <td className="border border-black p-3 h-20 align-top"></td>
                    <td className="border border-black p-3 h-20 align-top"></td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {drills.map((drill) => {
                  const participants = JSON.parse(drill.participants || "[]") as string[];
                  return (
                    <tr key={drill.id}>
                      <td className="border border-black p-2 align-top">
                        <div>{format(new Date(drill.drillDate), "MM/dd/yyyy")}</div>
                        <div className="text-slate-600">{drill.drillTime}</div>
                      </td>
                      <td className="border border-black p-2 align-top">
                        {participants.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {participants.map((name, idx) => (
                              <li key={idx}>{name}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap">
                        {drill.summary || "-"}
                      </td>
                      <td className="border border-black p-2 align-top">
                        {drill.completedBy.name}
                      </td>
                    </tr>
                  );
                })}
                {/* Add empty rows to fill the page if less than 6 entries */}
                {drills.length < 6 &&
                  [...Array(6 - drills.length)].map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border border-black p-3 h-20 align-top"></td>
                      <td className="border border-black p-3 h-20 align-top"></td>
                      <td className="border border-black p-3 h-20 align-top"></td>
                      <td className="border border-black p-3 h-20 align-top"></td>
                    </tr>
                  ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
