import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import {
  baseStyles,
  colors,
  PDFHeader,
  PDFFooter,
} from "../pdf-service";
import {
  getChecklistTemplate,
  formatSigners,
  MEETING_TYPE_LABELS,
  type ChecklistState,
} from "../meeting-compliance-templates";

interface MeetingCompliancePDFProps {
  clientName: string;
  houseName: string;
  admissionDate: string;
  meeting: {
    meetingType: string;
    meetingDate: string;
    year: number;
    checklistItems: string;
    notes: string | null;
    caseManagerAbsent: boolean;
    docsSentDate: string | null;
    docsSentNotes: string | null;
  };
}

const styles = StyleSheet.create({
  infoSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: colors.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: "bold",
  },
  checklistSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.text,
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checklistItemOptional: {
    backgroundColor: "#fafafa",
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 2,
    marginRight: 10,
    marginTop: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    fontSize: 10,
    color: colors.white,
    fontWeight: "bold",
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 2,
  },
  itemLabelOptional: {
    color: colors.textMuted,
  },
  itemSublabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  itemSigners: {
    fontSize: 8,
    color: colors.textLight,
  },
  itemStatus: {
    width: 80,
    textAlign: "right",
  },
  completedText: {
    fontSize: 8,
    color: colors.success,
  },
  pendingText: {
    fontSize: 8,
    color: colors.textLight,
  },
  optionalTag: {
    fontSize: 7,
    color: colors.textLight,
    fontStyle: "italic",
  },
  caseManagerSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fbbf24",
    borderRadius: 4,
  },
  caseManagerTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 8,
  },
  caseManagerInfo: {
    fontSize: 9,
    color: "#78350f",
    marginBottom: 4,
  },
  notesSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
  },
  signatureBlock: {
    width: "30%",
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
    width: "100%",
    height: 30,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.secondary,
    textAlign: "center",
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    padding: 10,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  summaryValueGreen: {
    color: colors.success,
  },
  summaryLabel: {
    fontSize: 8,
    color: colors.secondary,
    marginTop: 2,
  },
});

export function MeetingCompliancePDF({
  clientName,
  houseName,
  admissionDate,
  meeting,
}: MeetingCompliancePDFProps) {
  const checklistState: ChecklistState = JSON.parse(meeting.checklistItems);
  const template = getChecklistTemplate(meeting.meetingType);

  // Calculate stats
  let completed = 0;
  let total = template.length;
  let requiredComplete = 0;
  let requiredTotal = 0;

  template.forEach((item) => {
    if (!item.optional) requiredTotal++;
    if (checklistState[item.key]?.completed) {
      completed++;
      if (!item.optional) requiredComplete++;
    }
  });

  const meetingTypeLabel = MEETING_TYPE_LABELS[meeting.meetingType] || meeting.meetingType;
  const subtitle = `${clientName} - Year ${meeting.year}`;

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title={`${meetingTypeLabel} Checklist`} subtitle={subtitle} />

        {/* Client & Meeting Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Client Name</Text>
              <Text style={styles.infoValue}>{clientName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>House</Text>
              <Text style={styles.infoValue}>{houseName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Meeting Date</Text>
              <Text style={styles.infoValue}>
                {format(new Date(meeting.meetingDate), "MMMM d, yyyy")}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Admission Date</Text>
              <Text style={styles.infoValue}>
                {format(new Date(admissionDate), "MMMM d, yyyy")}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completed}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{total - completed}</Text>
            <Text style={styles.summaryLabel}>Remaining</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{total}</Text>
            <Text style={styles.summaryLabel}>Total Items</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, requiredComplete === requiredTotal ? styles.summaryValueGreen : {}]}>
              {requiredComplete}/{requiredTotal}
            </Text>
            <Text style={styles.summaryLabel}>Required</Text>
          </View>
        </View>

        {/* Checklist Section */}
        <View style={styles.checklistSection}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {template.map((item) => {
            const state = checklistState[item.key];
            const isCompleted = state?.completed || false;

            return (
              <View
                key={item.key}
                style={[
                  styles.checklistItem,
                  item.optional ? styles.checklistItemOptional : {},
                ]}
                wrap={false}
              >
                <View style={[styles.checkbox, isCompleted ? styles.checkboxChecked : {}]}>
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemLabel, item.optional ? styles.itemLabelOptional : {}]}>
                    {item.label}
                    {item.optional && <Text style={styles.optionalTag}> (if applicable)</Text>}
                  </Text>
                  {item.sublabel && (
                    <Text style={styles.itemSublabel}>{item.sublabel}</Text>
                  )}
                  {item.signers.length > 0 && (
                    <Text style={styles.itemSigners}>
                      Signed by: {formatSigners(item.signers)}
                    </Text>
                  )}
                </View>
                <View style={styles.itemStatus}>
                  {isCompleted && state?.completedDate ? (
                    <Text style={styles.completedText}>
                      ✓ {format(new Date(state.completedDate), "M/d/yy")}
                    </Text>
                  ) : (
                    <Text style={styles.pendingText}>Pending</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Case Manager Absent Section */}
        {meeting.caseManagerAbsent && (
          <View style={styles.caseManagerSection}>
            <Text style={styles.caseManagerTitle}>
              Case Manager Was Not Present at Meeting
            </Text>
            {meeting.docsSentDate && (
              <Text style={styles.caseManagerInfo}>
                Documents sent on: {format(new Date(meeting.docsSentDate), "MMMM d, yyyy")}
              </Text>
            )}
            {meeting.docsSentNotes && (
              <Text style={styles.caseManagerInfo}>
                Notes: {meeting.docsSentNotes}
              </Text>
            )}
            <Text style={[styles.caseManagerInfo, { marginTop: 4 }]}>
              Requesting dated signatures for approval.
            </Text>
          </View>
        )}

        {/* Notes Section */}
        {meeting.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Meeting Notes</Text>
            <Text style={styles.notesText}>{meeting.notes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Person / Legal Rep</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Case Manager</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Provider / Date</Text>
          </View>
        </View>

        <PDFFooter showConfidential={true} />
      </Page>
    </Document>
  );
}

// Helper function to generate filename
export function getMeetingComplianceFilename(
  clientName: string,
  meetingType: string,
  year: number
): string {
  const typeLabel = MEETING_TYPE_LABELS[meetingType]?.replace(/[^a-zA-Z0-9]/g, "_") || meetingType;
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, "_");
  return `${safeName}_${typeLabel}_Year${year}.pdf`;
}
