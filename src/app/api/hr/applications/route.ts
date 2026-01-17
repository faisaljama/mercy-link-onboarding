import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/hr/applications - List all applications (HR only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and DESIGNATED_COORDINATOR can access HR routes
    if (!["ADMIN", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      status?: string;
      OR?: Array<{
        firstName?: { contains: string; mode: "insensitive" };
        lastName?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch applications
    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        select: {
          id: true,
          status: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          positionAppliedFor: true,
          employmentType: true,
          createdAt: true,
          submittedAt: true,
          approvedAt: true,
          completedAt: true,
          reviewer: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              formSubmissions: {
                where: { status: "COMPLETED" },
              },
            },
          },
        },
        orderBy: [
          { submittedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // Get status counts for filters
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    for (const item of statusCounts) {
      counts[item.status] = item._count.id;
    }

    return NextResponse.json({
      applications: applications.map((app) => ({
        ...app,
        name: [app.firstName, app.lastName].filter(Boolean).join(" ") || "Not provided",
        completedForms: app._count.formSubmissions,
        totalForms: 17, // 2 pre-hire + 15 onboarding
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts: counts,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
