import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);

    const checklists = await prisma.qAChecklist.findMany({
      where: {
        OR: [
          { houseId: { in: houseIds } },
          { houseId: null },
        ],
      },
      orderBy: { reviewDate: "desc" },
    });

    return NextResponse.json({ checklists });
  } catch (error) {
    console.error("Error fetching QA checklists:", error);
    return NextResponse.json(
      { error: "Failed to fetch QA checklists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and DCs can create checklists
    if (session.role === "DSP") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const houseIds = await getUserHouseIds(session.id);
    const data = await request.json();
    const {
      checklistType,
      houseId,
      clientId,
      reviewDate,
      items,
      overallNotes,
    } = data;

    // Validate required fields
    if (!checklistType || !reviewDate) {
      return NextResponse.json(
        { error: "Checklist type and review date are required" },
        { status: 400 }
      );
    }

    // Validate access to house if specified
    if (houseId && !houseIds.includes(houseId)) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    // Validate access to client if specified
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          houseId: { in: houseIds },
        },
      });
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    // Determine status based on items
    let status = "IN_PROGRESS";
    let followUpRequired = false;

    if (items && items.length > 0) {
      const hasIncomplete = items.some((item: { value: string }) => !item.value);
      const hasNO = items.some((item: { value: string }) => item.value === "NO");

      if (!hasIncomplete) {
        status = hasNO ? "NEEDS_ATTENTION" : "COMPLETED";
      }
      followUpRequired = hasNO;
    }

    // Create checklist
    const checklist = await prisma.qAChecklist.create({
      data: {
        checklistType,
        houseId: houseId || null,
        clientId: clientId || null,
        reviewDate: new Date(reviewDate),
        reviewedBy: session.id,
        status,
        items: JSON.stringify(items || []),
        overallNotes: overallNotes || null,
        followUpRequired,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "QA_CHECKLIST",
        entityId: checklist.id,
        details: JSON.stringify({
          type: checklistType,
          houseId,
          clientId,
        }),
      },
    });

    return NextResponse.json({ checklist }, { status: 201 });
  } catch (error) {
    console.error("Error creating QA checklist:", error);
    return NextResponse.json(
      { error: "Failed to create QA checklist" },
      { status: 500 }
    );
  }
}
