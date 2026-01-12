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
  Section,
} from "../pdf-service";

interface ChecklistItem {
  label: string;
  category: string;
  value: string;
  notes: string;
}

interface QAChecklistData {
  id: string;
  checklistType: string;
  reviewDate: string | Date;
  status: string;
  overallNotes: string | null;
  followUpRequired: boolean;
  followUpDate: string | Date | null;
  followUpNotes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface QAChecklistPDFProps {
  checklist: QAChecklistData;
  items: ChecklistItem[];
  house: { name: string } | null;
  client: { firstName: string; lastName: string } | null;
  reviewer: { name: string } | null;
}

const styles = StyleSheet.create({
  headerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBox: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 8,
    color: colors.secondary,
    marginBottom: 2,
  },
  headerValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.text,
  },
  statusBadge: {
    fontSize: 9,
    color: colors.white,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
  statusNeedsAttention: {
    backgroundColor: colors.error,
  },
  statusInProgress: {
    backgroundColor: colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 4,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 8,
    color: colors.secondary,
    marginTop: 2,
  },
  statGreen: {
    color: colors.success,
  },
  statRed: {
    color: colors.error,
  },
  statGray: {
    color: colors.textLight,
  },
  statBlue: {
    color: colors.primary,
  },
  followUpBox: {
    backgroundColor: "#fef3c7", // orange-100
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fcd34d", // orange-300
  },
  followUpTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400e", // orange-800
    marginBottom: 4,
  },
  followUpText: {
    fontSize: 9,
    color: "#b45309", // orange-700
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.text,
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  itemIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  iconYes: {
    backgroundColor: "#dcfce7",
  },
  iconNo: {
    backgroundColor: "#fee2e2",
  },
  iconNa: {
    backgroundColor: "#f1f5f9",
  },
  iconPending: {
    backgroundColor: "#e2e8f0",
  },
  iconText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  iconTextYes: {
    color: colors.success,
  },
  iconTextNo: {
    color: colors.error,
  },
  iconTextNa: {
    color: colors.textLight,
  },
  itemLabel: {
    fontSize: 9,
    color: colors.text,
    flex: 1,
  },
  itemNotes: {
    fontSize: 8,
    color: colors.secondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  itemBadge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeYes: {
    borderColor: colors.success,
    color: colors.success,
  },
  badgeNo: {
    borderColor: colors.error,
    color: colors.error,
  },
  badgeNa: {
    borderColor: colors.textLight,
    color: colors.textLight,
  },
  badgePending: {
    borderColor: colors.borderDark,
    color: colors.textLight,
  },
  overallNotes: {
    fontSize: 9,
    color: colors.text,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 4,
  },
  reviewInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  reviewInfoItem: {
    width: "48%",
  },
  reviewInfoLabel: {
    fontSize: 8,
    color: colors.secondary,
    marginBottom: 2,
  },
  reviewInfoValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: "bold",
  },
});

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

function ItemIcon({ value }: { value: string }) {
  const getStyles = () => {
    switch (value) {
      case "YES":
        return { container: styles.iconYes, text: styles.iconTextYes, label: "Y" };
      case "NO":
        return { container: styles.iconNo, text: styles.iconTextNo, label: "N" };
      case "NA":
        return { container: styles.iconNa, text: styles.iconTextNa, label: "—" };
      default:
        return { container: styles.iconPending, text: styles.iconTextNa, label: "?" };
    }
  };

  const s = getStyles();

  return (
    <View style={[styles.itemIcon, s.container]}>
      <Text style={[styles.iconText, s.text]}>{s.label}</Text>
    </View>
  );
}

function ItemBadge({ value }: { value: string }) {
  const getBadgeStyle = () => {
    switch (value) {
      case "YES":
        return styles.badgeYes;
      case "NO":
        return styles.badgeNo;
      case "NA":
        return styles.badgeNa;
      default:
        return styles.badgePending;
    }
  };

  return (
    <Text style={[styles.itemBadge, getBadgeStyle()]}>{value || "—"}</Text>
  );
}

