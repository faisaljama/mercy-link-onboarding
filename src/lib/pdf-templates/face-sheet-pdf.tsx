import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import {
  baseStyles,
  colors,
  PDFHeader,
  PDFFooter,
  Section,
  Field,
  TwoColumn,
} from "../pdf-service";

// Helper type for Prisma Decimal compatibility
type DecimalLike = { toString(): string } | number | string | null | undefined;

// Client type matching what's fetched from the database
interface ClientData {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob: Date | string;
  ssn?: string | null;
  gender?: string | null;
  ethnicity?: string | null;
  preferredLanguage?: string | null;
  maritalStatus?: string | null;
  status: string;
  admissionDate: Date | string;
  waiverType?: string | null;
  photoUrl?: string | null;

  // Insurance
  pmiNumber?: string | null;
  insuranceName?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceGroupNumber?: string | null;
  insurancePhone?: string | null;

  // Emergency Contacts
  emergencyContact1Name?: string | null;
  emergencyContact1Relationship?: string | null;
  emergencyContact1Phone?: string | null;
  emergencyContact2Name?: string | null;
  emergencyContact2Relationship?: string | null;
  emergencyContact2Phone?: string | null;

  // Case Management
  mhCaseManagerName?: string | null;
  mhCaseManagerOrg?: string | null;
  mhCaseManagerEmail?: string | null;
  mhCaseManagerPhone?: string | null;
  cadiCaseManagerName?: string | null;
  cadiCaseManagerOrg?: string | null;
  cadiCaseManagerEmail?: string | null;
  cadiCaseManagerPhone?: string | null;
  legalRepName?: string | null;
  legalRepPhone?: string | null;

  // Guardian & Rep Payee
  hasGuardian: boolean;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  guardianAddress?: string | null;
  hasRepPayee: boolean;
  repPayeeName?: string | null;
  repPayeePhone?: string | null;
  repPayeeAddress?: string | null;

  // Financial - using DecimalLike for Prisma Decimal compatibility
  rentAmount?: DecimalLike;
  checkDeliveryLocation?: string | null;

  // Internal
  dailyRate?: DecimalLike;
  staffingRatio?: string | null;
  individualHours?: DecimalLike;
  sharedStaffingHours?: DecimalLike;
  myChartUsername?: string | null;
  myChartPassword?: string | null;
  myChartUrl?: string | null;

  // Medical Providers
  pharmacyName?: string | null;
  pharmacyOrg?: string | null;
  pharmacyPhone?: string | null;
  pharmacyAddress?: string | null;
  primaryCareName?: string | null;
  primaryCareOrg?: string | null;
  primaryCarePhone?: string | null;
  primaryCareAddress?: string | null;
  psychiatristName?: string | null;
  psychiatristOrg?: string | null;
  psychiatristPhone?: string | null;
  psychiatristAddress?: string | null;
  dentalName?: string | null;
  dentalOrg?: string | null;
  dentalPhone?: string | null;
  dentalAddress?: string | null;
  visionName?: string | null;
  visionOrg?: string | null;
  visionPhone?: string | null;
  visionAddress?: string | null;

  // Medical Info
  allergies?: string | null;
  dietaryRestrictions?: string | null;
  diagnoses?: string | null;
  medications?: string | null;

  house: {
    name: string;
    address?: string | null;
    county?: string | null;
    licenseNumber?: string | null;
  };

  additionalProviders?: {
    id: string;
    providerType: string;
    providerName: string;
    organization?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  }[];
}

interface FaceSheetPDFProps {
  client: ClientData;
  isInternal?: boolean;
}

