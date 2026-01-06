import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { addDays } from "date-fns";

// 245D Training requirements for new employees
const EMPLOYEE_COMPLIANCE_ITEMS = [
  { itemType: "BACKGROUND_STUDY", itemName: "Background Study (NETStudy 2.0)", daysFromHire: 0, statuteRef: "245C.04" },
  { itemType: "MALTREATMENT_TRAINING", itemName: "Maltreatment Reporting Training", daysFromHire: 3, statuteRef: "245D.09, Subd. 4(5)" },
  { itemType: "ORIENTATION_TRAINING", itemName: "Orientation Training (Intensive)", daysFromHire: 60, statuteRef: "245D.09, Subd. 4" },
  { itemType: "FIRST_AID_CPR", itemName: "First Aid/CPR Certification", daysFromHire: 30, statuteRef: "245D.09, Subd. 4(9)" },
  { itemType: "MEDICATION_ADMIN_TRAINING", itemName: "Medication Administration Training", daysFromHire: 30, statuteRef: "245D.09, Subd. 4a(d)" },
  { itemType: "TB_TEST", itemName: "TB Test", daysFromHire: 14, statuteRef: "Company Policy" },
  { itemType: "DRIVERS_LICENSE_CHECK", itemName: "Driver's License Check", daysFromHire: 0, statuteRef: "Company Policy" },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      hireDate,
      position,
      experienceYears,
      assignedHouseIds,
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !hireDate || !position || !assignedHouseIds?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to these houses
    const userHouseIds = await getUserHouseIds(session.id);
    const hasAccess = assignedHouseIds.every((id: string) => userHouseIds.includes(id));
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to one or more selected houses" },
        { status: 403 }
      );
    }

    const hire = new Date(hireDate);
    const expYears = experienceYears || 0;

    // Create employee with compliance items in a transaction
    const employee = await prisma.$transaction(async (tx) => {
      const newEmployee = await tx.employee.create({
        data: {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          hireDate: hire,
          position,
          experienceYears: expYears,
        },
      });

      // Assign houses
      await tx.employeeHouse.createMany({
        data: assignedHouseIds.map((houseId: string) => ({
          employeeId: newEmployee.id,
          houseId,
        })),
      });

      // Auto-generate compliance items
      const complianceItems = [
        ...EMPLOYEE_COMPLIANCE_ITEMS.map((item) => ({
          entityType: "EMPLOYEE",
          itemType: item.itemType,
          itemName: item.itemName,
          dueDate: addDays(hire, item.daysFromHire),
          status: "PENDING",
          statuteRef: item.statuteRef,
          employeeId: newEmployee.id,
        })),
      ];

      // Add annual training requirement
      const annualTrainingHours = expYears >= 5 ? 12 : 24;
      const anniversaryDate = new Date(
        new Date().getFullYear() + 1,
        hire.getMonth(),
        hire.getDate()
      );

      complianceItems.push({
        entityType: "EMPLOYEE",
        itemType: "ANNUAL_TRAINING",
        itemName: `Annual Training (${annualTrainingHours} hours)`,
        dueDate: anniversaryDate,
        status: "PENDING",
        statuteRef: "245D.09, Subd. 5",
        employeeId: newEmployee.id,
      });

      await tx.complianceItem.createMany({
        data: complianceItems,
      });

      return newEmployee;
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        details: JSON.stringify({
          firstName,
          lastName,
          position,
          hireDate,
          assignedHouseIds,
        }),
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("house");

    const whereClause: Record<string, unknown> = {
      status: "ACTIVE",
      assignedHouses: {
        some: {
          houseId: { in: houseIds },
        },
      },
    };

    if (houseFilter && houseFilter !== "all") {
      whereClause.assignedHouses = {
        some: {
          houseId: houseFilter,
        },
      };
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        assignedHouses: {
          include: { house: true },
        },
        _count: {
          select: {
            complianceItems: {
              where: { status: "OVERDUE" },
            },
          },
        },
      },
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
