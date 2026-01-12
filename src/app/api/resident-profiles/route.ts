import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - List resident one-page profiles
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const { searchParams } = new URL(request.url);
    const houseFilter = searchParams.get("houseId");

    // Get clients for accessible houses
    const clientWhereClause: Record<string, unknown> = {
      houseId: { in: houseIds },
      status: "ACTIVE",
    };

    if (houseFilter && houseIds.includes(houseFilter)) {
      clientWhereClause.houseId = houseFilter;
    }

    const profiles = await prisma.residentOnePageProfile.findMany({
      where: {
        client: clientWhereClause,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            houseId: true,
            house: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error fetching resident profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch resident profiles" },
      { status: 500 }
    );
  }
}

// POST - Create resident one-page profile
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await request.json();
    const { clientId, ...profileData } = data;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this client's house
    const userHouseIds = await getUserHouseIds(session.id);
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId: { in: userHouseIds },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or access denied" },
        { status: 404 }
      );
    }

    // Check if profile already exists
    const existing = await prisma.residentOnePageProfile.findUnique({
      where: { clientId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Profile already exists for this client. Use PUT to update." },
        { status: 400 }
      );
    }

    const profile = await prisma.residentOnePageProfile.create({
      data: {
        clientId,
        preferredName: profileData.preferredName || null,
        pronouns: profileData.pronouns || null,
        photoUrl: profileData.photoUrl || null,
        aboutMe: profileData.aboutMe || null,
        communication: profileData.communication || null,
        dailyRoutine: profileData.dailyRoutine || null,
        likesInterests: profileData.likesInterests || null,
        goodDay: profileData.goodDay || null,
        badDay: profileData.badDay || null,
        supportWhenUpset: profileData.supportWhenUpset || null,
        importantPeople: profileData.importantPeople || null,
        medicalAlerts: profileData.medicalAlerts || null,
        culturalConsiderations: profileData.culturalConsiderations || null,
        currentGoals: profileData.currentGoals || null,
        importantToMe: profileData.importantToMe || null,
        importantForMe: profileData.importantForMe || null,
        updatedById: session.id,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "RESIDENT_ONE_PAGE_PROFILE",
        entityId: profile.id,
        details: JSON.stringify({
          clientId,
          clientName: `${profile.client.firstName} ${profile.client.lastName}`,
        }),
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error creating resident profile:", error);
    return NextResponse.json(
      { error: "Failed to create resident profile" },
      { status: 500 }
    );
  }
}
