import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/employees/[id]/discipline-history - Get full discipline history for an employee
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
    const { searchParams } = new URL(request.url);
    const includeVoided = searchParams.get("includeVoided") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        hireDate: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { employeeId: id };
    if (!includeVoided) {
      whereClause.status = { not: "VOIDED" };
    }

    // Get all corrective actions
    const actions = await prisma.correctiveAction.findMany({
      where: whereClause,
      include: {
        violationCategory: {
          select: {
            categoryName: true,
            severityLevel: true,
            defaultPoints: true,
          },
        },
        issuedBy: {
          select: { id: true, name: true },
        },
        house: {
          select: { id: true, name: true },
        },
        signatures: {
          select: {
            signerType: true,
            signedAt: true,
            signer: { select: { name: true } },
          },
        },
        voidedBy: {
          select: { name: true },
        },
      },
      orderBy: { violationDate: "desc" },
      take: limit,
    });

    // Calculate summary statistics
    const stats = {
      totalActions: actions.length,
      activeActions: actions.filter((a) => a.status !== "VOIDED").length,
      voidedActions: actions.filter((a) => a.status === "VOIDED").length,
      pendingSignatures: actions.filter((a) => a.status === "PENDING_SIGNATURE").length,
      acknowledged: actions.filter((a) => a.status === "ACKNOWLEDGED").length,
      disputed: actions.filter((a) => a.status === "DISPUTED").length,
      totalPointsEver: actions
        .filter((a) => a.status !== "VOIDED")
        .reduce((sum, a) => sum + (a.pointsAdjusted ?? a.pointsAssigned), 0),
      bySeverity: {
        minor: actions.filter((a) => a.violationCategory.severityLevel === "MINOR").length,
        moderate: actions.filter((a) => a.violationCategory.severityLevel === "MODERATE").length,
        serious: actions.filter((a) => a.violationCategory.severityLevel === "SERIOUS").length,
        critical: actions.filter((a) => a.violationCategory.severityLevel === "CRITICAL").length,
        immediateTermination: actions.filter(
          (a) => a.violationCategory.severityLevel === "IMMEDIATE_TERMINATION"
        ).length,
      },
    };

    // Group by year for timeline view
    const byYear: Record<number, typeof actions> = {};
    actions.forEach((action) => {
      const year = new Date(action.violationDate).getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(action);
    });

    return NextResponse.json({
      employee,
      actions,
      stats,
      byYear,
    });
  } catch (error) {
    console.error("Error fetching discipline history:", error);
    return NextResponse.json(
      { error: "Failed to fetch discipline history" },
      { status: 500 }
    );
  }
}
