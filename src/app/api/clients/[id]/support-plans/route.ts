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

    const supportPlans = await prisma.clientSupportPlan.findMany({
      where: { clientId: id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ effectiveStartDate: "desc" }],
    });

    return NextResponse.json({ supportPlans });
  } catch (error) {
    console.error("Error fetching support plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch support plans" },
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
    const {
      planType,
      title,
      effectiveStartDate,
      effectiveEndDate,
      documentUrl,
      fileName,
      fileSize,
      notes,
    } = data;

    if (!planType || !effectiveStartDate || !documentUrl || !fileName) {
      return NextResponse.json(
        { error: "Plan type, start date, document URL, and file name are required" },
        { status: 400 }
      );
    }

    const supportPlan = await prisma.clientSupportPlan.create({
      data: {
        clientId: id,
        planType,
        title: title || null,
        effectiveStartDate: new Date(effectiveStartDate),
        effectiveEndDate: effectiveEndDate ? new Date(effectiveEndDate) : null,
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
        entityType: "CLIENT_SUPPORT_PLAN",
        entityId: supportPlan.id,
        details: JSON.stringify({
          clientId: id,
          planType,
          effectiveStartDate,
          effectiveEndDate,
          fileName,
        }),
      },
    });

    return NextResponse.json({ supportPlan });
  } catch (error) {
    console.error("Error creating support plan:", error);
    return NextResponse.json(
      { error: "Failed to create support plan" },
      { status: 500 }
    );
  }
}
