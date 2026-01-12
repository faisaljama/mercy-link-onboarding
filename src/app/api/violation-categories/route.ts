import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/violation-categories - List all violation categories
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.violationCategory.findMany({
      where: { isActive: true },
      orderBy: [
        { severityLevel: "asc" },
        { displayOrder: "asc" },
        { categoryName: "asc" },
      ],
    });

    // Group by severity level for frontend dropdown
    const grouped = {
      MINOR: categories.filter((c) => c.severityLevel === "MINOR"),
      MODERATE: categories.filter((c) => c.severityLevel === "MODERATE"),
      SERIOUS: categories.filter((c) => c.severityLevel === "SERIOUS"),
      CRITICAL: categories.filter((c) => c.severityLevel === "CRITICAL"),
      IMMEDIATE_TERMINATION: categories.filter(
        (c) => c.severityLevel === "IMMEDIATE_TERMINATION"
      ),
    };

    return NextResponse.json({ categories, grouped });
  } catch (error) {
    console.error("Error fetching violation categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/violation-categories - Create a new violation category (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can create categories
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can create violation categories" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      categoryName,
      severityLevel,
      defaultPoints,
      description,
      displayOrder,
    } = body;

    if (!categoryName || !severityLevel || defaultPoints === undefined) {
      return NextResponse.json(
        { error: "Category name, severity level, and default points are required" },
        { status: 400 }
      );
    }

    const validSeverityLevels = [
      "MINOR",
      "MODERATE",
      "SERIOUS",
      "CRITICAL",
      "IMMEDIATE_TERMINATION",
    ];
    if (!validSeverityLevels.includes(severityLevel)) {
      return NextResponse.json(
        { error: "Invalid severity level" },
        { status: 400 }
      );
    }

    const category = await prisma.violationCategory.create({
      data: {
        categoryName,
        severityLevel,
        defaultPoints: parseInt(defaultPoints),
        description: description || null,
        displayOrder: displayOrder || 0,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        entityType: "VIOLATION_CATEGORY",
        entityId: category.id,
        details: JSON.stringify({
          categoryName,
          severityLevel,
          defaultPoints,
        }),
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating violation category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
