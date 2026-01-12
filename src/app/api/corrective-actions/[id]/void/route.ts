import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/corrective-actions/[id]/void - Void a corrective action (Admin/HR only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HR can void actions
    if (session.role !== "ADMIN" && session.role !== "HR") {
      return NextResponse.json(
        { error: "Only administrators and HR can void corrective actions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { voidReason } = body;

    if (!voidReason || voidReason.trim().length < 10) {
      return NextResponse.json(
        { error: "A void reason of at least 10 characters is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.correctiveAction.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Corrective action not found" },
        { status: 404 }
      );
    }

    if (existing.status === "VOIDED") {
      return NextResponse.json(
        { error: "This corrective action is already voided" },
        { status: 400 }
      );
    }

    const action = await prisma.correctiveAction.update({
      where: { id },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        voidedById: session.id,
        voidReason,
      },
      include: {
        employee: true,
        violationCategory: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "STATUS_CHANGE",
        entityType: "CORRECTIVE_ACTION",
        entityId: action.id,
        details: JSON.stringify({
          previousStatus: existing.status,
          newStatus: "VOIDED",
          voidReason,
          employeeName: `${existing.employee.firstName} ${existing.employee.lastName}`,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      action,
    });
  } catch (error) {
    console.error("Error voiding corrective action:", error);
    return NextResponse.json(
      { error: "Failed to void corrective action" },
      { status: 500 }
    );
  }
}
