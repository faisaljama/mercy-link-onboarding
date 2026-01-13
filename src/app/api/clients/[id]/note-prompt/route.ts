import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get note prompt for a client
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to this client
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId: { in: houseIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        houseId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get the note prompt
    const notePrompt = await prisma.residentNotePrompt.findUnique({
      where: { clientId },
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      notePrompt,
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
      },
    });
  } catch (error) {
    console.error("Error fetching note prompt:", error);
    return NextResponse.json(
      { error: "Failed to fetch note prompt" },
      { status: 500 }
    );
  }
}

// PUT - Create or update note prompt for a client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only DC, DM, HR, Admin can update prompts
    const allowedRoles = ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "You do not have permission to update prompts" },
        { status: 403 }
      );
    }

    const { id: clientId } = await params;
    const houseIds = await getUserHouseIds(session.id);

    // Verify access to this client
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        houseId: { in: houseIds },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { promptText } = await request.json();

    if (!promptText || typeof promptText !== "string" || promptText.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt text is required" },
        { status: 400 }
      );
    }

    // Upsert the note prompt
    const notePrompt = await prisma.residentNotePrompt.upsert({
      where: { clientId },
      create: {
        clientId,
        promptText: promptText.trim(),
        updatedById: session.id,
      },
      update: {
        promptText: promptText.trim(),
        updatedById: session.id,
      },
      include: {
        updatedBy: {
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
        action: "UPDATE",
        entityType: "RESIDENT_NOTE_PROMPT",
        entityId: notePrompt.id,
        details: JSON.stringify({
          clientId,
          clientName: `${client.firstName} ${client.lastName}`,
        }),
      },
    });

    return NextResponse.json({ notePrompt });
  } catch (error) {
    console.error("Error updating note prompt:", error);
    return NextResponse.json(
      { error: "Failed to update note prompt" },
      { status: 500 }
    );
  }
}

// DELETE - Delete note prompt for a client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, DM, DC can delete prompts
    const allowedRoles = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "You do not have permission to delete prompts" },
        { status: 403 }
      );
    }

    const { id: clientId } = await params;

    // Check if prompt exists
    const existing = await prisma.residentNotePrompt.findUnique({
      where: { clientId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    await prisma.residentNotePrompt.delete({
      where: { clientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete note prompt" },
      { status: 500 }
    );
  }
}
