import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default violation categories based on 245D requirements
const DEFAULT_CATEGORIES = [
  // MINOR (1-2 points)
  { categoryName: "Clock-in 1-15 minutes late", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 1 },
  { categoryName: "Clock-out late - unapproved OT under 15 min", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 2 },
  { categoryName: "Minor dress code/uniform violation", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 3 },
  { categoryName: "Late timesheet submission", severityLevel: "MINOR", defaultPoints: 1, displayOrder: 4 },
  { categoryName: "Clock-in 16-30 minutes late", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 5 },
  { categoryName: "Unapproved overtime 15-30 minutes", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 6 },
  { categoryName: "Failure to notify supervisor of absence (but did call)", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 7 },
  { categoryName: "Minor cleanliness/housekeeping issue", severityLevel: "MINOR", defaultPoints: 2, displayOrder: 8 },

  // MODERATE (3-4 points)
  { categoryName: "Progress notes not completed by end of shift", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 1 },
  { categoryName: "Failure to follow communication protocols", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 2 },
  { categoryName: "Unapproved overtime over 30 minutes", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 3 },
  { categoryName: "Clock-in more than 30 minutes late", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 4 },
  { categoryName: "Missing required training deadline", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 5 },
  { categoryName: "Failure to complete shift checklist", severityLevel: "MODERATE", defaultPoints: 3, displayOrder: 6 },
  { categoryName: "Inadequate shift documentation", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 7 },
  { categoryName: "Failure to report maintenance issues", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 8 },
  { categoryName: "Personal cell phone use during prohibited times", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 9 },
  { categoryName: "Failure to attend mandatory meeting (without approval)", severityLevel: "MODERATE", defaultPoints: 4, displayOrder: 10 },

  // SERIOUS (5-6 points)
  { categoryName: "Late medication administration (per eMAR/RTask)", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 1 },
  { categoryName: "Progress notes missing after 24 hours", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 2 },
  { categoryName: "Failure to document incident/injury", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 3 },
  { categoryName: "Leaving shift early without approval", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 4 },
  { categoryName: "Unauthorized visitors at site", severityLevel: "SERIOUS", defaultPoints: 5, displayOrder: 5 },
  { categoryName: "No-call/no-show", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 6 },
  { categoryName: "Insubordination", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 7 },
  { categoryName: "Failure to follow Individual Service Plan (ISP)", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 8 },
  { categoryName: "Failure to maintain required supervision levels", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 9 },
  { categoryName: "Sleeping during non-overnight awake shift", severityLevel: "SERIOUS", defaultPoints: 6, displayOrder: 10 },

  // CRITICAL (8-10 points)
  { categoryName: "Sleeping on overnight awake shift", severityLevel: "CRITICAL", defaultPoints: 8, displayOrder: 1 },
  { categoryName: "Client funds mishandling (minor)", severityLevel: "CRITICAL", defaultPoints: 8, displayOrder: 2 },
  { categoryName: "Unauthorized disclosure of client information", severityLevel: "CRITICAL", defaultPoints: 8, displayOrder: 3 },
  { categoryName: "Medication not administered at all", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 4 },
  { categoryName: "Falsifying documentation", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 5 },
  { categoryName: "Second no-call/no-show within 90 days", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 6 },
  { categoryName: "Failure to report suspected abuse/neglect", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 7 },
  { categoryName: "Working under the influence (unconfirmed)", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 8 },
  { categoryName: "Leaving clients unsupervised", severityLevel: "CRITICAL", defaultPoints: 10, displayOrder: 9 },

  // IMMEDIATE TERMINATION REVIEW (bypasses point system)
  { categoryName: "Abuse, neglect, or exploitation of clients", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 1, description: "Immediate suspension pending investigation" },
  { categoryName: "Confirmed HIPAA violation", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 2, description: "Immediate suspension pending investigation" },
  { categoryName: "Positive drug/alcohol test", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 3, description: "Immediate termination" },
  { categoryName: "Theft of company or client property", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 4, description: "Immediate termination" },
  { categoryName: "Physical altercation with staff or client", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 5, description: "Immediate termination" },
  { categoryName: "Gross misconduct", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 6, description: "Immediate suspension pending investigation" },
  { categoryName: "Falsifying employment documents", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 7, description: "Immediate termination" },
  { categoryName: "Criminal conduct on premises", severityLevel: "IMMEDIATE_TERMINATION", defaultPoints: 0, displayOrder: 8, description: "Immediate termination" },
];

// Default discipline thresholds
const DEFAULT_THRESHOLDS = [
  { pointMinimum: 1, pointMaximum: 5, actionRequired: "Coaching", description: "Documented verbal coaching session" },
  { pointMinimum: 6, pointMaximum: 9, actionRequired: "Verbal Warning", description: "Formal verbal warning with documentation" },
  { pointMinimum: 10, pointMaximum: 13, actionRequired: "Written Warning", description: "Written warning in personnel file" },
  { pointMinimum: 14, pointMaximum: 17, actionRequired: "Final Warning + PIP", description: "Final written warning with Performance Improvement Plan" },
  { pointMinimum: 18, pointMaximum: 999, actionRequired: "Termination", description: "Employment termination" },
];

async function seedDiscipline() {
  console.log("Seeding Discipline Tracker data...\n");

  // Check existing counts
  const existingCategories = await prisma.violationCategory.count();
  const existingThresholds = await prisma.disciplineThreshold.count();

  console.log(`Existing violation categories: ${existingCategories}`);
  console.log(`Existing discipline thresholds: ${existingThresholds}\n`);

  // Seed categories if none exist
  if (existingCategories === 0) {
    console.log("Creating violation categories...");
    const result = await prisma.violationCategory.createMany({
      data: DEFAULT_CATEGORIES,
    });
    console.log(`Created ${result.count} violation categories`);
  } else {
    console.log("Violation categories already exist, skipping...");
  }

  // Seed thresholds if none exist
  if (existingThresholds === 0) {
    console.log("\nCreating discipline thresholds...");
    const result = await prisma.disciplineThreshold.createMany({
      data: DEFAULT_THRESHOLDS,
    });
    console.log(`Created ${result.count} discipline thresholds`);
  } else {
    console.log("Discipline thresholds already exist, skipping...");
  }

  // Final counts
  const finalCategories = await prisma.violationCategory.count();
  const finalThresholds = await prisma.disciplineThreshold.count();

  console.log("\nDiscipline Tracker seeding complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Violation categories: ${finalCategories}`);
  console.log(`   Discipline thresholds: ${finalThresholds}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

seedDiscipline()
  .catch((e) => {
    console.error("Error seeding Discipline Tracker:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
