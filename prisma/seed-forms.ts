import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DHS Forms
const DHS_FORMS = [
  { title: "245D Individual Abuse Prevention Plan Form", fileName: "245D Individual Abuse Prevention Plan Form.doc" },
  { title: "245D Program Abuse Prevention Plan (PAPP) Form", fileName: "245D Program Abuse Prevention Plan PAPP Form.docx" },
  { title: "AFC Changes Instructions", fileName: "AFC Changes Instructions.docx" },
  { title: "AFC Program Plan (Fillable)", fileName: "AFC Program Plan- FILLABLE.pdf" },
  { title: "Adult Foster Home Mobility Access Assessment", fileName: "Adult Foster Home Mobility Access Assessment.pdf" },
  { title: "DHS 7176 Residency Agreement Template", fileName: "DHS 7176 Residency agreement template.dotx" },
  { title: "Death Report Form", fileName: "Death Report Form March 2020.pdf" },
  { title: "Death or Serious Injury Fax Transmission Cover Sheet", fileName: "Death or Serious Injury Fax Transmission Cover Sheet.pdf" },
  { title: "Individual Resident Placement Agreement (IRPA) - Fillable", fileName: "Individual Resident Placement Agreement (IRPA) Fill-In.pdf" },
  { title: "Individual Resident Placement Agreement (IRPA)", fileName: "Individual Resident Placement Agreement (IRPA).pdf" },
  { title: "Next-of-Kin Letter - Death Ombudsman", fileName: "Next-of-Kin-Letter Death Ombudsman.pdf" },
  { title: "Serious Injury Report Form", fileName: "Serious Injury Report Form March 2020.pdf" },
  { title: "VAA Summary for AFC (DHS-306117)", fileName: "VAA Summary for AFC dhs-306117.pdf" },
];

// Health Forms
const HEALTH_FORMS = [
  { code: "DHF-001", title: "Annual Physical Examination", fileName: "DHF-001--Annual Physical Examination.docx" },
  { code: "DHF-002", title: "Medical Referral", fileName: "DHF-002--Medical Referral.docx" },
  { code: "DHF-003", title: "Dental Referral", fileName: "DHF-003--Dental Referral.docx" },
  { code: "DHF-004", title: "Ophthalmology Referral", fileName: "DHF-004--Ophthalmology Referral.docx" },
  { code: "DHF-005", title: "Mental Health Referral", fileName: "DHF-005--Mental Health Referral.docx" },
  { code: "DHF-006", title: "Standing Order Medication List", fileName: "DHF-006--Standing Order Medication List.docx" },
  { code: "DHF-007", title: "Authorization for Medication and Treatment Administration", fileName: "DHF-007--Authorization for Medication and Treatment Administration.docx" },
  { code: "DHF-008", title: "Authorization and Agreement for Injectable Medications", fileName: "DHF-008--Authorization and Agreement for Injectable Medications.docx" },
  { code: "DHF-009", title: "Authorization to Act in an Emergency", fileName: "DHF-009--Authorization to Act in an Emergency.docx" },
  { code: "DHF-010", title: "Medication or Treatment Error or Refusal Report", fileName: "DHF-010--Medication or Treatment Error or Refusal Report.docx" },
  { code: "DHF-011", title: "Health Care Provider Appointment Schedule", fileName: "DHF-011--Health Care Provider Appointment Schedule.docx" },
  { code: "DHF-012", title: "Medication Administration Record Review", fileName: "DHF-012--Medication Administration Record Review .docx" },
  { code: "DHF-013", title: "Psychotropic Medication Monitoring Data Report", fileName: "DHF-013--Psychotropic Medication Monitoring Data Report.docx" },
  { code: "DHF-014", title: "Medication Administration Record (MAR)", fileName: "DHF-014--Medication Administration Record.doc" },
];

