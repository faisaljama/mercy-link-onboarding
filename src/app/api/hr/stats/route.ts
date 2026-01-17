import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { APPLICATION_STATUS } from "@/lib/hr/constants";

// GET /api/hr/stats - Get HR dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "DESIGNATED_COORDINATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get counts by status
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const counts: Record<string, number> = {
      total: 0,
      draft: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      onboarding: 0,
      completed: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const item of statusCounts) {
      const key = item.status.toLowerCase().replace(/_/g, "");
      if (key === "under_review") {
        counts.underReview = item._count.id;
      } else {
        counts[key] = item._count.id;
      }
      counts.total += item._count.id;
    }

    // Get pending review count (SUBMITTED + UNDER_REVIEW)
    counts.pendingReview = counts.submitted + counts.underReview;

    // Get in progress count (APPROVED + ONBOARDING)
    counts.inProgress = counts.approved + counts.onboarding;

    // Get recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentApplications = await prisma.jobApplication.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Get applications needing attention
    const needsAttention = await prisma.jobApplication.findMany({
      where: {
        status: {
          in: [APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.COMPLETED],
        },
      },
      select: {
        id: true,
        status: true,
        firstName: true,
        lastName: true,
        email: true,
        submittedAt: true,
        completedAt: true,
      },
      orderBy: [
        { submittedAt: "asc" },
        { completedAt: "asc" },
      ],
      take: 10,
    });

    return NextResponse.json({
      counts,
      recentApplications,
      needsAttention: needsAttention.map((app) => ({
        ...app,
        name: [app.firstName, app.lastName].filter(Boolean).join(" ") || app.email,
      })),
    });
  } catch (error) {
    console.error("Error fetching HR stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
