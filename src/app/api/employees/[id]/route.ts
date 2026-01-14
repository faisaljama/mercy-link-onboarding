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

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        assignedHouses: {
          some: { houseId: { in: houseIds } },
        },
      },
      include: {
        assignedHouses: {
          include: { house: { select: { id: true, name: true } } },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

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
    const houseIds = await getUserHouseIds(session.id);

    // Check if employee exists and user has access
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        assignedHouses: {
          some: { houseId: { in: houseIds } },
        },
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
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
      status,
      assignedHouseIds,
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !hireDate || !position) {
      return NextResponse.json(
        { error: "First name, last name, hire date, and position are required" },
        { status: 400 }
      );
    }

    // Verify user has access to all selected houses
    if (assignedHouseIds && assignedHouseIds.length > 0) {
      const invalidHouses = assignedHouseIds.filter(
        (hId: string) => !houseIds.includes(hId)
      );
      if (invalidHouses.length > 0) {
        return NextResponse.json(
          { error: "You don't have access to some selected houses" },
          { status: 403 }
        );
      }
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        hireDate: new Date(hireDate),
        position,
        experienceYears: experienceYears || 0,
        status: status || "ACTIVE",
      },
    });

    // Update house assignments if provided
    if (assignedHouseIds !== undefined) {
      // Remove existing assignments
      await prisma.employeeHouse.deleteMany({
        where: { employeeId: id },
      });

      // Add new assignments
      if (assignedHouseIds.length > 0) {
        await prisma.employeeHouse.createMany({
          data: assignedHouseIds.map((houseId: string) => ({
            employeeId: id,
            houseId,
          })),
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        details: JSON.stringify({
          firstName,
          lastName,
          position,
          status,
          assignedHouseIds,
        }),
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and coordinators can delete employees
    if (session.role === "DSP") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Check if employee exists and user has access
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        assignedHouses: {
          some: { houseId: { in: houseIds } },
        },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Delete employee (cascades to compliance items, documents, house assignments)
    await prisma.employee.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "EMPLOYEE",
        entityId: id,
        details: JSON.stringify({
          firstName: existingEmployee.firstName,
          lastName: existingEmployee.lastName,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
