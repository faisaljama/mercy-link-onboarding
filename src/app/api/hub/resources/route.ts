import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ResourceCategory, Prisma } from "@prisma/client";

// GET /api/hub/resources - Get all resources with optional category, search, and tag filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    const where: Prisma.HubResourceWhereInput = {
      isActive: true,
    };

    // Filter by category
    if (category && category !== "all" && Object.values(ResourceCategory).includes(category as ResourceCategory)) {
      where.category = category as ResourceCategory;
    }

    // Search in title, description, and tags
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by tag (exact match within comma-separated list)
    if (tag) {
      where.tags = { contains: tag, mode: "insensitive" };
    }

    const resources = await prisma.hubResource.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST /api/hub/resources - Create a new resource (Admin, DM, DC only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins, DMs, and DCs can upload resources
    if (
      session.role !== "ADMIN" &&
      session.role !== "DESIGNATED_MANAGER" &&
      session.role !== "DESIGNATED_COORDINATOR"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { category, title, description, documentUrl, fileName, fileSize, sortOrder, tags } = body;

    if (!category || !title || !documentUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resource = await prisma.hubResource.create({
      data: {
        category,
        title,
        description: description || null,
        documentUrl,
        fileName,
        fileSize: fileSize || null,
        sortOrder: sortOrder || 0,
        tags: tags || null,
        uploadedById: session.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
