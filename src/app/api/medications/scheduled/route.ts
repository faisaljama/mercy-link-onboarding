import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { put } from "@vercel/blob";

// GET - List scheduled medication verifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, Admin can access
    const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const houseIds = await getUserHouseIds(session.id);
    const searchParams = request.nextUrl.searchParams;

    const houseId = searchParams.get("houseId");
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {
      houseId: houseId && houseIds.includes(houseId) ? houseId : { in: houseIds },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (startDate && endDate) {
      where.visitDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.visitDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.visitDate = { lte: new Date(endDate) };
    }

    const verifications = await prisma.scheduledMedVerification.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { visitDate: "desc" },
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("Error fetching scheduled med verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch verifications" },
      { status: 500 }
    );
  }
}

// POST - Create new scheduled medication verification
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, Admin can create
    const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const clientId = formData.get("clientId") as string;
    const visitDate = formData.get("visitDate") as string;
    const medPackDate = formData.get("medPackDate") as string;
    const notes = formData.get("notes") as string | null;
    const photo = formData.get("photo") as File | null;

    if (!clientId || !visitDate || !medPackDate) {
      return NextResponse.json(
        { error: "Client, visit date, and med pack date are required" },
        { status: 400 }
      );
    }

    if (!photo) {
      return NextResponse.json(
        { error: "Photo of med pack is required" },
        { status: 400 }
      );
    }

    // Verify user has access to client's house
    const houseIds = await getUserHouseIds(session.id);
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { houseId: true },
    });

    if (!client || !houseIds.includes(client.houseId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if dates match - if not, notes are required
    const visitDateObj = new Date(visitDate);
    const medPackDateObj = new Date(medPackDate);
    const datesMatch = visitDateObj.toDateString() === medPackDateObj.toDateString();

    if (!datesMatch && (!notes || notes.trim() === "")) {
      return NextResponse.json(
        { error: "Notes are required when dates do not match" },
        { status: 400 }
      );
    }

    // Upload photo to Vercel Blob
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = photo.name.split(".").pop() || "jpg";
    const filename = `medications/scheduled/${timestamp}-${randomString}.${extension}`;

    const blob = await put(filename, photo, {
      access: "public",
      addRandomSuffix: false,
    });

    // Create verification record
    const verification = await prisma.scheduledMedVerification.create({
      data: {
        clientId,
        houseId: client.houseId,
        visitDate: visitDateObj,
        medPackDate: medPackDateObj,
        photoUrl: blob.url,
        notes: notes || null,
        verifiedById: session.id,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "SCHEDULED_MED_VERIFICATION",
        entityId: verification.id,
        details: JSON.stringify({
          clientId,
          visitDate,
          medPackDate,
          datesMatch,
        }),
      },
    });

    return NextResponse.json({ verification });
  } catch (error) {
    console.error("Error creating scheduled med verification:", error);
    return NextResponse.json(
      { error: "Failed to create verification" },
      { status: 500 }
    );
  }
}
