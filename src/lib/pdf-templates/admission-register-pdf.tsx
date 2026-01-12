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
  SignatureArea,
} from "../pdf-service";

interface Entry {
  id: string;
  type: string;
  date: Date | string;
  fromLocation: string | null;
  toLocation: string | null;
  reason: string | null;
  dischargeType: string | null;
  notes: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    house: {
      id: string;
      name: string;
    };
  };
}

interface AdmissionRegisterPDFProps {
  admissions: Entry[];
  discharges: Entry[];
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    minWidth: 80,
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
  statBlue: {
    color: colors.primary,
  },
  statRed: {
    color: colors.error,
  },
  statOrange: {
    color: "#ea580c",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
  },
  badge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: "bold",
  },
  badgeGreen: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeRed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  badgeAmber: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  sectionDescription: {
    fontSize: 9,
    color: colors.secondary,
    marginBottom: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.secondary,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableCell: {
    fontSize: 8,
    color: colors.text,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableCellSmall: {
    fontSize: 7,
    color: colors.secondary,
    marginTop: 2,
  },
  emptyRow: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 9,
    color: colors.textLight,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
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
  },
});

function getTypeLabel(type: string): string {
  switch (type) {
    case "ADMISSION":
      return "Admission";
    case "DISCHARGE":
      return "Discharge";
    case "TRANSFER_IN":
      return "Transfer In";
    case "TRANSFER_OUT":
      return "Transfer Out";
    default:
      return type;
  }
}

function getDischargeTypeLabel(type: string | null): string {
  if (!type) return "";
  switch (type) {
    case "PLANNED":
      return "Planned";
    case "UNPLANNED":
      return "Unplanned";
    case "EMERGENCY":
      return "Emergency";
    case "DEATH":
      return "Death";
    default:
      return type;
  }
}

