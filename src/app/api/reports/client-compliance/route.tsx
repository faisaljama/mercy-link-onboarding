import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { ClientCompliancePDF, getClientComplianceFilename } from "@/lib/pdf-templates/client-compliance-pdf";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 });
    }

    const houseIds = await getUserHouseIds(session.id);

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId: { in: houseIds },
      },
      include: {
        house: {
          select: {
            name: true,
            address: true,
          },
        },
        complianceItems: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Transform data for PDF
    const pdfData = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      dob: client.dob,
      admissionDate: client.admissionDate,
      status: client.status,
      waiverType: client.waiverType,
      house: client.house,
      complianceItems: client.complianceItems.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        itemName: item.itemName,
        dueDate: item.dueDate,
        completedDate: item.completedDate,
        status: item.status,
        statuteRef: item.statuteRef,
        notes: item.notes,
      })),
    };

    const pdfBuffer = await renderToBuffer(
      <ClientCompliancePDF client={pdfData} />
    );

    const filename = getClientComplianceFilename(client);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating client compliance PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
