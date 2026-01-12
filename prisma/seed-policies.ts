import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 245D Intensive Support Services Residential Policies
const POLICIES = [
  {
    code: "D-RISS-01",
    title: "Admission Policy",
    fileName: "D-RISS-01 Admission.docx",
    description: "Guidelines for admitting new service recipients to residential services",
  },
  {
    code: "D-RISS-02",
    title: "Service Suspension Policy",
    fileName: "D-RISS-02 Suspension.docx",
    description: "Procedures for temporary suspension of services",
  },
  {
    code: "D-RISS-03",
    title: "Grievance Policy",
    fileName: "D-RISS-03 Grievance.docx",
    description: "Process for handling service recipient grievances and complaints",
  },
  {
    code: "D-RISS-04",
    title: "Data Privacy Policy",
    fileName: "D-RISS-04 Data Privacy.docx",
    description: "Protection of service recipient personal and health information",
  },
  {
    code: "D-RISS-05",
    title: "Emergency Use of Manual Restraints (EUMR) - NOT ALLOWED",
    fileName: "D-RISS-05-Not Allowed EUMR.docx",
    description: "Policy prohibiting emergency use of manual restraints",
  },
  {
    code: "D-RISS-06",
    title: "Responding to Incidents Policy",
    fileName: "D-RISS-06 Responding Incidents.docx",
    description: "Procedures for responding to and reporting incidents",
  },
  {
    code: "D-RISS-07",
    title: "Emergency Procedures Policy",
    fileName: "D-RISS-07 Emergencies.docx",
    description: "Guidelines for handling various emergency situations",
  },
  {
    code: "D-RISS-08",
    title: "Reviewing Incidents & Emergencies Policy",
    fileName: "D-RISS-08 Reviewing I&E.docx",
    description: "Process for reviewing and documenting incidents and emergencies",
  },
  {
    code: "D-RISS-09",
    title: "Vulnerability Assessment Policy",
    fileName: "D-RISS-09 VA.docx",
    description: "Assessing and addressing service recipient vulnerabilities",
  },
  {
    code: "D-RISS-10",
    title: "Services to Minors Policy",
    fileName: "D-RISS-10 Minors.docx",
    description: "Special considerations for providing services to minors",
  },
  {
    code: "D-RISS-11",
    title: "Safe Transportation Policy",
    fileName: "D-RISS-11 Safe Transportation.docx",
    description: "Guidelines for safe transportation of service recipients",
  },
  {
    code: "D-RISS-12",
    title: "Anti-Fraud Policy",
    fileName: "D-RISS-12 Anti-Fraud.docx",
    description: "Prevention and reporting of fraud, waste, and abuse",
  },
  {
    code: "D-RISS-13",
    title: "Alcohol and Drug Policy",
    fileName: "D-RISS-13 Alcohol-Drug.docx",
    description: "Guidelines regarding alcohol and drug use in residential settings",
  },
  {
    code: "D-RISS-14",
    title: "Death Reporting Policy",
    fileName: "D-RISS-14 Death.docx",
    description: "Procedures for reporting and responding to death of a service recipient",
  },
  {
    code: "D-RISS-15",
    title: "Universal Precautions Policy",
    fileName: "D-RISS-15 Universal Precautions.docx",
    description: "Infection control and universal precautions guidelines",
  },
  {
    code: "D-RISS-16",
    title: "Health Services Coordination Policy",
    fileName: "D-RISS-16 Health Services Coord.docx",
    description: "Coordination of health services for service recipients",
  },
  {
    code: "D-RISS-17",
    title: "Medication Administration Policy",
    fileName: "D-RISS-17 Med Adm.docx",
    description: "Guidelines for safe medication administration and documentation",
  },
  {
    code: "D-RISS-18",
    title: "Service Termination Policy",
    fileName: "D-RISS-18 Termination.docx",
    description: "Procedures for terminating services to recipients",
  },
  {
    code: "D-RISS-19",
    title: "Person-Centered Planning Policy",
    fileName: "D-RISS-19 Person-Centered.docx",
    description: "Guidelines for person-centered service planning and delivery",
  },
];

async function main() {
  console.log("Seeding 245D policies...");

  // Get an admin user to associate with uploads
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("No admin user found. Please create an admin user first.");
    process.exit(1);
  }

  console.log(`Using admin user: ${adminUser.name} (${adminUser.email})`);

  // Delete existing policies to avoid duplicates
  // New categories: HR, OPERATIONS, COMPLIANCE, TRAINING, CLINICAL, GENERAL
  const deleted = await prisma.hubResource.deleteMany({
    where: { category: "COMPLIANCE", tags: { contains: "Policy" } },
  });
  console.log(`Deleted ${deleted.count} existing policies`);

  // Create policies -> COMPLIANCE category
  for (let i = 0; i < POLICIES.length; i++) {
    const policy = POLICIES[i];

    await prisma.hubResource.create({
      data: {
        category: "COMPLIANCE",
        title: `${policy.code}: ${policy.title}`,
        description: policy.description,
        documentUrl: `#placeholder-${policy.code}`, // Placeholder - replace with actual URLs
        fileName: policy.fileName,
        tags: "Policy, 245D, Compliance",
        sortOrder: i + 1,
        uploadedById: adminUser.id,
      },
    });

    console.log(`Created: ${policy.code} - ${policy.title}`);
  }

  console.log(`\nSuccessfully seeded ${POLICIES.length} policies!`);
  console.log("\nNOTE: Document URLs are placeholders. Update them with actual cloud storage links.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