function RegisterTable({ entries, title, badgeColorStyle, description }: {
  entries: Entry[];
  title: string;
  badgeColorStyle: "green" | "red" | "amber";
  description: string;
}) {
  const getBadgeStyle = () => {
    switch (badgeColorStyle) {
      case "green":
        return styles.badgeGreen;
      case "red":
        return styles.badgeRed;
      case "amber":
        return styles.badgeAmber;
    }
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={[styles.badge, getBadgeStyle()]}>{entries.length} entries</Text>
      </View>
      <Text style={styles.sectionDescription}>{description}</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Client</Text>
          <Text style={[styles.tableHeaderCell, { width: "14%" }]}>House</Text>
          <Text style={[styles.tableHeaderCell, { width: "22%" }]}>Details</Text>
          <Text style={[styles.tableHeaderCell, { width: "22%", borderRightWidth: 0 }]}>Notes</Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No entries</Text>
          </View>
        ) : (
          entries.map((entry, index) => (
            <View key={entry.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCell, { width: "12%" }]}>
                {format(new Date(entry.date), "MMM d, yyyy")}
              </Text>
              <View style={[styles.tableCell, { width: "12%" }]}>
                <Text>{getTypeLabel(entry.type)}</Text>
                {entry.dischargeType && (
                  <Text style={styles.tableCellSmall}>
                    ({getDischargeTypeLabel(entry.dischargeType)})
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, { width: "18%" }]}>
                {entry.client.firstName} {entry.client.lastName}
              </Text>
              <Text style={[styles.tableCell, { width: "14%" }]}>
                {entry.client.house.name}
              </Text>
              <View style={[styles.tableCell, { width: "22%" }]}>
                {entry.type === "ADMISSION" && entry.fromLocation && (
                  <Text>From: {entry.fromLocation}</Text>
                )}
                {entry.type === "DISCHARGE" && entry.toLocation && (
                  <Text>To: {entry.toLocation}</Text>
                )}
                {entry.type === "TRANSFER_IN" && entry.fromLocation && (
                  <Text>From: {entry.fromLocation}</Text>
                )}
                {entry.type === "TRANSFER_OUT" && entry.toLocation && (
                  <Text>To: {entry.toLocation}</Text>
                )}
                {entry.reason && (
                  <Text style={styles.tableCellSmall}>Reason: {entry.reason}</Text>
                )}
              </View>
              <Text style={[styles.tableCell, { width: "22%", borderRightWidth: 0 }]}>
                {entry.notes || "—"}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

export function AdmissionRegisterPDF({
  admissions,
  discharges,
}: AdmissionRegisterPDFProps) {
  const admissionCount = admissions.filter((e) => e.type === "ADMISSION").length;
  const transferInCount = admissions.filter((e) => e.type === "TRANSFER_IN").length;
  const dischargeCount = discharges.filter((e) => e.type === "DISCHARGE").length;
  const transferOutCount = discharges.filter((e) => e.type === "TRANSFER_OUT").length;

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page} orientation="landscape">
        <PDFHeader
          title="Admission/Discharge Register"
          subtitle="Minnesota Statutes Chapter 245D Compliance Record"
        />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statGreen]}>{admissionCount}</Text>
            <Text style={styles.statLabel}>Total Admissions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statBlue]}>{transferInCount}</Text>
            <Text style={styles.statLabel}>Transfers In</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statRed]}>{dischargeCount}</Text>
            <Text style={styles.statLabel}>Discharges (6 mo.)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statOrange]}>{transferOutCount}</Text>
            <Text style={styles.statLabel}>Transfers Out (6 mo.)</Text>
          </View>
        </View>

        {/* Admission Register Table */}
        <RegisterTable
          entries={admissions}
          title="Admission Register"
          badgeColorStyle="green"
          description="All client admissions and transfers in, sorted chronologically (earliest to latest)"
        />

        <PDFFooter showConfidential={false} />
      </Page>

      {/* Page 2 - Discharge Register */}
      <Page size="LETTER" style={baseStyles.page} orientation="landscape">
        <PDFHeader
          title="Admission/Discharge Register"
          subtitle="Minnesota Statutes Chapter 245D Compliance Record (continued)"
        />

        {/* Discharge Register Table */}
        <View style={{ marginBottom: 24 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discharge Register</Text>
            <Text style={[styles.badge, styles.badgeRed]}>{discharges.length} entries</Text>
            <Text style={[styles.badge, styles.badgeAmber]}>6-Month Retention</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Client discharges and transfers out from the last 6 months (per 245D requirements)
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Client</Text>
              <Text style={[styles.tableHeaderCell, { width: "14%" }]}>House</Text>
              <Text style={[styles.tableHeaderCell, { width: "22%" }]}>Details</Text>
              <Text style={[styles.tableHeaderCell, { width: "22%", borderRightWidth: 0 }]}>Notes</Text>
            </View>

            {discharges.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No entries</Text>
              </View>
            ) : (
              discharges.map((entry) => (
                <View key={entry.id} style={styles.tableRow} wrap={false}>
                  <Text style={[styles.tableCell, { width: "12%" }]}>
                    {format(new Date(entry.date), "MMM d, yyyy")}
                  </Text>
                  <View style={[styles.tableCell, { width: "12%" }]}>
                    <Text>{getTypeLabel(entry.type)}</Text>
                    {entry.dischargeType && (
                      <Text style={styles.tableCellSmall}>
                        ({getDischargeTypeLabel(entry.dischargeType)})
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, { width: "18%" }]}>
                    {entry.client.firstName} {entry.client.lastName}
                  </Text>
                  <Text style={[styles.tableCell, { width: "14%" }]}>
                    {entry.client.house.name}
                  </Text>
                  <View style={[styles.tableCell, { width: "22%" }]}>
                    {entry.toLocation && <Text>To: {entry.toLocation}</Text>}
                    {entry.reason && (
                      <Text style={styles.tableCellSmall}>Reason: {entry.reason}</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, { width: "22%", borderRightWidth: 0 }]}>
                    {entry.notes || "—"}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Prepared By / Date</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Reviewed By / Date</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Designated Coordinator / Date</Text>
          </View>
        </View>

        <PDFFooter showConfidential={false} />
      </Page>
    </Document>
  );
}

// Helper function to generate filename
export function getAdmissionRegisterFilename(): string {
  const date = format(new Date(), "yyyy-MM-dd");
  return `AdmissionDischargeRegister_${date}.pdf`;
}
