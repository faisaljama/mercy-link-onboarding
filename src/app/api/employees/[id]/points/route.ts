import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { subDays, addDays, differenceInDays } from "date-fns";

// GET /api/employees/[id]/points - Get current discipline points for an employee
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

    const today = new Date();
    const ninetyDaysAgo = subDays(today, 90);

    // Get all active (non-voided) corrective actions in the rolling 90-day window
    const actions = await prisma.correctiveAction.findMany({
      where: {
        employeeId: id,
        violationDate: { gte: ninetyDaysAgo },
        status: { not: "VOIDED" },
      },
      include: {
        violationCategory: {
          select: { categoryName: true, severityLevel: true },
        },
      },
      orderBy: { violationDate: "asc" },
    });

    // Calculate current points
    const currentPoints = actions.reduce((total, action) => {
      return total + (action.pointsAdjusted ?? action.pointsAssigned);
    }, 0);

    // Calculate points expiring soon (in the next 30 days)
    const expiringActions = actions.map((action) => {
      const expirationDate = addDays(new Date(action.violationDate), 90);
      const daysUntilExpiration = differenceInDays(expirationDate, today);
      return {
        id: action.id,
        violationDate: action.violationDate,
        expirationDate,
        daysUntilExpiration,
        points: action.pointsAdjusted ?? action.pointsAssigned,
        violation: action.violationCategory.categoryName,
      };
    }).filter((a) => a.daysUntilExpiration <= 30 && a.daysUntilExpiration > 0);

    // Determine discipline level
    let disciplineLevel = "GOOD_STANDING";
    let nextThreshold: number | null = 6;
    let pointsToNextThreshold = 6 - currentPoints;

    if (currentPoints >= 18) {
      disciplineLevel = "TERMINATION";
      nextThreshold = null;
      pointsToNextThreshold = 0;
    } else if (currentPoints >= 14) {
      disciplineLevel = "FINAL_WARNING";
      nextThreshold = 18;
      pointsToNextThreshold = 18 - currentPoints;
    } else if (currentPoints >= 10) {
      disciplineLevel = "WRITTEN_WARNING";
      nextThreshold = 14;
      pointsToNextThreshold = 14 - currentPoints;
    } else if (currentPoints >= 6) {
      disciplineLevel = "VERBAL_WARNING";
      nextThreshold = 10;
      pointsToNextThreshold = 10 - currentPoints;
    } else if (currentPoints >= 1) {
      disciplineLevel = "COACHING";
      nextThreshold = 6;
      pointsToNextThreshold = 6 - currentPoints;
    }

    // Get point adjustments
    const adjustments = await prisma.pointAdjustment.findMany({
      where: {
        employeeId: id,
        effectiveDate: { gte: ninetyDaysAgo },
      },
      include: {
        approvedBy: { select: { name: true } },
      },
      orderBy: { effectiveDate: "desc" },
    });

    return NextResponse.json({
      employee,
      currentPoints,
      maxPoints: 18,
      disciplineLevel,
      nextThreshold,
      pointsToNextThreshold,
      actionsCount: actions.length,
      expiringPoints: expiringActions,
      pointAdjustments: adjustments,
      breakdown: {
        coaching: currentPoints >= 1 && currentPoints <= 5,
        verbalWarning: currentPoints >= 6 && currentPoints <= 9,
        writtenWarning: currentPoints >= 10 && currentPoints <= 13,
        finalWarning: currentPoints >= 14 && currentPoints <= 17,
        termination: currentPoints >= 18,
      },
      thresholds: [
        { level: "Coaching", min: 1, max: 5 },
        { level: "Verbal Warning", min: 6, max: 9 },
        { level: "Written Warning", min: 10, max: 13 },
        { level: "Final Warning + PIP", min: 14, max: 17 },
        { level: "Termination", min: 18, max: null },
      ],
    });
  } catch (error) {
    console.error("Error fetching employee points:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee points" },
      { status: 500 }
    );
  }
}
