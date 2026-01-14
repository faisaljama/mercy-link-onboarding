import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - Fetch all client trainings for a specific employee
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: employeeId } = await context.params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to this employee
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        assignedHouses: {
          some: {
            houseId: { in: houseIds },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get all client trainings for this employee
    const trainings = await prisma.serviceRecipientTraining.findMany({
      where: {
        employeeId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            house: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { client: { firstName: "asc" } },
        { acknowledgedAt: "desc" },
      ],
    });

    // Group trainings by client
    const clientTrainingsMap: Record<
      string,
      {
        clientId: string;
        clientName: string;
        houseId: string;
        houseName: string;
        trainings: Record<string, { acknowledgedAt: Date; trainerName: string }>;
      }
    > = {};

    for (const training of trainings) {
      const clientId = training.clientId;
      if (!clientTrainingsMap[clientId]) {
        clientTrainingsMap[clientId] = {
          clientId,
          clientName: `${training.client.firstName} ${training.client.lastName}`,
          houseId: training.client.house.id,
          houseName: training.client.house.name,
          trainings: {},
        };
      }
      clientTrainingsMap[clientId].trainings[training.documentType] = {
        acknowledgedAt: training.acknowledgedAt,
        trainerName: training.trainerName,
      };
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
      },
      trainings: Object.values(clientTrainingsMap),
    });
  } catch (error) {
    console.error("Error fetching employee client training:", error);
    return NextResponse.json(
      { error: "Failed to fetch client training" },
      { status: 500 }
    );
  }
}
