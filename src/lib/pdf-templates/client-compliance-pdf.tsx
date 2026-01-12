import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format, differenceInDays } from "date-fns";
import {
  baseStyles,
  colors,
  PDFHeader,
  PDFFooter,
  Section,
  Field,
  TwoColumn,
} from "../pdf-service";

interface ComplianceItem {
  id: string;
  itemType: string;
  itemName: string;
  dueDate: Date | string;
  completedDate: Date | string | null;
  status: string;
  statuteRef: string | null;
  notes: string | null;
}

interface ClientComplianceData {
  id: string;
  firstName: string;
  lastName: string;
  dob: Date | string;
  admissionDate: Date | string;
  status: string;
  waiverType: string | null;
  house: {
    name: string;
    address: string | null;
  };
  complianceItems: ComplianceItem[];
}

interface ClientCompliancePDFProps {
  client: ClientComplianceData;
}

const styles = StyleSheet.create({
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 2,
  },
  statNumberCompleted: {
    color: colors.success,
  },
  statNumberOverdue: {
    color: colors.error,
  },
  statNumberPending: {
    color: colors.warning,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 32,
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  colItem: {
    width: "30%",
    paddingRight: 4,
  },
  colStatute: {
    width: "15%",
    paddingRight: 4,
  },
  colDue: {
    width: "15%",
    paddingRight: 4,
  },
  colCompleted: {
    width: "15%",
    paddingRight: 4,
  },
  colStatus: {
    width: "15%",
    paddingRight: 4,
  },
  colDays: {
    width: "10%",
    textAlign: "right",
  },
  headerText: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.text,
  },
  cellText: {
    fontSize: 8,
    color: colors.text,
  },
  cellTextSmall: {
    fontSize: 7,
    color: colors.secondary,
  },
  statusBadge: {
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    textAlign: "center",
  },
  statusCompleted: {
    backgroundColor: "#dcfce7",
    color: colors.success,
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: colors.warning,
  },
  statusOverdue: {
    backgroundColor: "#fee2e2",
    color: colors.error,
  },
  statusNotCompleted: {
    backgroundColor: "#f3e8ff",
    color: "#7c3aed",
  },
  daysText: {
    fontSize: 7,
    textAlign: "right",
  },
  daysOverdue: {
    color: colors.error,
    fontWeight: "bold",
  },
  daysDue: {
    color: colors.warning,
  },
  daysCompleted: {
    color: colors.success,
  },
  notesSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  noteTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 8,
    color: colors.text,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  waiverBadge: {
    fontSize: 10,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
});

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
}

function getDaysUntilDue(dueDate: Date | string, completedDate: Date | string | null): { days: number; status: "overdue" | "due" | "completed" } {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;

  if (completedDate) {
    const completed = typeof completedDate === "string" ? new Date(completedDate) : completedDate;
    const daysEarly = differenceInDays(due, completed);
    return { days: daysEarly, status: "completed" };
  }

  const today = new Date();
  const daysRemaining = differenceInDays(due, today);

  if (daysRemaining < 0) {
    return { days: Math.abs(daysRemaining), status: "overdue" };
  }
  return { days: daysRemaining, status: "due" };
}

function getStatusStyle(status: string) {
  switch (status) {
    case "COMPLETED":
      return styles.statusCompleted;
    case "OVERDUE":
      return styles.statusOverdue;
    case "NOT_COMPLETED":
      return styles.statusNotCompleted;
    default:
      return styles.statusPending;
  }
}

// Group compliance items by category
function groupByCategory(items: ComplianceItem[]): Record<string, ComplianceItem[]> {
  const categories: Record<string, ComplianceItem[]> = {
    "Admission Requirements": [],
    "Planning & Assessment": [],
    "Rights & Reviews": [],
    "Ongoing Requirements": [],
  };

  items.forEach((item) => {
    switch (item.itemType) {
      case "ABUSE_PREVENTION_PLAN":
        categories["Admission Requirements"].push(item);
        break;
      case "PRELIMINARY_CSSP":
      case "FUNCTIONAL_ASSESSMENT":
      case "PLANNING_MEETING_45_DAY":
      case "SERVICE_PLAN_CSSP":
      case "CSSP_SIGNATURES":
      case "ANNUAL_PLANNING_MEETING":
        categories["Planning & Assessment"].push(item);
        break;
      case "SERVICE_RECIPIENT_RIGHTS":
        categories["Rights & Reviews"].push(item);
        break;
      case "PROGRESS_REVIEW":
      case "MEDICATION_ADMIN_RECORD":
      default:
        categories["Ongoing Requirements"].push(item);
        break;
    }
  });

  return categories;
}

