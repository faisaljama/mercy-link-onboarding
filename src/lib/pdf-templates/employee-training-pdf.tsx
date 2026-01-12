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
import {
  getTrainingTemplate,
  getTrainingCompletionStats,
  LOG_TYPE_LABELS,
  PLATFORM_LABELS,
  type TrainingChecklistState,
} from "../training-log-templates";

interface TrainingDocument {
  id: string;
  fileName: string;
  uploadedAt: Date | string;
}

interface TrainingItem {
  id: string;
  itemType: string;
  itemName: string;
  dueDate: Date | string;
  completedDate: Date | string | null;
  status: string;
  statuteRef: string | null;
  notes: string | null;
  documents?: TrainingDocument[];
}

interface AssignedHouse {
  house: {
    name: string;
  };
}

interface TrainingLogDocument {
  id: string;
  fileName: string;
  uploadedAt: Date | string;
}

interface TrainingLog {
  id: string;
  logType: string;
  year: number;
  checklistItems: string;
  hoursRequired: number | null;
  hoursCompleted: number;
  employeeSignedAt: Date | string | null;
  supervisorSignedAt: Date | string | null;
  documents: TrainingLogDocument[];
}

interface EmployeeTrainingData {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  hireDate: Date | string;
  experienceYears: number;
  email: string | null;
  phone: string | null;
  assignedHouses: AssignedHouse[];
  complianceItems: TrainingItem[];
  trainingLogs?: TrainingLog[];
}

