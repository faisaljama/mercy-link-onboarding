import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const summaries = await prisma.clientMonthlySummary.findMany({
      where: { clientId: id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error("Error fetching summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to client
    const client = await prisma.client.findFirst({
      where: { id, houseId: { in: houseIds } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data = await request.json();
    const { month, year, title, documentUrl, fileName, fileSize, notes } = data;

    if (!month || !year || !documentUrl || !fileName) {
      return NextResponse.json(
        { error: "Month, year, document URL, and file name are required" },
        { status: 400 }
      );
    }

    const summary = await prisma.clientMonthlySummary.create({
      data: {
        clientId: id,
        month,
        year,
        title: title || `${getMonthName(month)} ${year} Summary`,
        documentUrl,
        fileName,
        fileSize: fileSize || null,
        notes: notes || null,
        uploadedById: session.id,
      },
      include: {
        uploadedBy: { select: { name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "CLIENT_MONTHLY_SUMMARY",
        entityId: summary.id,
        details: JSON.stringify({
          clientId: id,
          month,
          year,
          fileName,
        }),
      },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error creating summary:", error);
    return NextResponse.json(
      { error: "Failed to create summary" },
      { status: 500 }
    );
  }
}

function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}