const styles = StyleSheet.create({
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clientPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    objectFit: "cover",
  },
  clientPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  clientPhotoInitials: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  clientHouse: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 9,
    color: colors.white,
    backgroundColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusInactive: {
    backgroundColor: colors.secondary,
  },
  waiverBadge: {
    fontSize: 10,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  contactBox: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.text,
  },
  contactDetail: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 2,
  },
  notOnFile: {
    fontSize: 9,
    color: colors.textLight,
    fontStyle: "italic",
  },
  medicalBox: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 50,
  },
  medicalTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 4,
  },
  medicalContent: {
    fontSize: 9,
    color: colors.text,
  },
  internalSection: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#c4b5fd", // purple-300
    borderRadius: 4,
    backgroundColor: "#faf5ff", // purple-50
  },
  internalTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#7c3aed", // purple-600
    backgroundColor: "#ede9fe", // purple-100
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
  },
  internalBadge: {
    fontSize: 7,
    color: "#7c3aed",
    marginLeft: 8,
  },
  threeColumn: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  providerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  providerBox: {
    width: "48%",
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  emergencyBox: {
    backgroundColor: "#fef2f2", // red-50
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
});

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  CHIROPRACTOR: "Chiropractor",
  PHYSICAL_THERAPIST: "Physical Therapist",
  OCCUPATIONAL_THERAPIST: "Occupational Therapist",
  SPEECH_THERAPIST: "Speech Therapist",
  PSYCHOLOGIST: "Psychologist/Counselor",
  PODIATRIST: "Podiatrist",
  NEUROLOGIST: "Neurologist",
  CARDIOLOGIST: "Cardiologist",
  DERMATOLOGIST: "Dermatologist",
  AUDIOLOGIST: "Audiologist",
  NUTRITIONIST: "Nutritionist/Dietitian",
  PAIN_MANAGEMENT: "Pain Management",
  WOUND_CARE: "Wound Care",
  UROLOGIST: "Urologist",
  GASTROENTEROLOGIST: "Gastroenterologist",
  PULMONOLOGIST: "Pulmonologist",
  ENDOCRINOLOGIST: "Endocrinologist",
  ORTHOPEDIST: "Orthopedist",
  OTHER: "Other Specialist",
};

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

