import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/discipline-thresholds - List all discipline thresholds
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thresholds = await prisma.disciplineThreshold.findMany({
      where: { isActive: true },
      orderBy: { pointMinimum: "asc" },
    });

    return NextResponse.json({ thresholds });
  } catch (error) {
    console.error("Error fetching discipline thresholds:", error);
    return NextResponse.json(
      { error: "Failed to fetch thresholds" },
      { status: 500 }
    );
  }
}

// PUT /api/discipline-thresholds - Update thresholds (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can update discipline thresholds" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { thresholds } = body;

    if (!Array.isArray(thresholds)) {
      return NextResponse.json(
        { error: "Thresholds must be an array" },
        { status: 400 }
      );
    }

    // Update each threshold
    const updated = await Promise.all(
      thresholds.map(async (threshold: {
        id: string;
        pointMinimum?: number;
        pointMaximum?: number;
        actionRequired?: string;
        description?: string;
        isActive?: boolean;
      }) => {
        return prisma.disciplineThreshold.update({
          where: { id: threshold.id },
          data: {
            pointMinimum: threshold.pointMinimum,
            pointMaximum: threshold.pointMaximum,
            actionRequired: threshold.actionRequired,
            description: threshold.description,
            isActive: threshold.isActive,
          },
        });
      })
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "DISCIPLINE_THRESHOLD",
        entityId: "BATCH",
        details: JSON.stringify({
          updatedCount: updated.length,
        }),
      },
    });

    return NextResponse.json({ thresholds: updated });
  } catch (error) {
    console.error("Error updating discipline thresholds:", error);
    return NextResponse.json(
      { error: "Failed to update thresholds" },
      { status: 500 }
    );
  }
}
