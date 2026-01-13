import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { format } from "date-fns";

const LOW_STOCK_THRESHOLD = 12;

// GET - Get combined verification history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const searchParams = request.nextUrl.searchParams;

    const houseId = searchParams.get("houseId");
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type"); // scheduled, prn, or all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const exportCsv = searchParams.get("export") === "csv";

    const effectiveHouseIds = houseId && houseIds.includes(houseId) ? [houseId] : houseIds;

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    } else if (startDate) {
      dateFilter.gte = new Date(startDate);
    } else if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const history: Array<{
      id: string;
      type: string;
      date: Date;
      houseName: string;
      houseId: string;
      clientName: string;
      clientId: string;
      status: string;
      statusDetail: string;
      verifiedBy: string;
      notes: string | null;
      photoUrl: string | null;
    }> = [];

    // Get scheduled med verifications
    if (!type || type === "all" || type === "scheduled") {
      const scheduledWhere: Record<string, unknown> = {
        houseId: { in: effectiveHouseIds },
      };
      if (clientId) scheduledWhere.clientId = clientId;
      if (Object.keys(dateFilter).length > 0) scheduledWhere.visitDate = dateFilter;

      const scheduledVerifications = await prisma.scheduledMedVerification.findMany({
        where: scheduledWhere,
        include: {
          client: { select: { firstName: true, lastName: true } },
          house: { select: { name: true } },
          verifiedBy: { select: { name: true } },
        },
        orderBy: { visitDate: "desc" },
      });

      for (const v of scheduledVerifications) {
        const visitDate = new Date(v.visitDate);
        const medPackDate = new Date(v.medPackDate);
        const datesMatch = visitDate.toDateString() === medPackDate.toDateString();
        const dayDiff = Math.round((visitDate.getTime() - medPackDate.getTime()) / (1000 * 60 * 60 * 24));

        history.push({
          id: v.id,
          type: "Scheduled",
          date: v.visitDate,
          houseName: v.house.name,
          houseId: v.houseId,
          clientName: `${v.client.firstName} ${v.client.lastName}`,
          clientId: v.clientId,
          status: datesMatch ? "match" : "mismatch",
          statusDetail: datesMatch ? "Match" : `${dayDiff > 0 ? "+" : ""}${dayDiff} day${Math.abs(dayDiff) !== 1 ? "s" : ""}`,
          verifiedBy: v.verifiedBy.name,
          notes: v.notes,
          photoUrl: v.photoUrl,
        });
      }
    }

    // Get PRN history
    if (!type || type === "all" || type === "prn") {
      const prnWhere: Record<string, unknown> = {
        houseId: { in: effectiveHouseIds },
      };
      if (clientId) prnWhere.clientId = clientId;

      const prnItems = await prisma.prnInventory.findMany({
        where: prnWhere,
        include: {
          client: { select: { firstName: true, lastName: true } },
          house: { select: { name: true } },
          updatedBy: { select: { name: true } },
          history: {
            include: {
              updatedBy: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      for (const prn of prnItems) {
        for (const h of prn.history) {
          // Apply date filter to history entries
          if (Object.keys(dateFilter).length > 0) {
            const historyDate = new Date(h.createdAt);
            if (dateFilter.gte && historyDate < (dateFilter.gte as Date)) continue;
            if (dateFilter.lte && historyDate > (dateFilter.lte as Date)) continue;
          }

          const isLowStock = h.quantityRemaining <= LOW_STOCK_THRESHOLD;

          history.push({
            id: h.id,
            type: `PRN-${prn.medicationName}`,
            date: h.createdAt,
            houseName: prn.house.name,
            houseId: prn.houseId,
            clientName: `${prn.client.firstName} ${prn.client.lastName}`,
            clientId: prn.clientId,
            status: isLowStock ? "low" : "ok",
            statusDetail: `${h.quantityRemaining}`,
            verifiedBy: h.updatedBy.name,
            notes: prn.notes,
            photoUrl: prn.photoUrl,
          });
        }
      }
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Export to CSV
    if (exportCsv) {
      const csvRows = [
        ["Date", "House", "Resident", "Type", "Status", "Verified By", "Notes"].join(","),
        ...history.map((h) =>
          [
            format(new Date(h.date), "yyyy-MM-dd"),
            `"${h.houseName}"`,
            `"${h.clientName}"`,
            `"${h.type}"`,
            h.statusDetail,
            `"${h.verifiedBy}"`,
            `"${(h.notes || "").replace(/"/g, '""')}"`,
          ].join(",")
        ),
      ];

      const csv = csvRows.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="medication-verification-history-${format(new Date(), "yyyy-MM-dd")}.csv"`,
        },
      });
    }

    // Paginate
    const total = history.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedHistory = history.slice(offset, offset + limit);

    return NextResponse.json({
      history: paginatedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching medication history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
