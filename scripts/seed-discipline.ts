import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VIOLATION_CATEGORIES = [
  // Minor (1-2 points)
  { categoryName: "Clock-in 1-15 minutes late", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 1 },
  { categoryName: "Clock-out late - unapproved OT under 15 min", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 2 },
  { categoryName: "Minor dress code violation", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 3 },
  { categoryName: "Late timesheet submission", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 4 },
  { categoryName: "Clock-in 16-30 minutes late", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 5 },
  { categoryName: "Unapproved OT 15-30 minutes", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 6 },
  { categoryName: "Failure to notify supervisor of absence", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 7 },
  { categoryName: "Minor cleanliness issue", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 8 },

  // Moderate (3-4 points)
  { categoryName: "Progress notes not completed by end of shift", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 10 },
  { categoryName: "Failure to follow communication protocols", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 11 },
  { categoryName: "Unapproved OT over 30 minutes", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 12 },
  { categoryName: "Clock-in more than 30 minutes late", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 13 },
  { categoryName: "Missing required training deadline", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 14 },
  { categoryName: "Failure to complete shift checklist", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 15 },
  { categoryName: "Inadequate shift documentation", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 16 },
  { categoryName: "Failure to report maintenance issues", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 17 },
  { categoryName: "Personal cell phone use during prohibited times", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 18 },
  { categoryName: "Failure to attend mandatory meeting", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 19 },

  // Serious (5-6 points)
  { categoryName: "No-call/no-show", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 20 },
  { categoryName: "Late medication administration", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 21 },
  { categoryName: "Progress notes missing after 24 hours", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 22 },
  { categoryName: "Failure to document incident/injury", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 23 },
  { categoryName: "Leaving shift early without approval", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 24 },
  { categoryName: "Insubordination", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 25 },
  { categoryName: "Failure to follow ISP", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 26 },
  { categoryName: "Unauthorized visitors", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 27 },
  { categoryName: "Failure to maintain supervision levels", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 28 },
  { categoryName: "Sleeping during non-overnight awake shift", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 29 },

  // Critical (8-10 points)
  { categoryName: "Medication not administered at all", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 30 },
  { categoryName: "Falsifying documentation", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 31 },
  { categoryName: "Sleeping on overnight awake shift", severityLevel: "CRITICAL", defaultPoints: 8, displayOrder: 32 },
  { categoryName: "Client funds mishandling", severityLevel: "CRITICAL", defaultPoints: 8, displayOrder: 33 },
  { categoryName: "Second no-call/no-show within 90 days", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 34 },
  { categoryName: "Failure to report abuse/neglect", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 35 },
  { categoryName: "Unauthorized disclosure of client info", severityLevel: "CRITICAL", defaultPoints: 8, displayOrder: 36 },
  { categoryName: "Working under influence (unconfirmed)", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 37 },
  { categoryName: "Leaving clients unsupervised", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 38 },

  // Immediate Termination Review
  { categoryName: "Abuse, neglect, or exploitation", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 40 },
  { categoryName: "Confirmed HIPAA violation", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 41 },
  { categoryName: "Positive drug/alcohol test", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 42 },
  { categoryName: "Theft", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 43 },
  { categoryName: "Physical altercation", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 44 },
  { categoryName: "Gross misconduct", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 45 },
  { categoryName: "Falsifying employment documents", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 46 },
  { categoryName: "Criminal conduct on premises", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 18, displayOrder: 47 },
];

const DISCIPLINE_THRESHOLDS = [
  { pointMinimum: 1, pointMaximum: 5, actionRequired: "Coaching", description: "Documented verbal coaching session" },
  { pointMinimum: 6, pointMaximum: 9, actionRequired: "Verbal Warning", description: "Formal verbal warning with documentation" },
  { pointMinimum: 10, pointMaximum: 13, actionRequired: "Written Warning", description: "Written warning placed in personnel file" },
  { pointMinimum: 14, pointMaximum: 17, actionRequired: "Final Warning + PIP", description: "Final warning with Performance Improvement Plan" },
  { pointMinimum: 18, pointMaximum: 99, actionRequired: "Termination Review", description: "Employment termination review" },
];

async function main() {
  console.log("Seeding violation categories...");

  // Create violation categories
  for (const category of VIOLATION_CATEGORIES) {
    await prisma.violationCategory.upsert({
      where: {
        id: category.categoryName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)
      },
      update: category,
      create: category,
    });
  }

  console.log(`Created ${VIOLATION_CATEGORIES.length} violation categories`);

  // Create discipline thresholds
  console.log("Seeding discipline thresholds...");

  for (const threshold of DISCIPLINE_THRESHOLDS) {
    const existing = await prisma.disciplineThreshold.findFirst({
      where: { pointMinimum: threshold.pointMinimum },
    });

    if (!existing) {
      await prisma.disciplineThreshold.create({
        data: threshold,
      });
    }
  }

  console.log(`Created ${DISCIPLINE_THRESHOLDS.length} discipline thresholds`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