// Program Forms
const PROGRAM_FORMS = [
  { code: "DPF-001", title: "Rights of Persons Served", fileName: "DPF-001--Rights of Persons Served.docx" },
  { code: "DPF-002", title: "Rights Restrictions", fileName: "DPF-002--Rights Restrictions .docx" },
  { code: "DPF-003", title: "Emergency Phone Numbers List", fileName: "DPF-003--Emergency Phone Numbers List.docx" },
  { code: "DPF-004", title: "Admission Form and Data Sheet", fileName: "DPF-004--Admission Form and Data Sheet.docx" },
  { code: "DPF-005", title: "Program Notes", fileName: "DPF-005--Program Notes.docx" },
  { code: "DPF-006", title: "Service Recipient Record Index", fileName: "DPF-006--Service Recipient Record Index .docx" },
  { code: "DPF-007", title: "Funds and Property Authorization", fileName: "DPF-007--Funds and Property Authorization.docx" },
  { code: "DPF-008", title: "Policy Orientation Receipt", fileName: "DPF-008--Policy Orientation Receipt.docx" },
  { code: "DPF-009", title: "Discharge Inventory", fileName: "DPF-009--Discharge Inventory .docx" },
  { code: "DPF-010", title: "Standard Release of Information", fileName: "DPF-010--Standard Release of Information.docx" },
  { code: "DPF-011", title: "Specific Release of Information", fileName: "DPF-011--Specific Release of Information.docx" },
  { code: "DPF-012", title: "Designated Coordinator Review", fileName: "DPF-012--Designated Coordinator Review.docx" },
  { code: "DPF-013", title: "Designated Manager Review", fileName: "DPF-013--Designated Manager Review.docx" },
  { code: "DPF-014", title: "Admission and Discharge Register", fileName: "DPF-014--Admission and Discharge Register.xlsx" },
  { code: "DPF-015", title: "Admission Refusal Notice", fileName: "DPF-015--Admission Refusal Notice.docx" },
  { code: "DPF-016A", title: "Support Plan Addendum for Intensive Support Services", fileName: "DPF-016A--Support Plan Addendum for Intensive Support Services.docx" },
  { code: "DPF-016B", title: "Support Plan Addendum for Basic Support Services", fileName: "DPF-016B--Support Plan Addendum for Basic Support Services.docx" },
  { code: "DPF-017", title: "Service Outcome and Support", fileName: "DPF-017--Service Outcome and Support.docx" },
  { code: "DPF-018", title: "Behavior Outcome", fileName: "DPF-018--Behavior Outcome.docx" },
  { code: "DPF-019", title: "Progress Report and Recommendations", fileName: "DPF-019--Progress Report and Recommendations.docx" },
  { code: "DPF-020", title: "Service Plan Review Meeting and Attendance Notes", fileName: "DPF-020--Service Plan Review Meeting and Attendance Notes.docx" },
  { code: "DPF-021", title: "Temporary Service Suspension Notice", fileName: "DPF-021--Temporary Service Suspension Notice.docx" },
  { code: "DPF-022", title: "Service Termination Notice", fileName: "DPF-022--Service Termination Notice.docx" },
  { code: "DPF-023", title: "Self-Management Assessment", fileName: "DPF-023--Self-Managment Assessment.docx" },
  { code: "DPF-024A", title: "Staff Orientation Training Plan - General", fileName: "DPF-024A--Staff Orientation Training Plan-General.xlsx" },
  { code: "DPF-024B", title: "Staff Annual Training Plan - General", fileName: "DPF-024B--Staff Annual Training Plan-General.xlsx" },
  { code: "DPF-025", title: "Staff Orientation and Annual Training Plan - Person Specific", fileName: "DPF-025--Staff Orientation and Annual Training Plan-Person Specific .xlsx" },
  { code: "DPF-026", title: "Incident and Emergency Report", fileName: "DPF-026--Incident and Emergency Report.docx" },
  { code: "DPF-027", title: "Internal Review", fileName: "DPF-027--Internal Review.docx" },
  { code: "DPF-028", title: "Notification to an Internal Reporter", fileName: "DPF-028--Notification to an Internal Reporter.docx" },
  { code: "DPF-029", title: "Alleged Maltreatment Review Checklist", fileName: "DPF-029--Alleged Maltreatment Review Checklist.docx" },
  { code: "DPF-030", title: "Emergency Use of Manual Restraint Incident Report", fileName: "DPF-030--Emergency Use of Manual Restraint Incident Report.docx" },
  { code: "DPF-031", title: "Complaint Summary and Resolution Notice", fileName: "DPF-031--Complaint Summary and Resolution Notice.docx" },
  { code: "DPF-032", title: "Person Centered Planning Tool", fileName: "DPF-032--Person Centered Planning Tool.docx" },
  { code: "DPF-033", title: "Satisfaction Survey", fileName: "DPF-033--Satisfaction Survey.docx" },
  { code: "DPF-034", title: "Single Dated Signature Page", fileName: "DPF-034--Single Dated Signature Page.docx" },
  { code: "DPF-035", title: "Bedroom Sharing Consent", fileName: "DPF-035--Bedroom Sharing Consent.docx" },
  { code: "DPF-036", title: "Plan for Program Closure", fileName: "DPF-036--Plan for Program Closure.docx" },
  { code: "DPF-037", title: "Employment Specialist Checklist", fileName: "DPF-037--Employment Specialist Checklist.docx" },
  { code: "DPF-038", title: "Billing Information Acknowledgment", fileName: "DPF-038--Billing Information Acknowledgment.docx" },
  { code: "DPF-039", title: "Person-Centered and Positive Support Strategies", fileName: "DPF-039--Person-Centered and Positive Support Strategies.docx" },
  { code: "DPF-040", title: "Remote Support Plan", fileName: "DPF-040--Remote Support Plan.docx" },
];

