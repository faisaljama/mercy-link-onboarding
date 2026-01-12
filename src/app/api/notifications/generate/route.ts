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

    // ========================================
    // DISCIPLINE NOTIFICATIONS
    // Generate notifications for discipline thresholds and pending signatures
    // ========================================

    const ninetyDaysAgo = addDays(today, -90);

    // Get all employees with corrective actions
    const employeesWithActions = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        correctiveActions: {
          some: {
            violationDate: { gte: ninetyDaysAgo },
            status: { not: "VOIDED" },
          },
        },
      },
      include: {
        correctiveActions: {
          where: {
            violationDate: { gte: ninetyDaysAgo },
            status: { not: "VOIDED" },
          },
          select: {
            pointsAssigned: true,
            pointsAdjusted: true,
          },
        },
        assignedHouses: {
          select: { houseId: true },
        },
      },
    });

    // Calculate points and check thresholds
    const DISCIPLINE_THRESHOLDS = [
      { points: 6, type: "DISCIPLINE_THRESHOLD_6", label: "Verbal Warning Level" },
      { points: 10, type: "DISCIPLINE_THRESHOLD_10", label: "Written Warning Level" },
      { points: 14, type: "DISCIPLINE_THRESHOLD_14", label: "Final Warning Level" },
      { points: 18, type: "DISCIPLINE_THRESHOLD_18", label: "Termination Review Level" },
    ];

    for (const employee of employeesWithActions) {
      const currentPoints = employee.correctiveActions.reduce((total, action) => {
        return total + (action.pointsAdjusted ?? action.pointsAssigned);
      }, 0);

      const employeeName = `${employee.firstName} ${employee.lastName}`;
      const employeeHouseIds = employee.assignedHouses.map(h => h.houseId);

      // Find the highest threshold reached
      const highestThreshold = DISCIPLINE_THRESHOLDS.filter(t => currentPoints >= t.points).pop();

      if (highestThreshold) {
        // Notify relevant users (HR, Admin, and supervisors in employee's houses)
        for (const user of users) {
          const userHouseIds = user.role === "ADMIN" || user.role === "HR"
            ? (await prisma.house.findMany({ select: { id: true } })).map(h => h.id)
            : user.assignedHouses.map(ah => ah.houseId);

          // Check if user should be notified about this employee
          const shouldNotify = user.role === "ADMIN" || user.role === "HR" ||
            employeeHouseIds.some(ehId => userHouseIds.includes(ehId));

          if (!shouldNotify) continue;

          // Check for existing notification (only notify once per threshold level)
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: highestThreshold.type,
              link: `/dashboard/employees/${employee.id}`,
            },
          });

          if (!existingNotification) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: `Employee at ${highestThreshold.label}`,
                message: `${employeeName} has reached ${currentPoints} discipline points (${highestThreshold.label})`,
                type: highestThreshold.type,
                link: `/dashboard/employees/${employee.id}`,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    // Notify about pending signatures (older than 24 hours)
    const yesterday = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);

    const pendingSignatureActions = await prisma.correctiveAction.findMany({
      where: {
        status: "PENDING_SIGNATURE",
        createdAt: { lt: yesterday },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            assignedHouses: { select: { houseId: true } },
          },
        },
        issuedBy: {
          select: { id: true, name: true },
        },
      },
    });

    for (const action of pendingSignatureActions) {
      const employeeName = `${action.employee.firstName} ${action.employee.lastName}`;
      const isUrgent = action.createdAt < twoDaysAgo;

      // Notify the issuer
      const existingIssuerNotification = await prisma.notification.findFirst({
        where: {
          userId: action.issuedBy.id,
          type: "DISCIPLINE_PENDING_SIGNATURE",
          link: `/dashboard/discipline/${action.id}`,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      if (!existingIssuerNotification) {
        await prisma.notification.create({
          data: {
            userId: action.issuedBy.id,
            title: isUrgent ? "Urgent: Pending Signature" : "Pending Signature",
            message: `Corrective action for ${employeeName} is awaiting signature${isUrgent ? " (over 48 hours)" : ""}`,
            type: "DISCIPLINE_PENDING_SIGNATURE",
            link: `/dashboard/discipline/${action.id}`,
          },
        });
        notificationsCreated++;
      }

      // Also notify HR/Admin if overdue
      if (isUrgent) {
        for (const user of users) {
          if (user.role !== "ADMIN" && user.role !== "HR") continue;
          if (user.id === action.issuedBy.id) continue; // Already notified

          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: "DISCIPLINE_PENDING_SIGNATURE",
              link: `/dashboard/discipline/${action.id}`,
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!existingNotification) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: "Overdue Signature Required",
                message: `Corrective action for ${employeeName} pending signature for over 48 hours`,
                type: "DISCIPLINE_PENDING_SIGNATURE",
                link: `/dashboard/discipline/${action.id}`,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    // ========================================
    // TRAINING LOG NOTIFICATIONS
    // Generate notifications for training deadlines
    // ========================================

    // Training deadline definitions (days from hire date)
    const ORIENTATION_DEADLINES = [
      { key: "mandated_reporting", label: "Mandated Reporting", daysFromHire: 3 },
      { key: "orientation_direct_care", label: "Orientation for Direct Care Staff", daysFromHire: 60 },
      { key: "positive_supports_rule", label: "Positive Supports Rule Core", daysFromHire: 60, note: "Before unsupervised contact" },
      { key: "first_aid", label: "First Aid Training", daysFromHire: 60 },
      { key: "cpr_training", label: "CPR Training", daysFromHire: 60 },
    ];

    // Get all active employees with their training logs
    const employeesForTraining = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        trainingLogs: {
          where: {
            logType: { in: ["ORIENTATION", "ANNUAL"] },
          },
        },
        assignedHouses: {
          select: { houseId: true },
        },
      },
    });

    for (const employee of employeesForTraining) {
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      const employeeHouseIds = employee.assignedHouses.map(h => h.houseId);
      const hireDate = new Date(employee.hireDate);
      const daysSinceHire = differenceInDays(today, hireDate);

      // Find orientation training log
      const orientationLog = employee.trainingLogs.find(l => l.logType === "ORIENTATION");
      const orientationChecklist = orientationLog
        ? JSON.parse(orientationLog.checklistItems || "{}")
        : {};

      // Check orientation training deadlines
      for (const deadline of ORIENTATION_DEADLINES) {
        const dueDate = addDays(hireDate, deadline.daysFromHire);
        const daysUntilDue = differenceInDays(dueDate, today);
        const isComplete = orientationChecklist[deadline.key]?.completed;

        // Skip if already completed
        if (isComplete) continue;

        // Notify relevant users (HR, Admin, and supervisors in employee's houses)
        for (const user of users) {
          const userHouseIds = user.role === "ADMIN" || user.role === "HR"
            ? (await prisma.house.findMany({ select: { id: true } })).map(h => h.id)
            : user.assignedHouses.map(ah => ah.houseId);

          // Check if user should be notified about this employee
          const shouldNotify = user.role === "ADMIN" || user.role === "HR" ||
            (["DESIGNATED_COORDINATOR", "DESIGNATED_MANAGER"].includes(user.role) &&
              employeeHouseIds.some(ehId => userHouseIds.includes(ehId)));

          if (!shouldNotify) continue;

          // Generate notification based on urgency
          let notificationType = "";
          let title = "";
          let shouldNotifyNow = false;

          if (daysUntilDue < 0) {
            // Overdue
            notificationType = "TRAINING_OVERDUE";
            title = "Training Overdue";
            shouldNotifyNow = true;
          } else if (daysUntilDue === 0) {
            // Due today
            notificationType = "TRAINING_DUE_TODAY";
            title = "Training Due Today";
            shouldNotifyNow = true;
          } else if (daysUntilDue <= 3 && deadline.daysFromHire <= 7) {
            // Urgent training (e.g., mandated reporting within 72 hours)
            notificationType = "TRAINING_URGENT";
            title = `Training Due in ${daysUntilDue} Day${daysUntilDue !== 1 ? "s" : ""}`;
            shouldNotifyNow = true;
          } else if (daysUntilDue <= 7) {
            // Due within 7 days
            notificationType = "TRAINING_DUE_SOON";
            title = `Training Due in ${daysUntilDue} Days`;
            shouldNotifyNow = true;
          } else if (daysUntilDue <= 14) {
            // 2-week warning
            notificationType = "TRAINING_REMINDER";
            title = "Training Due in 2 Weeks";
            shouldNotifyNow = true;
          } else if (daysUntilDue <= 30 && deadline.daysFromHire >= 30) {
            // 30-day warning for longer deadlines
            notificationType = "TRAINING_REMINDER";
            title = "Training Due in 30 Days";
            shouldNotifyNow = true;
          }

          if (shouldNotifyNow) {
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: user.id,
                type: notificationType,
                link: `/dashboard/employees/${employee.id}`,
                message: { contains: deadline.label },
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            });

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  title,
                  message: `${deadline.label} for ${employeeName} is ${daysUntilDue < 0 ? `overdue by ${Math.abs(daysUntilDue)} days` : daysUntilDue === 0 ? "due today" : `due ${format(dueDate, "MMM d")}`}`,
                  type: notificationType,
                  link: `/dashboard/employees/${employee.id}`,
                },
              });
              notificationsCreated++;
            }
          }
        }
      }

      // Check for annual training due (based on hire anniversary)
      const hireAnniversaryThisYear = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
      const daysUntilAnniversary = differenceInDays(hireAnniversaryThisYear, today);
      const currentYear = today.getFullYear();

      // Check if employee has annual training for this year
      const annualLog = employee.trainingLogs.find(
        l => l.logType === "ANNUAL" && l.year === currentYear
      );

      // Only notify if they've been employed for at least 1 year
      if (daysSinceHire >= 365) {
        // Calculate required hours based on experience
        const requiredHours = employee.experienceYears >= 5 ? 12 : 24;
        const hoursCompleted = annualLog?.hoursCompleted || 0;
        const isAnnualComplete = hoursCompleted >= requiredHours;

        // Notify 60 days, 30 days, 14 days, 7 days before anniversary
        const shouldNotifyAnnual = !isAnnualComplete && (
          (daysUntilAnniversary <= 60 && daysUntilAnniversary > 30) ||
          (daysUntilAnniversary <= 30 && daysUntilAnniversary > 14) ||
          (daysUntilAnniversary <= 14 && daysUntilAnniversary > 7) ||
          (daysUntilAnniversary <= 7 && daysUntilAnniversary >= 0) ||
          (daysUntilAnniversary < 0 && daysUntilAnniversary >= -30) // Overdue up to 30 days
        );

        if (shouldNotifyAnnual) {
          for (const user of users) {
            const userHouseIds = user.role === "ADMIN" || user.role === "HR"
              ? (await prisma.house.findMany({ select: { id: true } })).map(h => h.id)
              : user.assignedHouses.map(ah => ah.houseId);

            const shouldNotify = user.role === "ADMIN" || user.role === "HR" ||
              (["DESIGNATED_COORDINATOR", "DESIGNATED_MANAGER"].includes(user.role) &&
                employeeHouseIds.some(ehId => userHouseIds.includes(ehId)));

            if (!shouldNotify) continue;

            let notificationType = "";
            let title = "";

            if (daysUntilAnniversary < 0) {
              notificationType = "ANNUAL_TRAINING_OVERDUE";
              title = "Annual Training Overdue";
            } else if (daysUntilAnniversary <= 7) {
              notificationType = "ANNUAL_TRAINING_URGENT";
              title = `Annual Training Due in ${daysUntilAnniversary} Days`;
            } else {
              notificationType = "ANNUAL_TRAINING_REMINDER";
              title = `Annual Training Due ${daysUntilAnniversary <= 14 ? "Soon" : `in ${daysUntilAnniversary} Days`}`;
            }

            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: user.id,
                type: notificationType,
                link: `/dashboard/employees/${employee.id}`,
                message: { contains: employeeName },
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            });

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  title,
                  message: `${employeeName} needs ${requiredHours - hoursCompleted} more hours of annual training (${hoursCompleted}/${requiredHours} completed)`,
                  type: notificationType,
                  link: `/dashboard/employees/${employee.id}`,
                },
              });
              notificationsCreated++;
            }
          }
        }
      }

      // Notify new employees without orientation training log created
      if (daysSinceHire <= 7 && !orientationLog) {
        for (const user of users) {
          if (!["ADMIN", "HR", "DESIGNATED_COORDINATOR", "DESIGNATED_MANAGER"].includes(user.role)) continue;

          const userHouseIds = user.role === "ADMIN" || user.role === "HR"
            ? (await prisma.house.findMany({ select: { id: true } })).map(h => h.id)
            : user.assignedHouses.map(ah => ah.houseId);

          const shouldNotify = user.role === "ADMIN" || user.role === "HR" ||
            employeeHouseIds.some(ehId => userHouseIds.includes(ehId));

          if (!shouldNotify) continue;

          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: "TRAINING_LOG_NEEDED",
              link: `/dashboard/employees/${employee.id}`,
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!existingNotification) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: "New Hire Training Required",
                message: `Create orientation training log for ${employeeName} (hired ${format(hireDate, "MMM d")})`,
                type: "TRAINING_LOG_NEEDED",
                link: `/dashboard/employees/${employee.id}`,
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
