import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Utility types for reference
const UTILITY_TYPES = [
  "ELECTRIC",
  "GAS",
  "WATER",
  "INTERNET",
  "WIFI",
  "TRASH",
  "MAINTENANCE",
  "SECURITY_CAMERA",
  "PEST_CONTROL",
  "SNOW_REMOVAL",
  "OTHER",
];

// GET - List all utilities for a house
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: houseId } = await params;

    // Check if user has access to this house
    const userHouse = await prisma.userHouse.findFirst({
      where: {
        userId: session.id,
        houseId: houseId,
      },
    });

    // Allow if user is assigned to house OR is admin
    if (!userHouse && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const utilities = await prisma.houseUtility.findMany({
      where: { houseId },
      orderBy: { utilityType: "asc" },
    });

    // Filter out sensitive info for non-admin users
    const isAdmin = session.role === "ADMIN";
    const filteredUtilities = utilities.map((utility) => {
      if (isAdmin) {
        return utility;
      }
      // Remove sensitive login details and security questions for non-admin users
      return {
        ...utility,
        loginUsername: null,
        loginPassword: null,
        accountNumber: null,
        securityQuestion1: null,
        securityAnswer1: null,
        securityQuestion2: null,
        securityAnswer2: null,
        securityQuestion3: null,
        securityAnswer3: null,
      };
    });

    return NextResponse.json({ utilities: filteredUtilities });
  } catch (error) {
    console.error("Error fetching utilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch utilities" },
      { status: 500 }
    );
  }
}

// POST - Create a new utility
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and DC can create utilities
    if (!["ADMIN", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: houseId } = await params;
    const body = await request.json();

    const {
      utilityType,
      providerName,
      websiteUrl,
      phoneNumber,
      accountNumber,
      loginUsername,
      loginPassword,
      securityQuestion1,
      securityAnswer1,
      securityQuestion2,
      securityAnswer2,
      securityQuestion3,
      securityAnswer3,
      isAutopay,
      paymentCard,
      serviceDay,
      notes,
    } = body;

    if (!utilityType || !providerName) {
      return NextResponse.json(
        { error: "Utility type and provider name are required" },
        { status: 400 }
      );
    }

    if (!UTILITY_TYPES.includes(utilityType)) {
      return NextResponse.json(
        { error: "Invalid utility type" },
        { status: 400 }
      );
    }

    // Verify house exists
    const house = await prisma.house.findUnique({
      where: { id: houseId },
    });

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    // Only Admin can set login credentials
    const isAdmin = session.role === "ADMIN";

    const utility = await prisma.houseUtility.create({
      data: {
        houseId,
        utilityType,
        providerName,
        websiteUrl: websiteUrl || null,
        phoneNumber: phoneNumber || null,
        accountNumber: isAdmin ? accountNumber || null : null,
        loginUsername: isAdmin ? loginUsername || null : null,
        loginPassword: isAdmin ? loginPassword || null : null,
        securityQuestion1: isAdmin ? securityQuestion1 || null : null,
        securityAnswer1: isAdmin ? securityAnswer1 || null : null,
        securityQuestion2: isAdmin ? securityQuestion2 || null : null,
        securityAnswer2: isAdmin ? securityAnswer2 || null : null,
        securityQuestion3: isAdmin ? securityQuestion3 || null : null,
        securityAnswer3: isAdmin ? securityAnswer3 || null : null,
        isAutopay: isAutopay || false,
        paymentCard: paymentCard || null,
        serviceDay: serviceDay || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ utility }, { status: 201 });
  } catch (error) {
    console.error("Error creating utility:", error);
    return NextResponse.json(
      { error: "Failed to create utility" },
      { status: 500 }
    );
  }
}
