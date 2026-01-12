import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/clients/[id]/providers - Get all providers for a client
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

    const providers = await prisma.clientProvider.findMany({
      where: { clientId: id },
      orderBy: [{ providerType: "asc" }, { providerName: "asc" }],
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/providers - Add a new provider
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { providerType, providerName, organization, phone, address, notes } = body;

    if (!providerType || !providerName) {
      return NextResponse.json(
        { error: "Provider type and name are required" },
        { status: 400 }
      );
    }

    const provider = await prisma.clientProvider.create({
      data: {
        clientId: id,
        providerType,
        providerName,
        organization: organization || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
