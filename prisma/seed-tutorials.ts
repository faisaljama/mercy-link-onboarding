import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sample tutorials for 245D compliance training
const TUTORIALS = [
  {
    title: "Getting Started with the Compliance Dashboard",
    description: "Learn how to navigate the Mercy Link 245D Compliance Dashboard, access key features, and manage your daily tasks.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "5:30",
  },
  {
    title: "How to Complete Progress Notes",
    description: "Step-by-step guide on documenting daily progress notes for service recipients, including best practices and common mistakes to avoid.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "8:45",
  },
  {
    title: "Medication Administration Record (MAR) Training",
    description: "Comprehensive training on properly documenting medication administration, handling PRN medications, and reporting errors.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "12:20",
  },
  {
    title: "Incident Reporting Procedures",
    description: "How to properly document and report incidents, including timelines, required information, and notification requirements.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "10:15",
  },
  {
    title: "Person-Centered Planning Overview",
    description: "Understanding person-centered planning principles and how to implement them in daily service delivery.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "15:00",
  },
  {
    title: "Rights of Persons Served",
    description: "Overview of service recipient rights under 245D, including privacy, dignity, and self-determination.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "7:30",
  },
  {
    title: "Abuse Prevention and Reporting",
    description: "Mandatory reporter training including recognizing signs of abuse, reporting procedures, and prevention strategies.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "18:45",
  },
  {
    title: "Daily Operations Checklist Walkthrough",
    description: "How to use the DC Daily Checklist feature for remote oversight and onsite visits.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "6:00",
  },
  {
    title: "Weekly Report Submission Guide",
    description: "Step-by-step instructions for completing and submitting weekly DC reports to the Designated Manager.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "4:30",
  },
  {
    title: "Emergency Procedures Training",
    description: "How to respond to various emergencies including medical emergencies, fires, severe weather, and missing persons.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "14:00",
  },
  {
    title: "Documentation Best Practices",
    description: "Tips for clear, accurate, and compliant documentation including common pitfalls and how to avoid them.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "9:15",
  },
  {
    title: "Using Therap for Daily Documentation",
    description: "How to navigate Therap, enter daily notes, and ensure documentation compliance.",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    duration: "11:30",
  },
];

async function main() {
  console.log("Seeding sample tutorials...\n");

  // Get an admin user to associate with creation
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("No admin user found. Please create an admin user first.");
    process.exit(1);
  }

  console.log(`Using admin user: ${adminUser.name} (${adminUser.email})\n`);

  // Delete existing tutorials to avoid duplicates
  const deleted = await prisma.hubTutorial.deleteMany({});
  console.log(`Deleted ${deleted.count} existing tutorials\n`);

  // Create tutorials
  console.log("--- TUTORIALS ---");
  for (let i = 0; i < TUTORIALS.length; i++) {
    const tutorial = TUTORIALS[i];
    await prisma.hubTutorial.create({
      data: {
        title: tutorial.title,
        description: tutorial.description,
        embedUrl: tutorial.embedUrl,
        duration: tutorial.duration,
        sortOrder: i + 1,
        createdById: adminUser.id,
      },
    });
    console.log(`Created: ${tutorial.title} (${tutorial.duration})`);
  }

  console.log(`\n========================================`);
  console.log(`Successfully seeded ${TUTORIALS.length} tutorials!`);
  console.log(`========================================`);
  console.log("\nNOTE: Video embed URLs are placeholders.");
  console.log("Replace them with actual Scribe, YouTube, or Vimeo URLs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
