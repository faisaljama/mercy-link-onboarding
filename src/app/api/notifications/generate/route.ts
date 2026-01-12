import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, addMonths, differenceInDays, format } from "date-fns";

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

    // ========================================
    // MEETING COMPLIANCE NOTIFICATIONS
    // Generate notifications for upcoming 245D meetings
    // based on client admission date
    // ========================================

    const MEETING_SCHEDULES = [
      { type: "INITIAL_45_60_DAY", daysFromAdmission: 45, label: "Initial Planning (45/60 Day)" },
      { type: "SEMI_ANNUAL", monthsFromAdmission: 6, recurring: true, label: "Semi-Annual Review" },
      { type: "ANNUAL", monthsFromAdmission: 12, recurring: true, label: "Annual Meeting" },
    ];

    const REMINDER_DAYS = 45; // Notify 45 days before due date

    for (const user of users) {
      // Get house IDs this user has access to
      const userHouseIds = user.role === "ADMIN"
        ? (await prisma.house.findMany({ select: { id: true } })).map(h => h.id)
        : user.assignedHouses.map(ah => ah.houseId);

      if (userHouseIds.length === 0) continue;

      // Get all clients in user's houses
      const clients = await prisma.client.findMany({
        where: {
          houseId: { in: userHouseIds },
        },
        include: {
          meetingCompliance: true,
          house: true,
        },
      });

      for (const client of clients) {
        const admissionDate = new Date(client.admissionDate);
        const clientName = `${client.firstName} ${client.lastName}`;

        for (const schedule of MEETING_SCHEDULES) {
          // Calculate due dates for this meeting type
          const dueDates: { date: Date; year: number }[] = [];

          if (schedule.daysFromAdmission) {
            // One-time meeting (Initial 45/60 Day)
            dueDates.push({
              date: addDays(admissionDate, schedule.daysFromAdmission),
              year: 1,
            });
          } else if (schedule.monthsFromAdmission && schedule.recurring) {
            // Recurring meetings (Semi-Annual, Annual)
            // Calculate for years 1-5
            for (let year = 1; year <= 5; year++) {
              const monthsToAdd = schedule.monthsFromAdmission * year;
              dueDates.push({
                date: addMonths(admissionDate, monthsToAdd),
                year: year,
              });
            }
          }

          for (const { date: dueDate, year } of dueDates) {
            const daysUntilDue = differenceInDays(dueDate, today);

            // Check if meeting already exists for this type and year
            const existingMeeting = client.meetingCompliance.find(
              (m) => m.meetingType === schedule.type && m.year === year
            );

            // Skip if meeting already completed
            if (existingMeeting) continue;

            // Generate notification if within reminder window (45 days before) or overdue
            if (daysUntilDue <= REMINDER_DAYS && daysUntilDue >= -30) {
              // Check if we already sent a notification today
              const existingNotification = await prisma.notification.findFirst({
                where: {
                  userId: user.id,
                  type: daysUntilDue < 0 ? "MEETING_OVERDUE" : "MEETING_REMINDER",
                  link: `/dashboard/clients/${client.id}`,
                  message: { contains: schedule.label },
                  createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  },
                },
              });

              if (!existingNotification) {
                if (daysUntilDue < 0) {
                  // Overdue notification
                  await prisma.notification.create({
                    data: {
                      userId: user.id,
                      title: "Meeting Overdue",
                      message: `${schedule.label} (Year ${year}) for ${clientName} was due ${format(dueDate, "MMM d, yyyy")}`,
                      type: "MEETING_OVERDUE",
                      link: `/dashboard/clients/${client.id}`,
                    },
                  });
                  notificationsCreated++;
                } else if (daysUntilDue <= 7) {
                  // Urgent reminder (within 7 days)
                  await prisma.notification.create({
                    data: {
                      userId: user.id,
                      title: `Meeting Due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`,
                      message: `${schedule.label} (Year ${year}) for ${clientName} is due ${format(dueDate, "MMM d")}`,
                      type: "MEETING_REMINDER",
                      link: `/dashboard/clients/${client.id}`,
                    },
                  });
                  notificationsCreated++;
                } else if (daysUntilDue <= 14) {
                  // 2-week reminder
                  await prisma.notification.create({
                    data: {
                      userId: user.id,
                      title: "Meeting Due in 2 Weeks",
                      message: `${schedule.label} (Year ${year}) for ${clientName} is due ${format(dueDate, "MMM d")}`,
                      type: "MEETING_REMINDER",
                      link: `/dashboard/clients/${client.id}`,
                    },
                  });
                  notificationsCreated++;
                } else if (daysUntilDue <= 30) {
                  // 30-day reminder
                  await prisma.notification.create({
                    data: {
                      userId: user.id,
                      title: "Meeting Due in 30 Days",
                      message: `${schedule.label} (Year ${year}) for ${clientName} is due ${format(dueDate, "MMM d")}`,
                      type: "MEETING_REMINDER",
                      link: `/dashboard/clients/${client.id}`,
                    },
                  });
                  notificationsCreated++;
                } else if (daysUntilDue <= 45) {
                  // 45-day reminder
                  await prisma.notification.create({
                    data: {
                      userId: user.id,
                      title: "Meeting Due in 45 Days",
                      message: `${schedule.label} (Year ${year}) for ${clientName} is due ${format(dueDate, "MMM d")}`,
                      type: "MEETING_REMINDER",
                      link: `/dashboard/clients/${client.id}`,
                    },
                  });
                  notificationsCreated++;
                }
              }
            }
          }
        }
      }
    }

    // ========================================
    // TASK NOTIFICATIONS
    // Generate notifications for upcoming and overdue tasks
    // ========================================

    const in3Days = addDays(today, 3);

    for (const user of users) {
      // Get house IDs this user has access to
      const userHouseIds = user.role === "ADMIN"
        ? (await prisma.house.findMany({ select: { id: true } })).map(h => h.id)
        : user.assignedHouses.map(ah => ah.houseId);

      // Check if user's role is in the assigned roles of tasks
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Find overdue tasks assigned to this user's role
      const overdueTasks = await prisma.task.findMany({
        where: {
          status: "PENDING",
          dueDate: { lt: today },
          month: currentMonth,
          year: currentYear,
          OR: [
            { houseId: { in: userHouseIds } },
            { houseId: null },
          ],
        },
        include: {
          house: { select: { name: true } },
        },
      });

      // Filter tasks by assigned roles
      const overdueTasksForUser = overdueTasks.filter((task) => {
        try {
          const assignedRoles = JSON.parse(task.assignedRoles);
          return assignedRoles.includes(user.role);
        } catch {
          return false;
        }
      });

      // Create overdue task notifications
      for (const task of overdueTasksForUser) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: "TASK_OVERDUE",
            link: `/dashboard/tasks/${task.id}`,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "Task Overdue",
              message: `Task "${task.title}" is overdue${task.house ? ` (${task.house.name})` : ""}`,
              type: "TASK_OVERDUE",
              link: `/dashboard/tasks/${task.id}`,
            },
          });
          notificationsCreated++;
        }
      }

      // Find tasks due within 3 days
      const upcomingTasks = await prisma.task.findMany({
        where: {
          status: "PENDING",
          dueDate: {
            gte: today,
            lte: in3Days,
          },
          month: currentMonth,
          year: currentYear,
          OR: [
            { houseId: { in: userHouseIds } },
            { houseId: null },
          ],
        },
        include: {
          house: { select: { name: true } },
        },
      });

      // Filter tasks by assigned roles
      const upcomingTasksForUser = upcomingTasks.filter((task) => {
        try {
          const assignedRoles = JSON.parse(task.assignedRoles);
          return assignedRoles.includes(user.role);
        } catch {
          return false;
        }
      });

      // Create upcoming task notifications
      for (const task of upcomingTasksForUser) {
        const daysUntilDue = Math.ceil(
          (new Date(task.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: "TASK_DUE_SOON",
            link: `/dashboard/tasks/${task.id}`,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: daysUntilDue === 0 ? "Task Due Today" : `Task Due in ${daysUntilDue} Day${daysUntilDue !== 1 ? "s" : ""}`,
              message: `"${task.title}" is due ${format(new Date(task.dueDate), "MMM d")}${task.house ? ` (${task.house.name})` : ""}`,
              type: "TASK_DUE_SOON",
              link: `/dashboard/tasks/${task.id}`,
            },
          });
          notificationsCreated++;
        }
      }

      // Notify Admins of tasks awaiting approval
      if (user.role === "ADMIN") {
        const tasksAwaitingApproval = await prisma.task.findMany({
          where: {
            status: "COMPLETED",
            month: currentMonth,
            year: currentYear,
            OR: [
              { houseId: { in: userHouseIds } },
              { houseId: null },
            ],
          },
          include: {
            completedBy: { select: { name: true } },
            house: { select: { name: true } },
          },
        });

        for (const task of tasksAwaitingApproval) {
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: "TASK_AWAITING_APPROVAL",
              link: `/dashboard/tasks/${task.id}`,
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!existingNotification) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: "Task Awaiting Approval",
                message: `"${task.title}" completed by ${task.completedBy?.name || "Unknown"} needs approval`,
                type: "TASK_AWAITING_APPROVAL",
                link: `/dashboard/tasks/${task.id}`,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

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
