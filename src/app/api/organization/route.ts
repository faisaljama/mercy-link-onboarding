import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Organization credential categories
const CREDENTIAL_CATEGORIES = ["OFFICE", "HR_SYSTEM", "BILLING_SYSTEM", "OTHER"];

// GET - List all organization credentials
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can access organization credentials
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const credentials = await prisma.organizationCredential.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("Error fetching organization credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization credentials" },
      { status: 500 }
    );
  }
}

// POST - Create a new organization credential
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can create organization credentials
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

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

    if (!category || !name) {
      return NextResponse.json(
        { error: "Category and name are required" },
        { status: 400 }
      );
    }

    if (!CREDENTIAL_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const credential = await prisma.organizationCredential.create({
      data: {
        category,
        name,
        address: address || null,
        phone: phone || null,
        fax: fax || null,
        websiteUrl: websiteUrl || null,
        loginUsername: loginUsername || null,
        loginPassword: loginPassword || null,
        accountNumber: accountNumber || null,
        securityQuestion1: securityQuestion1 || null,
        securityAnswer1: securityAnswer1 || null,
        securityQuestion2: securityQuestion2 || null,
        securityAnswer2: securityAnswer2 || null,
        securityQuestion3: securityQuestion3 || null,
        securityAnswer3: securityAnswer3 || null,
        wifiNetwork: wifiNetwork || null,
        wifiPassword: wifiPassword || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ credential }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization credential:", error);
    return NextResponse.json(
      { error: "Failed to create organization credential" },
      { status: 500 }
    );
  }
}
