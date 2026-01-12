import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { EmployeeTrainingPDF, getEmployeeTrainingFilename } from "@/lib/pdf-templates/employee-training-pdf";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const houseIds = await getUserHouseIds(session.id);

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        assignedHouses: {
          some: {
            houseId: { in: houseIds },
          },
        },
      },
      include: {
        assignedHouses: {
          include: {
            house: {
              select: {
                name: true,
              },
            },
          },
        },
        complianceItems: {
          orderBy: { dueDate: "asc" },
          include: {
            documents: {
              select: {
                id: true,
                fileName: true,
                uploadedAt: true,
              },
            },
          },
        },
        trainingLogs: {
          orderBy: [{ logType: "asc" }, { year: "desc" }],
          include: {
            documents: {
              select: {
                id: true,
                fileName: true,
                uploadedAt: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Transform data for PDF
    const pdfData = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      hireDate: employee.hireDate,
      experienceYears: employee.experienceYears,
      email: employee.email,
      phone: employee.phone,
      assignedHouses: employee.assignedHouses.map((ah) => ({
        house: { name: ah.house.name },
      })),
      complianceItems: employee.complianceItems.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        itemName: item.itemName,
        dueDate: item.dueDate,
        completedDate: item.completedDate,
        status: item.status,
        statuteRef: item.statuteRef,
        notes: item.notes,
        documents: item.documents.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt,
        })),
      })),
      trainingLogs: employee.trainingLogs.map((log) => ({
        id: log.id,
        logType: log.logType,
        year: log.year,
        checklistItems: log.checklistItems,
        hoursRequired: log.hoursRequired,
        hoursCompleted: log.hoursCompleted,
        employeeSignedAt: log.employeeSignedAt,
        supervisorSignedAt: log.supervisorSignedAt,
        documents: log.documents.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt,
        })),
      })),
    };

    const pdfBuffer = await renderToBuffer(
      <EmployeeTrainingPDF employee={pdfData} />
    );

    const filename = getEmployeeTrainingFilename(employee);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating employee training PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
