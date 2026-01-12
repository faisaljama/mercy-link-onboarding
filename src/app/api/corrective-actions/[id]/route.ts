import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { subDays } from "date-fns";

// Helper: Calculate current points for an employee (rolling 90-day window)
async function calculateCurrentPoints(employeeId: string, excludeActionId?: string): Promise<number> {
  const ninetyDaysAgo = subDays(new Date(), 90);

  const actions = await prisma.correctiveAction.findMany({
    where: {
      employeeId,
      violationDate: { gte: ninetyDaysAgo },
      status: { not: "VOIDED" },
      ...(excludeActionId ? { id: { not: excludeActionId } } : {}),
    },
  });

  return actions.reduce((total, action) => {
    return total + (action.pointsAdjusted ?? action.pointsAssigned);
  }, 0);
}

// GET /api/corrective-actions/[id] - Get single corrective action
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

    const action = await prisma.correctiveAction.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            hireDate: true,
            email: true,
            phone: true,
            assignedHouses: {
              include: { house: { select: { id: true, name: true } } },
            },
          },
        },
        issuedBy: {
          select: { id: true, name: true, email: true },
        },
        house: {
          select: { id: true, name: true },
        },
        violationCategory: true,
        voidedBy: {
          select: { id: true, name: true },
        },
        signatures: {
          include: {
            signer: { select: { id: true, name: true } },
          },
          orderBy: { signedAt: "asc" },
        },
        documents: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Corrective action not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    const houseIds = await getUserHouseIds(session.id);
    const hasAccess =
      session.role === "ADMIN" ||
      session.role === "HR" ||
      action.issuedById === session.id ||
      (action.houseId && houseIds.includes(action.houseId));

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have permission to view this corrective action" },
        { status: 403 }
      );
    }

    // Calculate current points for context
    const currentPoints = await calculateCurrentPoints(action.employeeId);
    const pointsBefore = await calculateCurrentPoints(action.employeeId, action.id);

    // Get discipline history for this employee
    const ninetyDaysAgo = subDays(new Date(), 90);
    const disciplineHistory = await prisma.correctiveAction.findMany({
      where: {
        employeeId: action.employeeId,
        violationDate: { gte: ninetyDaysAgo },
        status: { not: "VOIDED" },
      },
      include: {
        violationCategory: { select: { categoryName: true, severityLevel: true } },
      },
      orderBy: { violationDate: "desc" },
      take: 10,
    });

    return NextResponse.json({
      action,
      currentPoints,
      pointsBefore,
      disciplineHistory,
    });
  } catch (error) {
    console.error("Error fetching corrective action:", error);
    return NextResponse.json(
      { error: "Failed to fetch corrective action" },
      { status: 500 }
    );
  }
}

// PUT /api/corrective-actions/[id] - Update corrective action
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.correctiveAction.findUnique({
      where: { id },
      include: { signatures: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Corrective action not found" },
        { status: 404 }
      );
    }

    // Check if user can edit
    const canEdit =
      session.role === "ADMIN" ||
      session.role === "HR" ||
      (existing.issuedById === session.id && existing.status === "PENDING_SIGNATURE");

    if (!canEdit) {
      return NextResponse.json(
        { error: "You cannot edit this corrective action" },
        { status: 403 }
      );
    }

    // Cannot edit acknowledged or voided actions
    if (existing.status === "ACKNOWLEDGED" || existing.status === "VOIDED") {
      return NextResponse.json(
        { error: "Cannot edit an acknowledged or voided action" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      incidentDescription,
      mitigatingCircumstances,
      pointsAdjusted,
      adjustmentReason,
      correctiveExpectations,
      consequencesText,
      pipScheduled,
      pipDate,
    } = body;

    const action = await prisma.correctiveAction.update({
      where: { id },
      data: {
        incidentDescription: incidentDescription ?? existing.incidentDescription,
        mitigatingCircumstances:
          mitigatingCircumstances !== undefined
            ? mitigatingCircumstances
            : existing.mitigatingCircumstances,
        pointsAdjusted:
          pointsAdjusted !== undefined ? pointsAdjusted : existing.pointsAdjusted,
        adjustmentReason:
          adjustmentReason !== undefined
            ? adjustmentReason
            : existing.adjustmentReason,
        correctiveExpectations:
          correctiveExpectations !== undefined
            ? JSON.stringify(correctiveExpectations)
            : existing.correctiveExpectations,
        consequencesText: consequencesText ?? existing.consequencesText,
        pipScheduled: pipScheduled ?? existing.pipScheduled,
        pipDate: pipDate !== undefined ? (pipDate ? new Date(pipDate) : null) : existing.pipDate,
      },
      include: {
        employee: true,
        violationCategory: true,
        house: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "CORRECTIVE_ACTION",
        entityId: action.id,
        details: JSON.stringify({
          updatedFields: Object.keys(body),
        }),
      },
    });

    return NextResponse.json({ action });
  } catch (error) {
    console.error("Error updating corrective action:", error);
    return NextResponse.json(
      { error: "Failed to update corrective action" },
      { status: 500 }
    );
  }
}
