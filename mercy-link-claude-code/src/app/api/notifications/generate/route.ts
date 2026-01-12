import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, format } from "date-fns";

// This endpoint generates notifications for upcoming and overdue compliance items
// It should be called by a cron job (e.g., daily)
// For Vercel, add this to vercel.json:
// { "crons": [{ "path": "/api/notifications/generate", "schedule": "0 8 * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow in development without secret
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const today = new Date();
    const in7Days = addDays(today, 7);
    const in14Days = addDays(today, 14);
    const in30Days = addDays(today, 30);

    // Get all users with their house assignments
    const users = await prisma.user.findMany({
      include: {
        assignedHouses: true,
      },
    });

    let notificationsCreated = 0;

    for (const user of users) {
      // Get house IDs this user has access to
      const houseIds = user.role === "ADMIN"
        ? (await prisma.house.findMany({ select: { id: true } })).map(h => h.id)
        : user.assignedHouses.map(ah => ah.houseId);

      if (houseIds.length === 0) continue;

      // Find overdue items
      const overdueItems = await prisma.complianceItem.findMany({
        where: {
          status: "OVERDUE",
          OR: [
            { client: { houseId: { in: houseIds } } },
            { employee: { assignedHouses: { some: { houseId: { in: houseIds } } } } },
          ],
        },
        include: {
          client: { include: { house: true } },
          employee: true,
        },
      });

      // Find items due within 7 days
      const upcomingItems = await prisma.complianceItem.findMany({
        where: {
          status: "PENDING",
          dueDate: {
            gte: today,
            lte: in7Days,
          },
          OR: [
            { client: { houseId: { in: houseIds } } },
            { employee: { assignedHouses: { some: { houseId: { in: houseIds } } } } },
          ],
        },
        include: {
          client: { include: { house: true } },
          employee: true,
        },
      });

      // Create overdue notifications (if not already notified today)
      for (const item of overdueItems) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: "OVERDUE",
            link: item.clientId
              ? `/dashboard/clients/${item.clientId}`
              : `/dashboard/employees/${item.employeeId}`,
            createdAt: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
            },
          },
        });

        if (!existingNotification) {
          const entityName = item.client
            ? `${item.client.firstName} ${item.client.lastName}`
            : item.employee
            ? `${item.employee.firstName} ${item.employee.lastName}`
            : "Unknown";

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "Overdue Compliance Item",
              message: `"${item.itemName}" for ${entityName} is overdue`,
              type: "OVERDUE",
              link: item.clientId
                ? `/dashboard/clients/${item.clientId}`
                : `/dashboard/employees/${item.employeeId}`,
            },
          });
          notificationsCreated++;
        }
      }

      // Create upcoming deadline notifications
      for (const item of upcomingItems) {
        const daysUntilDue = Math.ceil(
          (item.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: "DEADLINE_WARNING",
            link: item.clientId
              ? `/dashboard/clients/${item.clientId}`
              : `/dashboard/employees/${item.employeeId}`,
            createdAt: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
            },
          },
        });

        if (!existingNotification) {
          const entityName = item.client
            ? `${item.client.firstName} ${item.client.lastName}`
            : item.employee
            ? `${item.employee.firstName} ${item.employee.lastName}`
            : "Unknown";

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`,
              message: `"${item.itemName}" for ${entityName} is due ${format(item.dueDate, "MMM d")}`,
              type: "DEADLINE_WARNING",
              link: item.clientId
                ? `/dashboard/clients/${item.clientId}`
                : `/dashboard/employees/${item.employeeId}`,
            },
          });
          notificationsCreated++;
        }
      }
    }

    // Update overdue statuses
    await prisma.complianceItem.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: today },
      },
      data: {
        status: "OVERDUE",
      },
    });

    return NextResponse.json({
      success: true,
      notificationsCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating notifications:", error);
    return NextResponse.json(
      { error: "Failed to generate notifications" },
      { status: 500 }
    );
  }
}
