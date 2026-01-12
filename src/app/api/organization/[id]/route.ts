import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Organization credential categories
const CREDENTIAL_CATEGORIES = ["OFFICE", "HR_SYSTEM", "BILLING_SYSTEM", "OTHER"];

// GET - Get a single organization credential
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can access organization credentials
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const credential = await prisma.organizationCredential.findUnique({
      where: { id },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    return NextResponse.json({ credential });
  } catch (error) {
    console.error("Error fetching organization credential:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization credential" },
      { status: 500 }
    );
  }
}

// PUT - Update an organization credential
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can update organization credentials
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if credential exists
    const existingCredential = await prisma.organizationCredential.findUnique({
      where: { id },
    });

    if (!existingCredential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const {
      category,
      name,
      address,
      phone,
      fax,
      websiteUrl,
      loginUsername,
      loginPassword,
      accountNumber,
      securityQuestion1,
      securityAnswer1,
      securityQuestion2,
      securityAnswer2,
      securityQuestion3,
      securityAnswer3,
      wifiNetwork,
      wifiPassword,
      notes,
    } = body;

    if (category && !CREDENTIAL_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (category !== undefined) updateData.category = category;
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (fax !== undefined) updateData.fax = fax || null;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
    if (loginUsername !== undefined) updateData.loginUsername = loginUsername || null;
    if (loginPassword !== undefined) updateData.loginPassword = loginPassword || null;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null;
    if (securityQuestion1 !== undefined) updateData.securityQuestion1 = securityQuestion1 || null;
    if (securityAnswer1 !== undefined) updateData.securityAnswer1 = securityAnswer1 || null;
    if (securityQuestion2 !== undefined) updateData.securityQuestion2 = securityQuestion2 || null;
    if (securityAnswer2 !== undefined) updateData.securityAnswer2 = securityAnswer2 || null;
    if (securityQuestion3 !== undefined) updateData.securityQuestion3 = securityQuestion3 || null;
    if (securityAnswer3 !== undefined) updateData.securityAnswer3 = securityAnswer3 || null;
    if (wifiNetwork !== undefined) updateData.wifiNetwork = wifiNetwork || null;
    if (wifiPassword !== undefined) updateData.wifiPassword = wifiPassword || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const credential = await prisma.organizationCredential.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ credential });
  } catch (error) {
    console.error("Error updating organization credential:", error);
    return NextResponse.json(
      { error: "Failed to update organization credential" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an organization credential
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can delete organization credentials
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if credential exists
    const existingCredential = await prisma.organizationCredential.findUnique({
      where: { id },
    });

    if (!existingCredential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    await prisma.organizationCredential.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization credential:", error);
    return NextResponse.json(
      { error: "Failed to delete organization credential" },
      { status: 500 }
    );
  }
}
