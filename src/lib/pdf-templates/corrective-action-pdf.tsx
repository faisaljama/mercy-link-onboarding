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

interface SignatureData {
  signerType: string;
  signedAt: Date | string;
  signatureData: string;
  signer: { name: string };
}

interface CorrectiveActionData {
  id: string;
  violationDate: Date | string;
  violationTime: string | null;
  incidentDescription: string;
  mitigatingCircumstances: string | null;
  pointsAssigned: number;
  pointsAdjusted: number | null;
  adjustmentReason: string | null;
  disciplineLevel: string;
  correctiveExpectations: string | null;
  consequencesText: string | null;
  status: string;
  employeeComments: string | null;
  pipScheduled: boolean;
  pipDate: Date | string | null;
  createdAt: Date | string;
  employee: {
    firstName: string;
    lastName: string;
    position: string;
    hireDate: Date | string;
  };
  issuedBy: {
    name: string;
  };
  house: {
    name: string;
  } | null;
  violationCategory: {
    categoryName: string;
    severityLevel: string;
    defaultPoints: number;
  };
  signatures: SignatureData[];
}

interface CorrectiveActionPDFProps {
  action: CorrectiveActionData;
  currentPoints?: number;
}

const styles = StyleSheet.create({
  warningBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.error,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 9,
    color: "#991b1b",
  },
  infoBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginVertical: 12,
  },
  pointsBox: {
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 4,
    width: 100,
  },
  pointsNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  pointsLabel: {
    fontSize: 8,
    color: colors.secondary,
    marginTop: 2,
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 4,
    alignSelf: "flex-start",
  },
  severityMinor: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  severityModerate: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  severitySerious: {
    backgroundColor: "#fed7aa",
    color: "#9a3412",
  },
  severityCritical: {
    backgroundColor: "#fecaca",
    color: "#991b1b",
  },
  severityTermination: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
  },
  disciplineBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginTop: 4,
  },
  expectationsList: {
    marginTop: 8,
  },
  expectationItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  expectationBullet: {
    width: 12,
    fontSize: 9,
    color: colors.primary,
  },
  expectationText: {
    flex: 1,
    fontSize: 9,
    color: colors.text,
  },
  consequencesBox: {
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  consequencesText: {
    fontSize: 9,
    color: "#991b1b",
    fontStyle: "italic",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 16,
  },
  signatureBlock: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.secondary,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2,
  },
  signatureDate: {
    fontSize: 8,
    color: colors.secondary,
    marginTop: 2,
  },
  signatureImage: {
    height: 40,
    marginBottom: 4,
    objectFit: "contain",
  },
  signaturePending: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 4,
    marginBottom: 4,
  },
  signaturePendingText: {
    fontSize: 9,
    color: colors.secondary,
    fontStyle: "italic",
  },
  commentsBox: {
    backgroundColor: "#f0f9ff",
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  commentsLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 9,
    color: colors.text,
  },
  pipBox: {
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#c4b5fd",
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  pipTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#5b21b6",
  },
  pipDate: {
    fontSize: 9,
    color: "#6d28d9",
    marginTop: 2,
  },
  confidentialNote: {
    marginTop: 20,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  confidentialText: {
    fontSize: 7,
    color: colors.textMuted,
    textAlign: "center",
  },
  descriptionBox: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 4,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.4,
  },
});

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy 'at' h:mm a");
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case "MINOR":
      return styles.severityMinor;
    case "MODERATE":
      return styles.severityModerate;
    case "SERIOUS":
      return styles.severitySerious;
    case "CRITICAL":
      return styles.severityCritical;
    case "IMMEDIATE_TERMINATION":
      return styles.severityTermination;
    default:
      return styles.severityMinor;
  }
}

function getDisciplineLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    COACHING: "Coaching",
    VERBAL_WARNING: "Verbal Warning",
    WRITTEN_WARNING: "Written Warning",
    FINAL_WARNING: "Final Warning",
    PIP: "Performance Improvement Plan",
    TERMINATION: "Termination Review",
  };
  return labels[level] || level;
}

function getPositionLabel(position: string): string {
  const labels: Record<string, string> = {
    DSP: "Direct Support Professional",
    LEAD_DSP: "Lead DSP",
    DC: "Designated Coordinator",
    DM: "Designated Manager",
  };
  return labels[position] || position;
}

function getSignerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    EMPLOYEE: "Employee",
    SUPERVISOR: "Supervisor",
    WITNESS: "Witness",
    HR: "HR Representative",
  };
  return labels[type] || type;
}

export function CorrectiveActionPDF({ action, currentPoints }: CorrectiveActionPDFProps) {
  const fullName = `${action.employee.lastName}, ${action.employee.firstName}`;
  const points = action.pointsAdjusted ?? action.pointsAssigned;
  const expectations = action.correctiveExpectations
    ? JSON.parse(action.correctiveExpectations)
    : [];

  const employeeSignature = action.signatures.find((s) => s.signerType === "EMPLOYEE");
  const supervisorSignature = action.signatures.find((s) => s.signerType === "SUPERVISOR");
  const witnessSignature = action.signatures.find((s) => s.signerType === "WITNESS");

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title="Corrective Action Notice" subtitle={`Form #CA-${action.id.slice(-6).toUpperCase()}`} />

        {/* Employee Information */}
        <Section title="Employee Information">
          <TwoColumn
            left={
              <>
                <Field label="Employee Name" value={fullName} />
                <Field label="Position" value={getPositionLabel(action.employee.position)} />
                <Field label="Hire Date" value={formatDate(action.employee.hireDate)} />
              </>
            }
            right={
              <>
                <Field label="Site" value={action.house?.name || "N/A"} />
                <Field label="Issued By" value={action.issuedBy.name} />
                <Field label="Issue Date" value={formatDate(action.createdAt)} />
              </>
            }
          />
        </Section>

        {/* Violation Details */}
        <Section title="Violation Details">
          <TwoColumn
            left={
              <>
                <Field label="Date of Violation" value={formatDate(action.violationDate)} />
                {action.violationTime && <Field label="Time" value={action.violationTime} />}
                <Field label="Category" value={action.violationCategory.categoryName} />
              </>
            }
            right={
              <>
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.secondary }}>Severity Level</Text>
                  <Text style={[styles.severityBadge, getSeverityStyle(action.violationCategory.severityLevel)]}>
                    {action.violationCategory.severityLevel.replace("_", " ")}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.secondary }}>Discipline Level</Text>
                  <Text style={styles.disciplineBadge}>
                    {getDisciplineLevelLabel(action.disciplineLevel)}
                  </Text>
                </View>
              </>
            }
          />

          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.secondary, marginBottom: 4 }}>
              Description of Incident
            </Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{action.incidentDescription}</Text>
            </View>
          </View>

          {action.mitigatingCircumstances && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.secondary, marginBottom: 4 }}>
                Mitigating Circumstances
              </Text>
              <View style={[styles.descriptionBox, { backgroundColor: "#f0f9ff" }]}>
                <Text style={styles.descriptionText}>{action.mitigatingCircumstances}</Text>
              </View>
            </View>
          )}
        </Section>

        {/* Points */}
        <Section title="Points Assessment">
          <View style={styles.pointsDisplay}>
            <View style={styles.pointsBox}>
              <Text style={styles.pointsNumber}>{points}</Text>
              <Text style={styles.pointsLabel}>Points Assigned</Text>
            </View>
            {action.pointsAdjusted !== null && action.pointsAdjusted !== action.pointsAssigned && (
              <View style={styles.pointsBox}>
                <Text style={[styles.pointsNumber, { textDecoration: "line-through", color: colors.secondary }]}>
                  {action.pointsAssigned}
                </Text>
                <Text style={styles.pointsLabel}>Original Points</Text>
              </View>
            )}
            {currentPoints !== undefined && (
              <View style={styles.pointsBox}>
                <Text style={[styles.pointsNumber, { color: currentPoints >= 14 ? colors.error : colors.text }]}>
                  {currentPoints}
                </Text>
                <Text style={styles.pointsLabel}>Current Total (90-day)</Text>
              </View>
            )}
          </View>

          {action.adjustmentReason && (
            <View style={styles.infoBox}>
              <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.secondary }}>
                Point Adjustment Reason:
              </Text>
              <Text style={{ fontSize: 9, color: colors.text, marginTop: 2 }}>
                {action.adjustmentReason}
              </Text>
            </View>
          )}
        </Section>

        {/* Expectations */}
        {(expectations.length > 0 || action.consequencesText) && (
          <Section title="Expectations & Consequences">
            {expectations.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.secondary }}>
                  Expectations for Improvement:
                </Text>
                <View style={styles.expectationsList}>
                  {expectations.map((exp: string, i: number) => (
                    <View key={i} style={styles.expectationItem}>
                      <Text style={styles.expectationBullet}>•</Text>
                      <Text style={styles.expectationText}>{exp}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {action.consequencesText && (
              <View style={styles.consequencesBox}>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#991b1b", marginBottom: 4 }}>
                  Consequences of Future Violations:
                </Text>
                <Text style={styles.consequencesText}>{action.consequencesText}</Text>
              </View>
            )}

            {action.pipScheduled && action.pipDate && (
              <View style={styles.pipBox}>
                <Text style={styles.pipTitle}>Performance Improvement Plan Scheduled</Text>
                <Text style={styles.pipDate}>Meeting Date: {formatDateTime(action.pipDate)}</Text>
              </View>
            )}
          </Section>
        )}

        {/* Employee Comments */}
        {action.employeeComments && (
          <Section title="Employee Comments">
            <View style={styles.commentsBox}>
              <Text style={styles.commentsText}>{action.employeeComments}</Text>
            </View>
          </Section>
        )}

        {/* Signatures */}
        <Section title="Acknowledgment Signatures">
          <Text style={{ fontSize: 8, color: colors.textMuted, marginBottom: 12 }}>
            By signing below, I acknowledge receipt of this corrective action notice. My signature indicates I have
            been informed of the concerns and expectations. It does not necessarily indicate agreement.
          </Text>

          <View style={styles.signatureRow}>
            {/* Supervisor Signature */}
            <View style={styles.signatureBlock}>
              {supervisorSignature?.signatureData ? (
                <Image
                  src={supervisorSignature.signatureData}
                  style={styles.signatureImage}
                />
              ) : (
                <View style={styles.signaturePending}>
                  <Text style={styles.signaturePendingText}>Pending</Text>
                </View>
              )}
              <Text style={styles.signatureLabel}>Supervisor</Text>
              <Text style={styles.signatureName}>
                {supervisorSignature?.signer.name || "________________________"}
              </Text>
              <Text style={styles.signatureDate}>
                {supervisorSignature ? formatDateTime(supervisorSignature.signedAt) : "Date: _______________"}
              </Text>
            </View>

            {/* Employee Signature */}
            <View style={styles.signatureBlock}>
              {employeeSignature?.signatureData ? (
                <Image
                  src={employeeSignature.signatureData}
                  style={styles.signatureImage}
                />
              ) : (
                <View style={styles.signaturePending}>
                  <Text style={styles.signaturePendingText}>Pending</Text>
                </View>
              )}
              <Text style={styles.signatureLabel}>Employee</Text>
              <Text style={styles.signatureName}>
                {employeeSignature?.signer.name || "________________________"}
              </Text>
              <Text style={styles.signatureDate}>
                {employeeSignature ? formatDateTime(employeeSignature.signedAt) : "Date: _______________"}
              </Text>
            </View>
          </View>

          {witnessSignature && (
            <View style={[styles.signatureBlock, { marginTop: 16, width: "45%" }]}>
              {witnessSignature.signatureData ? (
                <Image
                  src={witnessSignature.signatureData}
                  style={styles.signatureImage}
                />
              ) : null}
              <Text style={styles.signatureLabel}>Witness</Text>
              <Text style={styles.signatureName}>{witnessSignature.signer.name}</Text>
              <Text style={styles.signatureDate}>{formatDateTime(witnessSignature.signedAt)}</Text>
            </View>
          )}
        </Section>

        {/* Confidentiality Notice */}
        <View style={styles.confidentialNote}>
          <Text style={styles.confidentialText}>
            CONFIDENTIAL - This document contains confidential personnel information. Unauthorized
            disclosure is prohibited. This document will be retained in the employee's personnel file
            in accordance with Mercy Link LLC record retention policies.
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
}

export function getCorrectiveActionFilename(action: {
  employee: { firstName: string; lastName: string };
  violationDate: Date | string;
}): string {
  const date = format(
    typeof action.violationDate === "string"
      ? new Date(action.violationDate)
      : action.violationDate,
    "yyyy-MM-dd"
  );
  const name = `${action.employee.lastName}_${action.employee.firstName}`.replace(
    /[^a-zA-Z0-9]/g,
    "_"
  );
  return `CorrectiveAction_${name}_${date}.pdf`;
}
