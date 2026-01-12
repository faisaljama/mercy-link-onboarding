import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Default categories to seed if none exist
const DEFAULT_CATEGORIES = [
  { name: "Compliance", color: "#EF4444" },
  { name: "Maintenance", color: "#F59E0B" },
  { name: "Training", color: "#8B5CF6" },
  { name: "Administrative", color: "#3B82F6" },
  { name: "Household", color: "#10B981" },
  { name: "Client Care", color: "#EC4899" },
];

// GET - List all task categories
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if categories exist, seed if empty
    let categories = await prisma.taskCategory.findMany({
      orderBy: { name: "asc" },
    });

    if (categories.length === 0) {
      // Seed default categories
      await prisma.taskCategory.createMany({
        data: DEFAULT_CATEGORIES,
      });
      categories = await prisma.taskCategory.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching task categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch task categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new task category
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, DM, and DC can create categories
    if (session.role === "LEAD_STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existing = await prisma.taskCategory.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.taskCategory.create({
      data: {
        name,
        color: color || "#3B82F6",
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating task category:", error);
    return NextResponse.json(
      { error: "Failed to create task category" },
      { status: 500 }
    );
  }
}
