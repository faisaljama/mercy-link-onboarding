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

    const client = await prisma.client.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      include: {
        house: { select: { id: true, name: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
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

    // Check if client exists and user has access
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      firstName,
      lastName,
      dob,
      admissionDate,
      houseId,
      photoUrl,
      mhCaseManagerName,
      mhCaseManagerEmail,
      mhCaseManagerPhone,
      cadiCaseManagerName,
      cadiCaseManagerEmail,
      cadiCaseManagerPhone,
      legalRepName,
      legalRepPhone,
      waiverType,
      status,
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !dob || !admissionDate || !houseId) {
      return NextResponse.json(
        { error: "First name, last name, DOB, admission date, and house are required" },
        { status: 400 }
      );
    }

    // Verify user has access to the new house
    if (!houseIds.includes(houseId)) {
      return NextResponse.json(
        { error: "You don't have access to the selected house" },
        { status: 403 }
      );
    }

    // Update client
    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        dob: new Date(dob),
        admissionDate: new Date(admissionDate),
        houseId,
        photoUrl: photoUrl || null,
        mhCaseManagerName: mhCaseManagerName || null,
        mhCaseManagerEmail: mhCaseManagerEmail || null,
        mhCaseManagerPhone: mhCaseManagerPhone || null,
        cadiCaseManagerName: cadiCaseManagerName || null,
        cadiCaseManagerEmail: cadiCaseManagerEmail || null,
        cadiCaseManagerPhone: cadiCaseManagerPhone || null,
        legalRepName: legalRepName || null,
        legalRepPhone: legalRepPhone || null,
        waiverType: waiverType || null,
        status: status || "ACTIVE",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: client.id,
        details: JSON.stringify({
          firstName,
          lastName,
          houseId,
          status,
        }),
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
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

    // Only admins and coordinators can delete clients
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Check if client exists and user has access
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        houseId: { in: houseIds },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Delete client (cascades to compliance items and documents)
    await prisma.client.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        entityType: "CLIENT",
        entityId: id,
        details: JSON.stringify({
          firstName: existingClient.firstName,
          lastName: existingClient.lastName,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
