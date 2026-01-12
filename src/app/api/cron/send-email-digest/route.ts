import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDailyDigestEmail } from "@/lib/email";

// This endpoint sends daily email digests to users with unread notifications
// Should be called by a cron job after the notification generation
// Add to vercel.json:
// { "crons": [{ "path": "/api/cron/send-email-digest", "schedule": "0 9 * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Security check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get all users who have email notifications enabled
    const users = await prisma.user.findMany({
      where: {
        emailNotifications: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const user of users) {
      if (!user.email) continue;

      // Get unread notifications created today
      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          isRead: false,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: [
          { type: "asc" },
          { createdAt: "desc" },
        ],
      });

      // Skip if no notifications
      if (notifications.length === 0) continue;

      // Send digest email
      const success = await sendDailyDigestEmail({
        recipientName: user.name,
        recipientEmail: user.email,
        notifications: notifications.map((n) => ({
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link || "/dashboard",
        })),
      });

      if (success) {
        emailsSent++;
      } else {
        emailsFailed++;
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      emailsFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending email digests:", error);
    return NextResponse.json(
      { error: "Failed to send email digests" },
      { status: 500 }
    );
  }
}
