import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { HouseCompliancePDF, getHouseComplianceFilename } from "@/lib/pdf-templates/house-compliance-pdf";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const houseId = searchParams.get("houseId");

    if (!houseId) {
      return NextResponse.json({ error: "House ID required" }, { status: 400 });
    }

    const houseIds = await getUserHouseIds(session.id);

    if (!houseIds.includes(houseId)) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    const house = await prisma.house.findUnique({
      where: { id: houseId },
      include: {
        clients: {
          where: { status: "ACTIVE" },
          include: {
            complianceItems: {
              where: { status: { in: ["PENDING", "OVERDUE"] } },
              orderBy: { dueDate: "asc" },
              take: 1,
            },
            _count: {
              select: {
                complianceItems: { where: { status: "OVERDUE" } },
              },
            },
          },
          orderBy: { lastName: "asc" },
        },
        employees: {
          include: {
            employee: {
              include: {
                complianceItems: {
                  where: { status: { in: ["PENDING", "OVERDUE"] } },
                  orderBy: { dueDate: "asc" },
                  take: 1,
                },
                _count: {
                  select: {
                    complianceItems: { where: { status: "OVERDUE" } },
                  },
                },
              },
            },
          },
        },
        assignedUsers: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    // Transform data for PDF
    const pdfData = {
      id: house.id,
      name: house.name,
      address: house.address,
      county: house.county,
      capacity: house.capacity,
      licenseNumber: house.licenseNumber,
      clients: house.clients.map((client) => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        waiverType: client.waiverType,
        status: client.status,
        complianceItems: client.complianceItems.map((item) => ({
          id: item.id,
          itemType: item.itemType,
          itemName: item.itemName,
          dueDate: item.dueDate,
          status: item.status,
        })),
        _count: client._count,
      })),
      employees: house.employees.map((eh) => ({
        employee: {
          id: eh.employee.id,
          firstName: eh.employee.firstName,
          lastName: eh.employee.lastName,
          position: eh.employee.position,
          complianceItems: eh.employee.complianceItems.map((item) => ({
            id: item.id,
            itemType: item.itemType,
            itemName: item.itemName,
            dueDate: item.dueDate,
            status: item.status,
          })),
          _count: eh.employee._count,
        },
      })),
      assignedUsers: house.assignedUsers.map((au) => ({
        user: {
          name: au.user.name,
          role: au.user.role,
        },
      })),
    };

    const pdfBuffer = await renderToBuffer(
      <HouseCompliancePDF house={pdfData} />
    );

    const filename = getHouseComplianceFilename(house);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating house compliance PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
