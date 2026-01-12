import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

// GET - Get single resident profile by client ID or profile ID
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

    // Try to find by profile ID first, then by client ID
    let profile = await prisma.residentOnePageProfile.findFirst({
      where: {
        OR: [{ id }, { clientId: id }],
        client: {
          houseId: { in: houseIds },
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            dob: true,
            admissionDate: true,
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
    });

    if (!profile) {
      // Return empty profile structure for clients without a profile yet
      const client = await prisma.client.findFirst({
        where: {
          id,
          houseId: { in: houseIds },
          status: "ACTIVE",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          dob: true,
          admissionDate: true,
          houseId: true,
          house: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client or profile not found" },
          { status: 404 }
        );
      }

      // Return a stub profile
      return NextResponse.json({
        profile: {
          id: null,
          clientId: client.id,
          client,
          preferredName: null,
          pronouns: null,
          photoUrl: client.photoUrl,
          aboutMe: null,
          communication: null,
          dailyRoutine: null,
          likesInterests: null,
          goodDay: null,
          badDay: null,
          supportWhenUpset: null,
          importantPeople: null,
          medicalAlerts: null,
          culturalConsiderations: null,
          currentGoals: null,
          importantToMe: null,
          importantForMe: null,
          version: 0,
          updatedAt: null,
          updatedBy: null,
        },
        isNew: true,
      });
    }

    return NextResponse.json({ profile, isNew: false });
  } catch (error) {
    console.error("Error fetching resident profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch resident profile" },
      { status: 500 }
    );
  }
}

// PUT - Update resident profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const houseIds = await getUserHouseIds(session.id);

    // Find existing profile by ID or clientId
    const existing = await prisma.residentOnePageProfile.findFirst({
      where: {
        OR: [{ id }, { clientId: id }],
        client: {
          houseId: { in: houseIds },
        },
      },
    });

    const profileData = {
      preferredName: data.preferredName || null,
      pronouns: data.pronouns || null,
      photoUrl: data.photoUrl || null,
      aboutMe: data.aboutMe || null,
      communication: data.communication || null,
      dailyRoutine: data.dailyRoutine || null,
      likesInterests: data.likesInterests || null,
      goodDay: data.goodDay || null,
      badDay: data.badDay || null,
      supportWhenUpset: data.supportWhenUpset || null,
      importantPeople: data.importantPeople || null,
      medicalAlerts: data.medicalAlerts || null,
      culturalConsiderations: data.culturalConsiderations || null,
      currentGoals: data.currentGoals || null,
      importantToMe: data.importantToMe || null,
      importantForMe: data.importantForMe || null,
      updatedById: session.id,
    };

    let profile;

    if (existing) {
      // Update existing profile
      profile = await prisma.residentOnePageProfile.update({
        where: { id: existing.id },
        data: {
          ...profileData,
          version: { increment: 1 },
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
    } else {
      // Create new profile (id is clientId)
      const client = await prisma.client.findFirst({
        where: {
          id,
          houseId: { in: houseIds },
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      profile = await prisma.residentOnePageProfile.create({
        data: {
          clientId: id,
          ...profileData,
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
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: existing ? "UPDATE" : "CREATE",
        entityType: "RESIDENT_ONE_PAGE_PROFILE",
        entityId: profile.id,
        details: JSON.stringify({
          clientId: profile.clientId,
          clientName: `${profile.client.firstName} ${profile.client.lastName}`,
          version: profile.version,
        }),
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating resident profile:", error);
    return NextResponse.json(
      { error: "Failed to update resident profile" },
      { status: 500 }
    );
  }
}