interface EmployeeTrainingPDFProps {
  employee: EmployeeTrainingData;
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
    width: "35%",
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
    width: "12%",
    paddingRight: 4,
  },
  colDocs: {
    width: "8%",
    textAlign: "center",
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
  employeeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  employeePosition: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2,
  },
  positionBadge: {
    fontSize: 10,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  hoursBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  hoursLabel: {
    fontSize: 10,
    color: colors.secondary,
    marginRight: 8,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  hoursRequired: {
    fontSize: 10,
    color: colors.secondary,
    marginLeft: 4,
  },
  certificationNote: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  certificationNoteText: {
    fontSize: 8,
    color: "#92400e",
  },
  trainingLogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trainingLogTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text,
  },
  trainingLogBadge: {
    fontSize: 8,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  trainingLogStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  trainingLogStat: {
    fontSize: 9,
    color: colors.secondary,
  },
  trainingItemRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  trainingItemRowComplete: {
    backgroundColor: "#f0fdf4",
  },
  colCheck: {
    width: "5%",
  },
  colName: {
    width: "35%",
    paddingRight: 4,
  },
  colHours: {
    width: "10%",
    paddingRight: 4,
  },
  colDate: {
    width: "15%",
    paddingRight: 4,
  },
  colScore: {
    width: "12%",
    paddingRight: 4,
  },
  colTrainer: {
    width: "10%",
    paddingRight: 4,
  },
  colPlatform: {
    width: "13%",
  },
  checkmark: {
    fontSize: 10,
    color: colors.success,
  },
  platformBadge: {
    fontSize: 7,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  platformStar: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  platformCompany: {
    backgroundColor: "#f3e8ff",
    color: "#7c3aed",
  },
  platformExternal: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
}

function getPositionLabel(position: string): string {
  switch (position) {
    case "DSP":
      return "Direct Support Professional";
    case "LEAD_DSP":
      return "Lead DSP";
    case "DC":
      return "Designated Coordinator";
    case "DM":
      return "Designated Manager";
    default:
      return position;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "COMPLETED":
      return styles.statusCompleted;
    case "OVERDUE":
      return styles.statusOverdue;
    default:
      return styles.statusPending;
  }
}

function groupByCategory(items: TrainingItem[]): Record<string, TrainingItem[]> {
  const categories: Record<string, TrainingItem[]> = {
    "Background & Screening": [],
    "Required Certifications": [],
    "Initial Training": [],
    "Ongoing Training": [],
    "Other Requirements": [],
  };

  items.forEach((item) => {
    const type = item.itemType.toUpperCase();
    if (type.includes("BACKGROUND")) {
      categories["Background & Screening"].push(item);
    } else if (type.includes("FIRST_AID") || type.includes("CPR")) {
      categories["Required Certifications"].push(item);
    } else if (type.includes("ORIENTATION") || type.includes("MALTREATMENT")) {
      categories["Initial Training"].push(item);
    } else if (type.includes("TRAINING") || type.includes("ANNUAL")) {
      categories["Ongoing Training"].push(item);
    } else {
      categories["Other Requirements"].push(item);
    }
  });

  return categories;
}

function calculateTrainingHours(items: TrainingItem[]): number {
  const completedTraining = items.filter(
    (i) => i.status === "COMPLETED" && i.itemType.toUpperCase().includes("TRAINING")
  ).length;
  return completedTraining * 4;
}

export function EmployeeTrainingPDF({ employee }: EmployeeTrainingPDFProps) {
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const houseNames = employee.assignedHouses.map((h) => h.house.name).join(", ");

  // Calculate statistics
  const total = employee.complianceItems.length;
  const completed = employee.complianceItems.filter((i) => i.status === "COMPLETED").length;
  const overdue = employee.complianceItems.filter((i) => i.status === "OVERDUE").length;
  const pending = employee.complianceItems.filter((i) => i.status === "PENDING").length;
  const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const trainingHours = calculateTrainingHours(employee.complianceItems);
  const requiredHours = employee.experienceYears >= 5 ? 12 : 24;

  const groupedItems = groupByCategory(employee.complianceItems);

  // Find expiring certifications
  const expiringCerts = employee.complianceItems.filter((item) => {
    if (item.status !== "COMPLETED") return false;
    const type = item.itemType.toUpperCase();
    if (!type.includes("FIRST_AID") && !type.includes("CPR")) return false;
    const dueDate = typeof item.dueDate === "string" ? new Date(item.dueDate) : item.dueDate;
    const daysUntil = differenceInDays(dueDate, new Date());
    return daysUntil <= 30 && daysUntil >= 0;
  });

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title="Training Transcript" subtitle={fullName} />

        {/* Employee Header */}
        <View style={styles.employeeHeader}>
          <View>
            <Text style={styles.employeeName}>{fullName}</Text>
            <Text style={styles.employeePosition}>
              {houseNames || "No houses assigned"}
            </Text>
          </View>
          <Text style={styles.positionBadge}>{getPositionLabel(employee.position)}</Text>
        </View>

        {/* Employee Info */}
        <Section title="Employee Information">
          <TwoColumn
            left={
              <>
                <Field label="Hire Date" value={formatDate(employee.hireDate)} />
                <Field label="Experience" value={`${employee.experienceYears} years`} />
                <Field label="Position" value={getPositionLabel(employee.position)} />
              </>
            }
            right={
              <>
                <Field label="Email" value={employee.email || "—"} />
                <Field label="Phone" value={employee.phone || "—"} />
                <Field label="Assigned Houses" value={houseNames || "None"} />
              </>
            }
          />
        </Section>

        {/* Summary Statistics */}
        <Section title="Training Summary">
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
              <Text style={[styles.statNumber, complianceRate >= 80 ? styles.statNumberCompleted : complianceRate >= 50 ? styles.statNumberPending : styles.statNumberOverdue]}>
                {complianceRate}%
              </Text>
              <Text style={styles.statLabel}>Compliance Rate</Text>
            </View>
          </View>

          {/* Annual Training Hours */}
          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>Annual Training Hours:</Text>
            <Text style={[styles.hoursValue, trainingHours >= requiredHours ? { color: colors.success } : { color: colors.warning }]}>
              {trainingHours}
            </Text>
            <Text style={styles.hoursRequired}>/ {requiredHours} required</Text>
            <Text style={[styles.hoursRequired, { marginLeft: 8 }]}>
              ({employee.experienceYears >= 5 ? "5+ years experience" : "<5 years experience"})
            </Text>
          </View>
        </Section>

        {/* Expiring Certifications Warning */}
        {expiringCerts.length > 0 && (
          <View style={styles.certificationNote}>
            <Text style={styles.certificationNoteText}>
              Certifications expiring within 30 days: {expiringCerts.map((c) => c.itemName).join(", ")}
            </Text>
          </View>
        )}

        {/* Training Items by Category */}
        {Object.entries(groupedItems).map(([category, items]) => {
          if (items.length === 0) return null;

          return (
            <Section key={category} title={category}>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <View style={styles.colItem}>
                    <Text style={styles.headerText}>Training Item</Text>
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
                  <View style={styles.colDocs}>
                    <Text style={styles.headerText}>Docs</Text>
                  </View>
                </View>

                {/* Table Rows */}
                {items.map((item, index) => (
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
                        {item.status}
                      </Text>
                    </View>
                    <View style={styles.colDocs}>
                      <Text style={styles.cellText}>{item.documents?.length || 0}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          );
        })}

        {/* Training Logs Section */}
        {employee.trainingLogs && employee.trainingLogs.length > 0 && (
          <Section title="Training Logs (Star Services & Company Training)">
            {employee.trainingLogs.map((log) => {
              const checklistState: TrainingChecklistState = JSON.parse(log.checklistItems || "{}");
              const template = getTrainingTemplate(log.logType);
              const stats = getTrainingCompletionStats(log.logType, checklistState);

              return (
                <View key={log.id} style={{ marginBottom: 16 }}>
                  <View style={styles.trainingLogHeader}>
                    <Text style={styles.trainingLogTitle}>
                      {LOG_TYPE_LABELS[log.logType] || log.logType}
                      {log.year > 0 ? ` - ${log.year}` : ""}
                    </Text>
                    <Text style={styles.trainingLogBadge}>
                      {stats.completed}/{stats.total} Complete
                    </Text>
                  </View>
                  <View style={styles.trainingLogStats}>
                    <Text style={styles.trainingLogStat}>
                      Hours: {stats.hoursCompleted.toFixed(1)} / {stats.hoursRequired.toFixed(1)}
                    </Text>
                    <Text style={styles.trainingLogStat}>
                      Documents: {log.documents.length}
                    </Text>
                    {log.employeeSignedAt && (
                      <Text style={styles.trainingLogStat}>
                        Employee Signed: {formatDate(log.employeeSignedAt)}
                      </Text>
                    )}
                    {log.supervisorSignedAt && (
                      <Text style={styles.trainingLogStat}>
                        Supervisor Signed: {formatDate(log.supervisorSignedAt)}
                      </Text>
                    )}
                  </View>

                  {/* Training Log Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={styles.colCheck}>
                      <Text style={styles.headerText}></Text>
                    </View>
                    <View style={styles.colName}>
                      <Text style={styles.headerText}>Training Course</Text>
                    </View>
                    <View style={styles.colHours}>
                      <Text style={styles.headerText}>Hours</Text>
                    </View>
                    <View style={styles.colDate}>
                      <Text style={styles.headerText}>Date</Text>
                    </View>
                    <View style={styles.colScore}>
                      <Text style={styles.headerText}>Score</Text>
                    </View>
                    <View style={styles.colTrainer}>
                      <Text style={styles.headerText}>Trainer</Text>
                    </View>
                    <View style={styles.colPlatform}>
                      <Text style={styles.headerText}>Platform</Text>
                    </View>
                  </View>

                  {/* Training Log Items */}
                  {template.map((section) => (
                    <View key={section.title}>
                      <Text style={styles.sectionSubtitle}>{section.title}</Text>
                      {section.items.map((item) => {
                        const itemState = checklistState[item.key];
                        const isComplete = itemState?.completed;
                        const platformStyle = item.platform === "STAR"
                          ? styles.platformStar
                          : item.platform === "COMPANY"
                          ? styles.platformCompany
                          : styles.platformExternal;

                        return (
                          <View
                            key={item.key}
                            style={
                              isComplete
                                ? [styles.trainingItemRow, styles.trainingItemRowComplete]
                                : styles.trainingItemRow
                            }
                          >
                            <View style={styles.colCheck}>
                              <Text style={styles.checkmark}>
                                {isComplete ? "✓" : ""}
                              </Text>
                            </View>
                            <View style={styles.colName}>
                              <Text style={styles.cellText}>{item.label}</Text>
                            </View>
                            <View style={styles.colHours}>
                              <Text style={styles.cellText}>{item.hours}</Text>
                            </View>
                            <View style={styles.colDate}>
                              <Text style={styles.cellText}>
                                {itemState?.completedDate ? formatDate(itemState.completedDate) : "—"}
                              </Text>
                            </View>
                            <View style={styles.colScore}>
                              <Text style={styles.cellText}>
                                {itemState?.score || "—"}
                              </Text>
                            </View>
                            <View style={styles.colTrainer}>
                              <Text style={styles.cellText}>
                                {itemState?.trainerInitials || "—"}
                              </Text>
                            </View>
                            <View style={styles.colPlatform}>
                              <Text style={[styles.platformBadge, platformStyle]}>
                                {PLATFORM_LABELS[item.platform]}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })}
          </Section>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
}

export function getEmployeeTrainingFilename(employee: { firstName: string; lastName: string }): string {
  const date = format(new Date(), "yyyy-MM-dd");
  const name = `${employee.lastName}_${employee.firstName}`.replace(/[^a-zA-Z0-9]/g, "_");
  return `TrainingTranscript_${name}_${date}.pdf`;
}
