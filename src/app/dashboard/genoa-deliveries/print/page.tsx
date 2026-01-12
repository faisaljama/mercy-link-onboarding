import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

async function getDeliveriesForHouse(houseId: string, houseIds: string[]) {
  // Verify access to this house
  if (!houseIds.includes(houseId)) {
    return null;
  }

  const house = await prisma.house.findUnique({
    where: { id: houseId },
  });

  if (!house) return null;

  const deliveries = await prisma.genoaDelivery.findMany({
    where: { houseId },
    include: {
      receivedBy: {
        select: {
          name: true,
        },
      },
      client: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { deliveryDate: "desc" },
  });

  return { house, deliveries };
}

export default async function PrintGenoaDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ houseId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseId = params.houseId;

  if (!houseId) {
    redirect("/dashboard/genoa-deliveries");
  }

  const houseIds = await getUserHouseIds(session.id);
  const data = await getDeliveriesForHouse(houseId, houseIds);

  if (!data) {
    redirect("/dashboard/genoa-deliveries");
  }

  const { house, deliveries } = data;

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
                max-width: 1200px;
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
            href="/dashboard/genoa-deliveries"
            className="text-blue-600 hover:underline text-sm"
          >
            &larr; Back to Genoa Deliveries
          </a>
          <span className="text-slate-500">|</span>
          <span className="text-sm text-slate-600">
            Showing delivery log for <strong>{house.name}</strong>
          </span>
        </div>
        <PrintButton />
      </div>

      {/* Document Content */}
      <div className="print-content">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Genoa Pharmacy Delivery Log</h1>
          <p className="text-sm text-slate-600">Medication Delivery Tracking Record</p>
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

        {/* Delivery Table */}
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 text-left bg-slate-50 w-[100px]">
                Date
              </th>
              <th className="border border-black p-2 text-left bg-slate-50 w-[70px]">
                Time
              </th>
              <th className="border border-black p-2 text-left bg-slate-50 w-[150px]">
                Recipient
              </th>
              <th className="border border-black p-2 text-left bg-slate-50 w-[120px]">
                Received By
              </th>
              <th className="border border-black p-2 text-center bg-slate-50 w-[80px]">
                Meds Match
              </th>
              <th className="border border-black p-2 text-center bg-slate-50 w-[80px]">
                Stored OK
              </th>
              <th className="border border-black p-2 text-left bg-slate-50">
                Notes/Issues
              </th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              // Empty rows for blank form
              <>
                {[...Array(12)].map((_, i) => (
                  <tr key={i}>
                    <td className="border border-black p-3 h-14 align-top"></td>
                    <td className="border border-black p-3 h-14 align-top"></td>
                    <td className="border border-black p-3 h-14 align-top"></td>
                    <td className="border border-black p-3 h-14 align-top"></td>
                    <td className="border border-black p-3 h-14 align-top"></td>
                    <td className="border border-black p-3 h-14 align-top"></td>
                    <td className="border border-black p-3 h-14 align-top"></td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {deliveries.map((delivery) => {
                  const hasIssues =
                    delivery.medicationsMatch === false ||
                    delivery.properlyStored === false;
                  const notes = [];
                  if (delivery.medicationsMatchNotes) {
                    notes.push(`Mismatch: ${delivery.medicationsMatchNotes}`);
                  }
                  if (delivery.properlyStoredNotes) {
                    notes.push(`Storage: ${delivery.properlyStoredNotes}`);
                  }
                  if (delivery.notes) {
                    notes.push(delivery.notes);
                  }

                  return (
                    <tr key={delivery.id} className={hasIssues ? "bg-red-50" : ""}>
                      <td className="border border-black p-2 align-top">
                        {format(new Date(delivery.deliveryDate), "MM/dd/yyyy")}
                      </td>
                      <td className="border border-black p-2 align-top">
                        {delivery.deliveryTime}
                      </td>
                      <td className="border border-black p-2 align-top">
                        {delivery.isAllResidents ? (
                          <span className="font-medium">All Residents</span>
                        ) : delivery.client ? (
                          `${delivery.client.firstName} ${delivery.client.lastName}`
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border border-black p-2 align-top">
                        {delivery.receivedBy.name}
                      </td>
                      <td className="border border-black p-2 align-top text-center">
                        {delivery.medicationsMatch === true ? (
                          <span className="text-green-700 font-medium">Yes</span>
                        ) : delivery.medicationsMatch === false ? (
                          <span className="text-red-700 font-medium">No</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border border-black p-2 align-top text-center">
                        {delivery.properlyStored === true ? (
                          <span className="text-green-700 font-medium">Yes</span>
                        ) : delivery.properlyStored === false ? (
                          <span className="text-red-700 font-medium">No</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border border-black p-2 align-top text-xs">
                        {notes.length > 0 ? notes.join("; ") : "-"}
                      </td>
                    </tr>
                  );
                })}
                {/* Add empty rows if less than 8 entries */}
                {deliveries.length < 8 &&
                  [...Array(8 - deliveries.length)].map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border border-black p-3 h-14 align-top"></td>
                      <td className="border border-black p-3 h-14 align-top"></td>
                      <td className="border border-black p-3 h-14 align-top"></td>
                      <td className="border border-black p-3 h-14 align-top"></td>
                      <td className="border border-black p-3 h-14 align-top"></td>
                      <td className="border border-black p-3 h-14 align-top"></td>
                      <td className="border border-black p-3 h-14 align-top"></td>
                    </tr>
                  ))}
              </>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-6 text-xs text-slate-500">
          <p>* Meds Match: Did medications match the delivery manifest?</p>
          <p>* Stored OK: Were medications stored properly in grey Genoa delivery box in office?</p>
        </div>
      </div>
    </div>
  );
}
