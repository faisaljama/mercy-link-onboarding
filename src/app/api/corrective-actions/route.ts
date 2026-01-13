import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { subDays, format } from "date-fns";
import { sendCorrectiveActionSignatureRequest } from "@/lib/email";

// Helper: Calculate current points for an employee (rolling 90-day window)
async function calculateCurrentPoints(employeeId: string): Promise<number> {
  const ninetyDaysAgo = subDays(new Date(), 90);

  const actions = await prisma.correctiveAction.findMany({
    where: {
      employeeId,
      violationDate: { gte: ninetyDaysAgo },
      status: { not: "VOIDED" },
    },
  });

  return actions.reduce((total, action) => {
    return total + (action.pointsAdjusted ?? action.pointsAssigned);
  }, 0);
}

// Helper: Get discipline level based on points
function getDisciplineLevel(points: number): string {
  if (points >= 18) return "TERMINATION";
  if (points >= 14) return "FINAL_WARNING";
  if (points >= 10) return "WRITTEN_WARNING";
  if (points >= 6) return "VERBAL_WARNING";
  return "COACHING";
}

// GET /api/corrective-actions - List corrective actions with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const houseId = searchParams.get("houseId");
    const status = searchParams.get("status");
    const severityLevel = searchParams.get("severityLevel");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause based on user role
    const whereClause: Record<string, unknown> = {};
    const houseIds = await getUserHouseIds(session.id);

    // Role-based filtering
    if (session.role === "ADMIN" || session.role === "HR") {
      // Admin/HR can see all records
    } else if (session.role === "DESIGNATED_MANAGER") {
      // DM can see records for their sites
      whereClause.houseId = { in: houseIds };
    } else {
      // DC can only see records they issued or for employees they supervise
      whereClause.OR = [
        { issuedById: session.id },
        { houseId: { in: houseIds } },
      ];
    }

    // Apply filters
    if (employeeId) whereClause.employeeId = employeeId;
    if (houseId) whereClause.houseId = houseId;
    if (status) whereClause.status = status;
    if (severityLevel) {
      whereClause.violationCategory = { severityLevel };
    }
    if (startDate) {
      whereClause.violationDate = {
        ...(whereClause.violationDate as object || {}),
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      whereClause.violationDate = {
        ...(whereClause.violationDate as object || {}),
        lte: new Date(endDate),
      };
    }

    const actions = await prisma.correctiveAction.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        issuedBy: {
          select: { id: true, name: true },
        },
        house: {
          select: { id: true, name: true },
        },
        violationCategory: true,
        signatures: {
          select: { signerType: true, signedAt: true },
        },
      },
      orderBy: { violationDate: "desc" },
      take: limit,
    });

    // Calculate stats
    const ninetyDaysAgo = subDays(new Date(), 90);
    const stats = {
      total: actions.length,
      pendingSignatures: actions.filter((a) => a.status === "PENDING_SIGNATURE").length,
      thisWeek: actions.filter((a) => {
        const sevenDaysAgo = subDays(new Date(), 7);
        return a.createdAt >= sevenDaysAgo;
      }).length,
    };

    // Get at-risk employees (14+ points)
    const atRiskEmployees = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT ca."employeeId") as count
      FROM "CorrectiveAction" ca
      WHERE ca."violationDate" >= ${ninetyDaysAgo}
        AND ca.status != 'VOIDED'
      GROUP BY ca."employeeId"
      HAVING SUM(COALESCE(ca."pointsAdjusted", ca."pointsAssigned")) >= 14
    `;

    return NextResponse.json({
      actions,
      stats: {
        ...stats,
        atRiskEmployees: atRiskEmployees.length,
      },
    });
  } catch (error) {
    console.error("Error fetching corrective actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch corrective actions" },
      { status: 500 }
    );
  }
}

// POST /api/corrective-actions - Create new corrective action
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role permissions
    const allowedRoles = ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "You do not have permission to create corrective actions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      employeeId,
      houseId,
      violationCategoryId,
      violationDate,
      violationTime,
      incidentDescription,
      mitigatingCircumstances,
      pointsAssigned,
      pointsAdjusted,
      adjustmentReason,
      correctiveExpectations,
      consequencesText,
      pipScheduled,
      pipDate,
      supervisorSignature,
      witnessId,
      witnessSignature,
    } = body;

    // Validate required fields
    if (!employeeId || !violationCategoryId || !violationDate || !incidentDescription) {
      return NextResponse.json(
        { error: "Employee, violation category, date, and description are required" },
        { status: 400 }
      );
    }

    // Verify employee exists and user has access
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { assignedHouses: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Get violation category for default points
    const category = await prisma.violationCategory.findUnique({
      where: { id: violationCategoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Violation category not found" },
        { status: 404 }
      );
    }

    // Calculate current points before this action
    const currentPoints = await calculateCurrentPoints(employeeId);
    const newPoints = pointsAdjusted ?? pointsAssigned ?? category.defaultPoints;
    const totalPoints = currentPoints + newPoints;

    // Determine discipline level
    const disciplineLevel = getDisciplineLevel(totalPoints);

    // Create corrective action
    const action = await prisma.correctiveAction.create({
      data: {
        employeeId,
        issuedById: session.id,
        houseId: houseId || null,
        violationCategoryId,
        violationDate: new Date(violationDate),
        violationTime: violationTime || null,
        incidentDescription,
        mitigatingCircumstances: mitigatingCircumstances || null,
        pointsAssigned: pointsAssigned ?? category.defaultPoints,
        pointsAdjusted: pointsAdjusted || null,
        adjustmentReason: adjustmentReason || null,
        disciplineLevel,
        correctiveExpectations: correctiveExpectations
          ? JSON.stringify(correctiveExpectations)
          : null,
        consequencesText: consequencesText || "Further violations may result in additional disciplinary action up to and including termination of employment.",
        pipScheduled: pipScheduled || false,
        pipDate: pipDate ? new Date(pipDate) : null,
        status: "PENDING_SIGNATURE",
      },
      include: {
        employee: true,
        violationCategory: true,
        house: true,
      },
    });

    // Create supervisor signature if provided
    if (supervisorSignature) {
      await prisma.correctiveActionSignature.create({
        data: {
          correctiveActionId: action.id,
          signerType: "SUPERVISOR",
          signerId: session.id,
          signatureData: supervisorSignature,
          ipAddress: request.headers.get("x-forwarded-for") || null,
          deviceInfo: request.headers.get("user-agent") || null,
        },
      });
    }

    // Create witness signature if provided
    if (witnessId && witnessSignature) {
      await prisma.correctiveActionSignature.create({
        data: {
          correctiveActionId: action.id,
          signerType: "WITNESS",
          signerId: witnessId,
          signatureData: witnessSignature,
          ipAddress: request.headers.get("x-forwarded-for") || null,
          deviceInfo: request.headers.get("user-agent") || null,
        },
      });
    }

    // Create notification for employee (if they have a linked user account)
    // Note: In a real system, you'd match employee email to user email

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "CORRECTIVE_ACTION",
        entityId: action.id,
        details: JSON.stringify({
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          violation: category.categoryName,
          points: newPoints,
          totalPoints,
          disciplineLevel,
        }),
      },
    });

    // Check if we need to send threshold notifications
    const thresholdNotifications = [];
    if (totalPoints >= 6 && currentPoints < 6) thresholdNotifications.push(6);
    if (totalPoints >= 10 && currentPoints < 10) thresholdNotifications.push(10);
    if (totalPoints >= 14 && currentPoints < 14) thresholdNotifications.push(14);
    if (totalPoints >= 18 && currentPoints < 18) thresholdNotifications.push(18);

    // Create notifications for HR/Admin about threshold crossings
    if (thresholdNotifications.length > 0) {
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "HR"] } },
        select: { id: true },
      });

      for (const admin of admins) {
        for (const threshold of thresholdNotifications) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              title: `Employee at ${threshold}+ Points`,
              message: `${employee.firstName} ${employee.lastName} has reached ${totalPoints} discipline points (threshold: ${threshold})`,
              type: `DISCIPLINE_THRESHOLD_${threshold}`,
              link: `/dashboard/discipline/${action.id}`,
            },
          });
        }
      }
    }

    // Send email notification to employee if they have an email address
    if (employee.email) {
      try {
        await sendCorrectiveActionSignatureRequest({
          employeeEmail: employee.email,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          violationDate: format(new Date(violationDate), "MMMM d, yyyy"),
          violationCategory: category.categoryName,
          severityLevel: category.severityLevel,
          pointsAssigned: newPoints,
          issuedByName: session.name || "Management",
          signLink: `/dashboard/discipline/sign/${action.id}`,
        });
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error("Failed to send corrective action email:", emailError);
      }
    }

    return NextResponse.json({
      action,
      currentPoints,
      newPoints,
      totalPoints,
      thresholdsCrossed: thresholdNotifications,
      emailSent: !!employee.email,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating corrective action:", error);
    return NextResponse.json(
      { error: "Failed to create corrective action" },
      { status: 500 }
    );
  }
}