async function main() {
  console.log("Seeding 245D forms...\n");

  // Get an admin user to associate with uploads
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("No admin user found. Please create an admin user first.");
    process.exit(1);
  }

  console.log(`Using admin user: ${adminUser.name} (${adminUser.email})\n`);

  // Delete existing seeded forms to avoid duplicates
  // New categories: HR, OPERATIONS, COMPLIANCE, TRAINING, CLINICAL, GENERAL
  const deletedCompliance = await prisma.hubResource.deleteMany({
    where: { category: "COMPLIANCE", tags: { contains: "DHS" } },
  });
  const deletedClinical = await prisma.hubResource.deleteMany({
    where: { category: "CLINICAL", tags: { contains: "Form" } },
  });
  console.log(`Deleted ${deletedCompliance.count} Compliance forms, ${deletedClinical.count} Clinical forms\n`);

  // Seed DHS Forms -> COMPLIANCE category
  console.log("--- COMPLIANCE FORMS (DHS) ---");
  for (let i = 0; i < DHS_FORMS.length; i++) {
    const form = DHS_FORMS[i];
    await prisma.hubResource.create({
      data: {
        category: "COMPLIANCE",
        title: form.title,
        documentUrl: `#placeholder-dhs-${i + 1}`,
        fileName: form.fileName,
        tags: "DHS, Form, Compliance",
        sortOrder: i + 1,
        uploadedById: adminUser.id,
      },
    });
    console.log(`Created: ${form.title}`);
  }

  // Seed Health Forms -> CLINICAL category
  console.log("\n--- CLINICAL FORMS (Health) ---");
  for (let i = 0; i < HEALTH_FORMS.length; i++) {
    const form = HEALTH_FORMS[i];
    await prisma.hubResource.create({
      data: {
        category: "CLINICAL",
        title: `${form.code}: ${form.title}`,
        documentUrl: `#placeholder-${form.code}`,
        fileName: form.fileName,
        tags: "Health, Form, Clinical",
        sortOrder: i + 1,
        uploadedById: adminUser.id,
      },
    });
    console.log(`Created: ${form.code} - ${form.title}`);
  }

  // Seed Program Forms -> OPERATIONS category
  console.log("\n--- OPERATIONS FORMS (Program) ---");
  for (let i = 0; i < PROGRAM_FORMS.length; i++) {
    const form = PROGRAM_FORMS[i];
    await prisma.hubResource.create({
      data: {
        category: "OPERATIONS",
        title: `${form.code}: ${form.title}`,
        documentUrl: `#placeholder-${form.code}`,
        fileName: form.fileName,
        tags: "Form, Program, Operations",
        sortOrder: i + 1,
        uploadedById: adminUser.id,
      },
    });
    console.log(`Created: ${form.code} - ${form.title}`);
  }

  console.log(`\n========================================`);
  console.log(`Successfully seeded:`);
  console.log(`  - ${DHS_FORMS.length} DHS Forms`);
  console.log(`  - ${HEALTH_FORMS.length} Health Forms`);
  console.log(`  - ${PROGRAM_FORMS.length} Program Forms`);
  console.log(`  - Total: ${DHS_FORMS.length + HEALTH_FORMS.length + PROGRAM_FORMS.length} forms`);
  console.log(`========================================`);
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