export function ClientCompliancePDF({ client }: ClientCompliancePDFProps) {
  const fullName = `${client.firstName} ${client.lastName}`;

  // Calculate statistics
  const total = client.complianceItems.length;
  const completed = client.complianceItems.filter((i) => i.status === "COMPLETED").length;
  const overdue = client.complianceItems.filter((i) => i.status === "OVERDUE").length;
  const pending = client.complianceItems.filter((i) => i.status === "PENDING").length;
  const notCompleted = client.complianceItems.filter((i) => i.status === "NOT_COMPLETED").length;
  const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const groupedItems = groupByCategory(client.complianceItems);

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title="Compliance Summary Report" subtitle={fullName} />

        {/* Client Header */}
        <View style={styles.clientHeader}>
          <View>
            <Text style={styles.clientName}>{fullName}</Text>
            <Text style={styles.clientHouse}>{client.house.name}</Text>
          </View>
          {client.waiverType && (
            <Text style={styles.waiverBadge}>{client.waiverType} Waiver</Text>
          )}
        </View>

        {/* Client Info */}
        <Section title="Client Information">
          <TwoColumn
            left={
              <>
                <Field label="Date of Birth" value={formatDate(client.dob)} />
                <Field label="Admission Date" value={formatDate(client.admissionDate)} />
              </>
            }
            right={
              <>
                <Field label="Status" value={client.status} />
                <Field label="Residence" value={client.house.name} />
              </>
            }
          />
        </Section>

        {/* Summary Statistics */}
        <Section title="Compliance Summary">
          <View style={styles.summaryBox}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber]}>{total}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.statNumberCompleted]}>{completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.statNumberPending]}>{pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.statNumberOverdue]}>{overdue}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber]}>{notCompleted}</Text>
              <Text style={styles.statLabel}>Not Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, complianceRate >= 80 ? styles.statNumberCompleted : complianceRate >= 50 ? styles.statNumberPending : styles.statNumberOverdue]}>
                {complianceRate}%
              </Text>
              <Text style={styles.statLabel}>Compliance Rate</Text>
            </View>
          </View>
        </Section>

        {/* Compliance Items by Category */}
        {Object.entries(groupedItems).map(([category, items]) => {
          if (items.length === 0) return null;

          return (
            <Section key={category} title={category}>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <View style={styles.colItem}>
                    <Text style={styles.headerText}>Item</Text>
                  </View>
                  <View style={styles.colStatute}>
                    <Text style={styles.headerText}>Statute</Text>
                  </View>
                  <View style={styles.colDue}>
                    <Text style={styles.headerText}>Due Date</Text>
                  </View>
                  <View style={styles.colCompleted}>
                    <Text style={styles.headerText}>Completed</Text>
                  </View>
                  <View style={styles.colStatus}>
                    <Text style={styles.headerText}>Status</Text>
                  </View>
                  <View style={styles.colDays}>
                    <Text style={styles.headerText}>Days</Text>
                  </View>
                </View>

                {/* Table Rows */}
                {items.map((item, index) => {
                  const { days, status } = getDaysUntilDue(item.dueDate, item.completedDate);

                  return (
                    <View key={item.id} style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <View style={styles.colItem}>
                        <Text style={styles.cellText}>{item.itemName}</Text>
                      </View>
                      <View style={styles.colStatute}>
                        <Text style={styles.cellTextSmall}>{item.statuteRef || "—"}</Text>
                      </View>
                      <View style={styles.colDue}>
                        <Text style={styles.cellText}>{formatDate(item.dueDate)}</Text>
                      </View>
                      <View style={styles.colCompleted}>
                        <Text style={styles.cellText}>{formatDate(item.completedDate)}</Text>
                      </View>
                      <View style={styles.colStatus}>
                        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                          {item.status.replace("_", " ")}
                        </Text>
                      </View>
                      <View style={styles.colDays}>
                        <Text
                          style={[
                            styles.daysText,
                            status === "overdue" ? styles.daysOverdue : status === "due" ? styles.daysDue : status === "completed" ? styles.daysCompleted : {},
                          ]}
                        >
                          {status === "overdue"
                            ? `-${days}`
                            : status === "completed"
                            ? `+${days}`
                            : days}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Section>
          );
        })}

        {/* Notes Section for Items with Notes */}
        {client.complianceItems.filter((i) => i.notes).length > 0 && (
          <View style={styles.notesSection}>
            <Text style={styles.noteTitle}>Additional Notes</Text>
            {client.complianceItems
              .filter((i) => i.notes)
              .map((item) => (
                <View key={item.id} style={{ marginBottom: 8 }}>
                  <Text style={[styles.noteText, { fontWeight: "bold" }]}>{item.itemName}:</Text>
                  <Text style={styles.noteText}>{item.notes}</Text>
                </View>
              ))}
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
}

export function getClientComplianceFilename(client: { firstName: string; lastName: string }): string {
  const date = format(new Date(), "yyyy-MM-dd");
  const name = `${client.lastName}_${client.firstName}`.replace(/[^a-zA-Z0-9]/g, "_");
  return `ComplianceReport_${name}_${date}.pdf`;
}
