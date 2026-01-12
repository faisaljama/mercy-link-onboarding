import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// PUT /api/clients/[id]/providers/[providerId] - Update a provider
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; providerId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { providerId } = await params;
    const body = await request.json();
    const { providerType, providerName, organization, phone, address, notes } = body;

    const provider = await prisma.clientProvider.update({
      where: { id: providerId },
      data: {
        ...(providerType && { providerType }),
        ...(providerName && { providerName }),
        organization: organization ?? undefined,
        phone: phone ?? undefined,
        address: address ?? undefined,
        notes: notes ?? undefined,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/providers/[providerId] - Delete a provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; providerId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { providerId } = await params;

    await prisma.clientProvider.delete({
      where: { id: providerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting provider:", error);
    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}
