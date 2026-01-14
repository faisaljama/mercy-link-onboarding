import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET - Fetch client training status for current user (based on their employee record)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");

    // Get the employee record linked to this user with their assigned houses
    const employee = await prisma.employee.findFirst({
      where: {
        email: session.email,
        status: "ACTIVE",
      },
      include: {
        assignedHouses: {
          select: { houseId: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    // Get house IDs from employee's assigned houses (not user's)
    const employeeHouseIds = employee.assignedHouses.map((ah) => ah.houseId);

    if (employeeHouseIds.length === 0) {
      return NextResponse.json({
        clients: [],
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
      });
    }

    // Build where clause for clients - filter by employee's assigned houses
    const clientWhere: Record<string, unknown> = {
      status: "ACTIVE",
      houseId: { in: employeeHouseIds },
    };

    if (houseFilter && employeeHouseIds.includes(houseFilter)) {
      clientWhere.houseId = houseFilter;
    }

    // Get all active clients the user has access to
    const clients = await prisma.client.findMany({
      where: clientWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        house: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ firstName: "asc" }],
    });

    // Get all trainings for this employee
    const trainings = await prisma.serviceRecipientTraining.findMany({
      where: {
        employeeId: employee.id,
        clientId: { in: clients.map((c) => c.id) },
      },
    });

    // Build training status map
    const trainingMap: Record<string, Record<string, { acknowledgedAt: Date; trainerName: string }>> = {};
    for (const training of trainings) {
      if (!trainingMap[training.clientId]) {
        trainingMap[training.clientId] = {};
      }
      trainingMap[training.clientId][training.documentType] = {
        acknowledgedAt: training.acknowledgedAt,
        trainerName: training.trainerName,
      };
    }

    // Combine clients with their training status
    const clientsWithTraining = clients.map((client) => ({
      ...client,
      trainings: trainingMap[client.id] || {},
      completedCount: Object.keys(trainingMap[client.id] || {}).length,
    }));

    return NextResponse.json({
      clients: clientsWithTraining,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
    });
  } catch (error) {
    console.error("Error fetching client training:", error);
    return NextResponse.json({ error: "Failed to fetch client training" }, { status: 500 });
  }
}

// POST - Submit a new training acknowledgment
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the employee record linked to this user with their assigned houses
    const employee = await prisma.employee.findFirst({
      where: {
        email: session.email,
        status: "ACTIVE",
      },
      include: {
        assignedHouses: {
          select: { houseId: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    // Get house IDs from employee's assigned houses
    const employeeHouseIds = employee.assignedHouses.map((ah) => ah.houseId);

    const data = await request.json();
    const { clientId, documentType, trainerName, signatureData } = data;

    // Validate required fields
    if (!clientId || !documentType || !trainerName || !signatureData) {
      return NextResponse.json(
        { error: "clientId, documentType, trainerName, and signatureData are required" },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocTypes = ["IAPP", "SPA", "SMA"];
    if (!validDocTypes.includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type. Must be IAPP, SPA, or SMA" },
        { status: 400 }
      );
    }

    // Verify client access - employee must be assigned to the client's house
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId: { in: employeeHouseIds },
        status: "ACTIVE",
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    // Check if already acknowledged
    const existing = await prisma.serviceRecipientTraining.findUnique({
      where: {
        employeeId_clientId_documentType: {
          employeeId: employee.id,
          clientId,
          documentType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already acknowledged this document for this client" },
        { status: 400 }
      );
    }

    // Get attestation text based on document type
    const attestationTexts: Record<string, string> = {
      IAPP: "I acknowledge that I have received training on this client's Individual Abuse Prevention Plan (IAPP) and understand my responsibilities regarding abuse prevention for this individual.",
      SPA: "I acknowledge that I have received training on this client's Support Plan Addendum (CSSP Addendum) and understand my responsibilities regarding the support and care of this individual.",
      SMA: "I acknowledge that I have received training on this client's Self-Management Assessment and Medication Administration protocols and understand my responsibilities regarding medication administration for this individual.",
    };

    // Create the training acknowledgment
    const training = await prisma.serviceRecipientTraining.create({
      data: {
        employeeId: employee.id,
        clientId,
        documentType,
        trainerName,
        attestationText: attestationTexts[documentType],
        signatureData,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "SERVICE_RECIPIENT_TRAINING",
        entityId: training.id,
        details: JSON.stringify({
          employeeId: employee.id,
          clientId,
          documentType,
          trainerName,
        }),
      },
    });

    return NextResponse.json({ training });
  } catch (error) {
    console.error("Error creating training acknowledgment:", error);
    return NextResponse.json({ error: "Failed to create training acknowledgment" }, { status: 500 });
  }
}
