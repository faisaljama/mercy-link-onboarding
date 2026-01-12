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

// GET - Get a single utility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; utilityId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: houseId, utilityId } = await params;

    const utility = await prisma.houseUtility.findFirst({
      where: {
        id: utilityId,
        houseId: houseId,
      },
    });

    if (!utility) {
      return NextResponse.json({ error: "Utility not found" }, { status: 404 });
    }

    // Filter out sensitive info for non-admin users
    const isAdmin = session.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({
        utility: {
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
        },
      });
    }

    return NextResponse.json({ utility });
  } catch (error) {
    console.error("Error fetching utility:", error);
    return NextResponse.json(
      { error: "Failed to fetch utility" },
      { status: 500 }
    );
  }
}

// PUT - Update a utility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; utilityId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and DC can update utilities
    if (!["ADMIN", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: houseId, utilityId } = await params;
    const body = await request.json();

    // Check if utility exists
    const existingUtility = await prisma.houseUtility.findFirst({
      where: {
        id: utilityId,
        houseId: houseId,
      },
    });

    if (!existingUtility) {
      return NextResponse.json({ error: "Utility not found" }, { status: 404 });
    }

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

    if (utilityType && !UTILITY_TYPES.includes(utilityType)) {
      return NextResponse.json(
        { error: "Invalid utility type" },
        { status: 400 }
      );
    }

    // Only Admin can update login credentials
    const isAdmin = session.role === "ADMIN";

    const updateData: Record<string, unknown> = {};

    if (utilityType !== undefined) updateData.utilityType = utilityType;
    if (providerName !== undefined) updateData.providerName = providerName;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (isAutopay !== undefined) updateData.isAutopay = isAutopay;
    if (paymentCard !== undefined) updateData.paymentCard = paymentCard || null;
    if (serviceDay !== undefined) updateData.serviceDay = serviceDay || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // Only admin can update sensitive fields
    if (isAdmin) {
      if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null;
      if (loginUsername !== undefined) updateData.loginUsername = loginUsername || null;
      if (loginPassword !== undefined) updateData.loginPassword = loginPassword || null;
      if (securityQuestion1 !== undefined) updateData.securityQuestion1 = securityQuestion1 || null;
      if (securityAnswer1 !== undefined) updateData.securityAnswer1 = securityAnswer1 || null;
      if (securityQuestion2 !== undefined) updateData.securityQuestion2 = securityQuestion2 || null;
      if (securityAnswer2 !== undefined) updateData.securityAnswer2 = securityAnswer2 || null;
      if (securityQuestion3 !== undefined) updateData.securityQuestion3 = securityQuestion3 || null;
      if (securityAnswer3 !== undefined) updateData.securityAnswer3 = securityAnswer3 || null;
    }

    const utility = await prisma.houseUtility.update({
      where: { id: utilityId },
      data: updateData,
    });

    // Filter response for non-admin
    if (!isAdmin) {
      return NextResponse.json({
        utility: {
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
        },
      });
    }

    return NextResponse.json({ utility });
  } catch (error) {
    console.error("Error updating utility:", error);
    return NextResponse.json(
      { error: "Failed to update utility" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a utility
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; utilityId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can delete utilities
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: houseId, utilityId } = await params;

    // Check if utility exists
    const existingUtility = await prisma.houseUtility.findFirst({
      where: {
        id: utilityId,
        houseId: houseId,
      },
    });

    if (!existingUtility) {
      return NextResponse.json({ error: "Utility not found" }, { status: 404 });
    }

    await prisma.houseUtility.delete({
      where: { id: utilityId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting utility:", error);
    return NextResponse.json(
      { error: "Failed to delete utility" },
      { status: 500 }
    );
  }
}
