import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { APPLICATION_STATUS } from "@/lib/hr/constants";

// POST /api/hr/applications/[applicationId]/create-employee - Create employee from application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId } = await params;
    const body = await request.json();

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        employee: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if employee already created
    if (application.employeeId) {
      return NextResponse.json(
        { error: "Employee has already been created for this application" },
        { status: 400 }
      );
    }

    // Can only create employee from COMPLETED applications
    if (application.status !== APPLICATION_STATUS.COMPLETED) {
      return NextResponse.json(
        { error: "Can only create employee from completed applications" },
        { status: 400 }
      );
    }

    // Validate required data
    if (!application.firstName || !application.lastName) {
      return NextResponse.json(
        { error: "Application is missing required name information" },
        { status: 400 }
      );
    }

    // Get assigned houses from request
    const assignedHouseIds: string[] = body.assignedHouseIds || [];

    // Create employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create employee
      const employee = await tx.employee.create({
        data: {
          firstName: application.firstName!,
          lastName: application.lastName!,
          email: application.email,
          phone: application.phone,
          hireDate: new Date(),
          position: body.position || "DSP",
          status: "ACTIVE",
        },
      });

      // Assign to houses if provided
      if (assignedHouseIds.length > 0) {
        await tx.employeeHouse.createMany({
          data: assignedHouseIds.map((houseId: string) => ({
            employeeId: employee.id,
            houseId,
          })),
        });
      }

      // Update application with employee link and status
      await tx.jobApplication.update({
        where: { id: applicationId },
        data: {
          employeeId: employee.id,
          status: APPLICATION_STATUS.HIRED,
        },
      });

      // Create standard compliance items for the new employee
      const complianceItems = [
        {
          entityType: "EMPLOYEE",
          itemType: "BACKGROUND_STUDY",
          itemName: "Background Study (NETStudy 2.0)",
          dueDate: new Date(), // Already should be done
          status: "COMPLETED",
          completedDate: new Date(),
          statuteRef: "245C.04",
          employeeId: employee.id,
        },
        {
          entityType: "EMPLOYEE",
          itemType: "MALTREATMENT_TRAINING",
          itemName: "Maltreatment Reporting Training",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          status: "PENDING",
          statuteRef: "245D.09, Subd. 4(5)",
          employeeId: employee.id,
        },
        {
          entityType: "EMPLOYEE",
          itemType: "ORIENTATION_TRAINING",
          itemName: "Orientation Training",
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          status: "PENDING",
          statuteRef: "245D.09, Subd. 4",
          employeeId: employee.id,
        },
        {
          entityType: "EMPLOYEE",
          itemType: "FIRST_AID_CPR",
          itemName: "First Aid/CPR Certification",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: "PENDING",
          statuteRef: "245D.09, Subd. 4(9)",
          employeeId: employee.id,
        },
      ];

      await tx.complianceItem.createMany({
        data: complianceItems,
      });

      return employee;
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE_EMPLOYEE",
        entityType: "EMPLOYEE",
        entityId: result.id,
        details: JSON.stringify({
          applicationId,
          employeeId: result.id,
          assignedHouses: assignedHouseIds,
        }),
      },
    });

    return NextResponse.json({
      employee: result,
      message: "Employee created successfully",
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