export function QAChecklistPDF({
  checklist,
  items,
  house,
  client,
  reviewer,
}: QAChecklistPDFProps) {
  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const categories = Object.keys(itemsByCategory);

  // Stats
  const yesCount = items.filter((i) => i.value === "YES").length;
  const noCount = items.filter((i) => i.value === "NO").length;
  const naCount = items.filter((i) => i.value === "NA").length;
  const incompleteCount = items.filter((i) => !i.value).length;

  const getStatusStyle = () => {
    switch (checklist.status) {
      case "COMPLETED":
        return styles.statusCompleted;
      case "NEEDS_ATTENTION":
        return styles.statusNeedsAttention;
      default:
        return styles.statusInProgress;
    }
  };

  const checklistTitle = checklist.checklistType.replace(/_/g, " ");
  let subtitle = formatDate(checklist.reviewDate);
  if (house) subtitle += ` - ${house.name}`;
  if (client) subtitle += ` - ${client.firstName} ${client.lastName}`;

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title={`${checklistTitle} Checklist`} subtitle={subtitle} />

        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Review Date</Text>
            <Text style={styles.headerValue}>{formatDate(checklist.reviewDate)}</Text>
          </View>
          {house && (
            <View style={styles.headerBox}>
              <Text style={styles.headerLabel}>House</Text>
              <Text style={styles.headerValue}>{house.name}</Text>
            </View>
          )}
          {client && (
            <View style={styles.headerBox}>
              <Text style={styles.headerLabel}>Client</Text>
              <Text style={styles.headerValue}>
                {client.firstName} {client.lastName}
              </Text>
            </View>
          )}
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Status</Text>
            <Text style={[styles.statusBadge, getStatusStyle()]}>
              {checklist.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statGreen]}>{yesCount}</Text>
            <Text style={styles.statLabel}>Compliant</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statRed]}>{noCount}</Text>
            <Text style={styles.statLabel}>Non-Compliant</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statGray]}>{naCount}</Text>
            <Text style={styles.statLabel}>N/A</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statBlue]}>{incompleteCount}</Text>
            <Text style={styles.statLabel}>Incomplete</Text>
          </View>
        </View>

        {/* Follow-up Alert */}
        {checklist.followUpRequired && (
          <View style={styles.followUpBox}>
            <Text style={styles.followUpTitle}>Follow-up Required</Text>
            {checklist.followUpDate && (
              <Text style={styles.followUpText}>
                Due by: {formatDate(checklist.followUpDate)}
              </Text>
            )}
            {checklist.followUpNotes && (
              <Text style={styles.followUpText}>{checklist.followUpNotes}</Text>
            )}
          </View>
        )}

        {/* Checklist Items by Category */}
        {categories.map((category) => (
          <View key={category} style={baseStyles.section} wrap={false}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {itemsByCategory[category].map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemContent}>
                  <ItemIcon value={item.value} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.notes && <Text style={styles.itemNotes}>Note: {item.notes}</Text>}
                  </View>
                </View>
                <ItemBadge value={item.value} />
              </View>
            ))}
          </View>
        ))}

        <PDFFooter />
      </Page>

      {/* Page 2 - Notes and Review Info */}
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title={`${checklistTitle} Checklist`}
          subtitle={`${subtitle} (continued)`}
        />

        {/* Overall Notes */}
        {checklist.overallNotes && (
          <Section title="Overall Notes">
            <Text style={styles.overallNotes}>{checklist.overallNotes}</Text>
          </Section>
        )}

        {/* Review Information */}
        <Section title="Review Information">
          <View style={styles.reviewInfoGrid}>
            <View style={styles.reviewInfoItem}>
              <Text style={styles.reviewInfoLabel}>Reviewed By</Text>
              <Text style={styles.reviewInfoValue}>{reviewer?.name || "Unknown"}</Text>
            </View>
            <View style={styles.reviewInfoItem}>
              <Text style={styles.reviewInfoLabel}>Review Date</Text>
              <Text style={styles.reviewInfoValue}>{formatDate(checklist.reviewDate)}</Text>
            </View>
            <View style={styles.reviewInfoItem}>
              <Text style={styles.reviewInfoLabel}>Created</Text>
              <Text style={styles.reviewInfoValue}>
                {format(new Date(checklist.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </Text>
            </View>
            <View style={styles.reviewInfoItem}>
              <Text style={styles.reviewInfoLabel}>Last Updated</Text>
              <Text style={styles.reviewInfoValue}>
                {format(new Date(checklist.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
              </Text>
            </View>
          </View>
        </Section>

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Helper function to generate filename
export function getQAChecklistFilename(checklist: {
  checklistType: string;
  reviewDate: string | Date;
}): string {
  const date = format(new Date(checklist.reviewDate), "yyyy-MM-dd");
  const type = checklist.checklistType.replace(/_/g, "-");
  return `QAChecklist_${type}_${date}.pdf`;
}
