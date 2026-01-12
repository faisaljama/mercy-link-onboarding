import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { subDays } from "date-fns";
import {
  CorrectiveActionPDF,
  getCorrectiveActionFilename,
} from "@/lib/pdf-templates/corrective-action-pdf";

async function calculateCurrentPoints(employeeId: string): Promise<number> {
  const ninetyDaysAgo = subDays(new Date(), 90);

  const actions = await prisma.correctiveAction.findMany({
    where: {
      employeeId,
      violationDate: { gte: ninetyDaysAgo },
      status: { not: "VOIDED" },
    },
    select: {
      pointsAssigned: true,
      pointsAdjusted: true,
    },
  });

  return actions.reduce((total, action) => {
    return total + (action.pointsAdjusted ?? action.pointsAssigned);
  }, 0);
}

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
          include: {
            signer: { select: { name: true } },
          },
        },
      },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Corrective action not found" },
        { status: 404 }
      );
    }

    // Get current points for the employee
    const currentPoints = await calculateCurrentPoints(action.employeeId);

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      CorrectiveActionPDF({ action, currentPoints })
    );

    // Get filename
    const filename = getCorrectiveActionFilename(action);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF response
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating corrective action PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