function formatCurrency(amount: DecimalLike): string {
  if (amount === null || amount === undefined) return "—";
  const str = typeof amount === "object" ? amount.toString() : String(amount);
  const num = parseFloat(str);
  if (isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
}

function ContactBox({
  title,
  name,
  organization,
  phone,
  address,
  email,
}: {
  title: string;
  name?: string | null;
  organization?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
}) {
  const hasContent = name || organization || phone || address || email;

  return (
    <View style={styles.contactBox}>
      <Text style={styles.contactTitle}>{title}</Text>
      {hasContent ? (
        <>
          {name && <Text style={styles.contactName}>{name}</Text>}
          {organization && <Text style={styles.contactDetail}>{organization}</Text>}
          {phone && <Text style={styles.contactDetail}>{formatPhone(phone)}</Text>}
          {email && <Text style={styles.contactDetail}>{email}</Text>}
          {address && <Text style={styles.contactDetail}>{address}</Text>}
        </>
      ) : (
        <Text style={styles.notOnFile}>Not on file</Text>
      )}
    </View>
  );
}

function EmergencyContactBox({
  number,
  name,
  relationship,
  phone,
}: {
  number: number;
  name?: string | null;
  relationship?: string | null;
  phone?: string | null;
}) {
  return (
    <View style={styles.emergencyBox}>
      <Text style={styles.contactTitle}>Emergency Contact #{number}</Text>
      {name ? (
        <>
          <Text style={styles.contactName}>{name}</Text>
          {relationship && <Text style={styles.contactDetail}>{relationship}</Text>}
          {phone && <Text style={styles.contactDetail}>{formatPhone(phone)}</Text>}
        </>
      ) : (
        <Text style={styles.notOnFile}>Not on file</Text>
      )}
    </View>
  );
}

function MedicalBox({ title, content }: { title: string; content?: string | null }) {
  return (
    <View style={styles.medicalBox}>
      <Text style={styles.medicalTitle}>{title}</Text>
      <Text style={styles.medicalContent}>{content || "None documented"}</Text>
    </View>
  );
}

export function FaceSheetPDF({ client, isInternal = false }: FaceSheetPDFProps) {
  const fullName = [client.firstName, client.middleName, client.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title="Client Face Sheet" subtitle={fullName} />

        {/* Client Header */}
        <View style={styles.clientHeader}>
          <View style={styles.clientHeaderLeft}>
            {client.photoUrl ? (
              <Image src={client.photoUrl} style={styles.clientPhoto} />
            ) : (
              <View style={styles.clientPhotoPlaceholder}>
                <Text style={styles.clientPhotoInitials}>
                  {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.clientName}>{fullName}</Text>
              <Text style={styles.clientHouse}>{client.house.name}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={client.status === "ACTIVE" ? styles.statusBadge : [styles.statusBadge, styles.statusInactive]}
            >
              {client.status}
            </Text>
            {client.waiverType && (
              <Text style={styles.waiverBadge}>{client.waiverType}</Text>
            )}
          </View>
        </View>

        {/* Personal Information */}
        <Section title="Personal Information">
          <TwoColumn
            left={
              <>
                <Field label="Date of Birth" value={formatDate(client.dob)} />
                <Field
                  label="SSN (Last 4)"
                  value={client.ssn ? `XXX-XX-${client.ssn}` : null}
                />
                <Field label="Gender" value={client.gender} />
                <Field label="Ethnicity" value={client.ethnicity} />
              </>
            }
            right={
              <>
                <Field label="Preferred Language" value={client.preferredLanguage} />
                <Field label="Marital Status" value={client.maritalStatus} />
                <Field label="Admission Date" value={formatDate(client.admissionDate)} />
              </>
            }
          />
        </Section>

        {/* Residence Information */}
        <Section title="Residence Information">
          <TwoColumn
            left={
              <>
                <Field label="House Name" value={client.house.name} />
                <Field label="Address" value={client.house.address} />
              </>
            }
            right={
              <>
                <Field label="County" value={client.house.county} />
                <Field label="License Number" value={client.house.licenseNumber} />
              </>
            }
          />
        </Section>

        {/* Insurance Information */}
        <Section title="Insurance Information">
          <TwoColumn
            left={
              <>
                <Field label="PMI/MA Number" value={client.pmiNumber} />
                <Field label="Insurance Name" value={client.insuranceName} />
                <Field label="Policy Number" value={client.insurancePolicyNumber} />
              </>
            }
            right={
              <>
                <Field label="Group Number" value={client.insuranceGroupNumber} />
                <Field label="Insurance Phone" value={formatPhone(client.insurancePhone)} />
              </>
            }
          />
        </Section>

        {/* Emergency Contacts */}
        <Section title="Emergency Contacts">
          <TwoColumn
            left={
              <EmergencyContactBox
                number={1}
                name={client.emergencyContact1Name}
                relationship={client.emergencyContact1Relationship}
                phone={client.emergencyContact1Phone}
              />
            }
            right={
              <EmergencyContactBox
                number={2}
                name={client.emergencyContact2Name}
                relationship={client.emergencyContact2Relationship}
                phone={client.emergencyContact2Phone}
              />
            }
          />
        </Section>

        <PDFFooter />
      </Page>

      {/* Page 2 */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title="Client Face Sheet" subtitle={`${fullName} (continued)`} />

        {/* Case Management */}
        <Section title="Case Management">
          <View style={styles.threeColumn}>
            <View style={styles.column}>
              <ContactBox
                title="Mental Health Case Manager"
                name={client.mhCaseManagerName}
                organization={client.mhCaseManagerOrg}
                email={client.mhCaseManagerEmail}
                phone={client.mhCaseManagerPhone}
              />
            </View>
            <View style={styles.column}>
              <ContactBox
                title="CADI Case Manager"
                name={client.cadiCaseManagerName}
                organization={client.cadiCaseManagerOrg}
                email={client.cadiCaseManagerEmail}
                phone={client.cadiCaseManagerPhone}
              />
            </View>
            <View style={styles.column}>
              <ContactBox
                title="Legal Representative"
                name={client.legalRepName}
                phone={client.legalRepPhone}
              />
            </View>
          </View>
        </Section>

        {/* Guardian & Rep Payee */}
        <Section title="Guardian & Representative Payee">
          <TwoColumn
            left={
              <View style={styles.contactBox}>
                <Text style={styles.contactTitle}>
                  Guardian: {client.hasGuardian ? "Yes" : "No"}
                </Text>
                {client.hasGuardian && client.guardianName ? (
                  <>
                    <Text style={styles.contactName}>{client.guardianName}</Text>
                    {client.guardianRelationship && (
                      <Text style={styles.contactDetail}>{client.guardianRelationship}</Text>
                    )}
                    {client.guardianPhone && (
                      <Text style={styles.contactDetail}>{formatPhone(client.guardianPhone)}</Text>
                    )}
                    {client.guardianEmail && (
                      <Text style={styles.contactDetail}>{client.guardianEmail}</Text>
                    )}
                    {client.guardianAddress && (
                      <Text style={styles.contactDetail}>{client.guardianAddress}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.notOnFile}>
                    {client.hasGuardian ? "Guardian info not on file" : "No guardian assigned"}
                  </Text>
                )}
              </View>
            }
            right={
              <View style={styles.contactBox}>
                <Text style={styles.contactTitle}>
                  Rep Payee: {client.hasRepPayee ? "Yes" : "No"}
                </Text>
                {client.hasRepPayee && client.repPayeeName ? (
                  <>
                    <Text style={styles.contactName}>{client.repPayeeName}</Text>
                    {client.repPayeePhone && (
                      <Text style={styles.contactDetail}>{formatPhone(client.repPayeePhone)}</Text>
                    )}
                    {client.repPayeeAddress && (
                      <Text style={styles.contactDetail}>{client.repPayeeAddress}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.notOnFile}>
                    {client.hasRepPayee ? "Rep payee info not on file" : "No rep payee assigned"}
                  </Text>
                )}
              </View>
            }
          />
        </Section>

        {/* Financial Information */}
        <Section title="Financial Information">
          <View style={styles.threeColumn}>
            <View style={styles.column}>
              <Field label="Monthly Rent" value={formatCurrency(client.rentAmount)} />
            </View>
            <View style={styles.column}>
              <Field label="Check Delivery" value={client.checkDeliveryLocation} />
            </View>
            <View style={styles.column}>
              <Text style={{ fontSize: 9, color: colors.secondary }}>
                {client.checkDeliveryLocation === "OFFICE"
                  ? "Checks delivered to main office"
                  : client.checkDeliveryLocation === "HOUSE"
                  ? `Checks delivered to ${client.house.name}`
                  : "Check delivery location not set"}
              </Text>
            </View>
          </View>
        </Section>

        {/* Internal Sections - Only shown when isInternal is true */}
        {isInternal && (
          <>
            <View style={styles.internalSection}>
              <Text style={styles.internalTitle}>
                Internal - Staffing & Rates
                <Text style={styles.internalBadge}> (Internal Only)</Text>
              </Text>
              <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Daily Rate" value={formatCurrency(client.dailyRate)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Staffing Ratio" value={client.staffingRatio} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Individual Hours"
                      value={client.individualHours ? `${client.individualHours} hrs` : null}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Shared Hours"
                      value={client.sharedStaffingHours ? `${client.sharedStaffingHours} hrs` : null}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.internalSection}>
              <Text style={styles.internalTitle}>
                Internal - MyChart Login
                <Text style={styles.internalBadge}> (Internal Only)</Text>
              </Text>
              <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                <View style={styles.threeColumn}>
                  <View style={styles.column}>
                    <Field label="Username" value={client.myChartUsername} />
                  </View>
                  <View style={styles.column}>
                    <Field
                      label="Password"
                      value={client.myChartPassword ? "••••••••" : null}
                    />
                  </View>
                  <View style={styles.column}>
                    <Field label="Portal URL" value={client.myChartUrl} />
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Medical Providers */}
        <Section title="Medical Providers">
          <View style={styles.providerGrid}>
            <View style={styles.providerBox}>
              <Text style={styles.contactTitle}>Pharmacy</Text>
              {client.pharmacyName ? (
                <>
                  <Text style={styles.contactName}>{client.pharmacyName}</Text>
                  {client.pharmacyOrg && <Text style={styles.contactDetail}>{client.pharmacyOrg}</Text>}
                  {client.pharmacyPhone && (
                    <Text style={styles.contactDetail}>{formatPhone(client.pharmacyPhone)}</Text>
                  )}
                  {client.pharmacyAddress && <Text style={styles.contactDetail}>{client.pharmacyAddress}</Text>}
                </>
              ) : (
                <Text style={styles.notOnFile}>Not on file</Text>
              )}
            </View>
            <View style={styles.providerBox}>
              <Text style={styles.contactTitle}>Primary Care</Text>
              {client.primaryCareName ? (
                <>
                  <Text style={styles.contactName}>{client.primaryCareName}</Text>
                  {client.primaryCareOrg && <Text style={styles.contactDetail}>{client.primaryCareOrg}</Text>}
                  {client.primaryCarePhone && (
                    <Text style={styles.contactDetail}>{formatPhone(client.primaryCarePhone)}</Text>
                  )}
                  {client.primaryCareAddress && (
                    <Text style={styles.contactDetail}>{client.primaryCareAddress}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.notOnFile}>Not on file</Text>
              )}
            </View>
            <View style={styles.providerBox}>
              <Text style={styles.contactTitle}>Psychiatrist</Text>
              {client.psychiatristName ? (
                <>
                  <Text style={styles.contactName}>{client.psychiatristName}</Text>
                  {client.psychiatristOrg && <Text style={styles.contactDetail}>{client.psychiatristOrg}</Text>}
                  {client.psychiatristPhone && (
                    <Text style={styles.contactDetail}>{formatPhone(client.psychiatristPhone)}</Text>
                  )}
                  {client.psychiatristAddress && (
                    <Text style={styles.contactDetail}>{client.psychiatristAddress}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.notOnFile}>Not on file</Text>
              )}
            </View>
            <View style={styles.providerBox}>
              <Text style={styles.contactTitle}>Dental</Text>
              {client.dentalName ? (
                <>
                  <Text style={styles.contactName}>{client.dentalName}</Text>
                  {client.dentalOrg && <Text style={styles.contactDetail}>{client.dentalOrg}</Text>}
                  {client.dentalPhone && (
                    <Text style={styles.contactDetail}>{formatPhone(client.dentalPhone)}</Text>
                  )}
                  {client.dentalAddress && <Text style={styles.contactDetail}>{client.dentalAddress}</Text>}
                </>
              ) : (
                <Text style={styles.notOnFile}>Not on file</Text>
              )}
            </View>
            <View style={styles.providerBox}>
              <Text style={styles.contactTitle}>Vision</Text>
              {client.visionName ? (
                <>
                  <Text style={styles.contactName}>{client.visionName}</Text>
                  {client.visionOrg && <Text style={styles.contactDetail}>{client.visionOrg}</Text>}
                  {client.visionPhone && (
                    <Text style={styles.contactDetail}>{formatPhone(client.visionPhone)}</Text>
                  )}
                  {client.visionAddress && <Text style={styles.contactDetail}>{client.visionAddress}</Text>}
                </>
              ) : (
                <Text style={styles.notOnFile}>Not on file</Text>
              )}
            </View>
            {/* Additional providers */}
            {client.additionalProviders?.map((provider) => (
              <View key={provider.id} style={styles.providerBox}>
                <Text style={styles.contactTitle}>
                  {PROVIDER_TYPE_LABELS[provider.providerType] || provider.providerType}
                </Text>
                <Text style={styles.contactName}>{provider.providerName}</Text>
                {provider.organization && <Text style={styles.contactDetail}>{provider.organization}</Text>}
                {provider.phone && (
                  <Text style={styles.contactDetail}>{formatPhone(provider.phone)}</Text>
                )}
                {provider.address && <Text style={styles.contactDetail}>{provider.address}</Text>}
                {provider.notes && (
                  <Text style={[styles.contactDetail, { fontStyle: "italic" }]}>{provider.notes}</Text>
                )}
              </View>
            ))}
          </View>
        </Section>

        <PDFFooter />
      </Page>

      {/* Page 3 - Medical Information */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title="Client Face Sheet" subtitle={`${fullName} (Medical)`} />

        {/* Medical Information */}
        <Section title="Medical Information">
          <TwoColumn
            left={
              <>
                <MedicalBox title="Allergies" content={client.allergies} />
                <MedicalBox title="Diagnoses" content={client.diagnoses} />
              </>
            }
            right={
              <>
                <MedicalBox title="Dietary Restrictions" content={client.dietaryRestrictions} />
                <MedicalBox title="Current Medications" content={client.medications} />
              </>
            }
          />
        </Section>

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Helper function to generate filename
export function getFaceSheetFilename(client: { firstName: string; lastName: string }): string {
  const date = format(new Date(), "yyyy-MM-dd");
  const name = `${client.lastName}_${client.firstName}`.replace(/[^a-zA-Z0-9]/g, "_");
  return `FaceSheet_${name}_${date}.pdf`;
}
