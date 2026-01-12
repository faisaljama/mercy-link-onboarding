import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.billingReport.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Billing report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error fetching billing report:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if report exists
    const existing = await prisma.billingReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Billing report not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    const report = await prisma.billingReport.update({
      where: { id },
      data: {
        status,
        notes,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        entries: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error updating billing report:", error);
    return NextResponse.json(
      { error: "Failed to update billing report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can delete reports
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can delete billing reports" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.billingReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Billing report not found" },
        { status: 404 }
      );
    }

    await prisma.billingReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting billing report:", error);
    return NextResponse.json(
      { error: "Failed to delete billing report" },
      { status: 500 }
    );
  }
}
