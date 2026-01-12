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

interface RentPayment {
  id: string;
  clientId: string;
  houseId: string;
  month: number;
  year: number;
  amountDue: number;
  amountPaid: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  checkNumber: string | null;
  notes: string | null;
  enteredBy: { id: string; name: string };
  signedOffBy: { id: string; name: string } | null;
  signedOffAt: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    rentAmount: number | null;
    checkDeliveryLocation: string | null;
  };
  house: { id: string; name: string };
}

interface RentCollectionPDFProps {
  payments: RentPayment[];
  month: number;
  year: number;
  houseName?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
    minWidth: 100,
  },
  statValue: {
    fontSize: 16,
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
    padding: 6,
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
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableCellRight: {
    textAlign: "right",
  },
  signedOff: {
    color: colors.success,
    fontSize: 7,
  },
  pending: {
    color: "#ca8a04",
    fontSize: 7,
  },
  totalsRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.text,
    padding: 8,
  },
  totalValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.text,
    padding: 8,
    textAlign: "right",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
  },
  signatureBlock: {
    width: "45%",
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

function getPaymentMethodLabel(method: string | null): string {
  if (!method) return "—";
  switch (method) {
    case "CHECK": return "Check";
    case "CASH": return "Cash";
    case "ELECTRONIC": return "Electronic";
    case "OTHER": return "Other";
    default: return method;
  }
}

export function RentCollectionPDF({
  payments,
  month,
  year,
  houseName,
}: RentCollectionPDFProps) {
  // Calculate totals
  const totals = payments.reduce(
    (acc, p) => ({
      due: acc.due + Number(p.amountDue),
      paid: acc.paid + Number(p.amountPaid),
      signedOff: acc.signedOff + (p.signedOffBy ? 1 : 0),
    }),
    { due: 0, paid: 0, signedOff: 0 }
  );

  const outstanding = totals.due - totals.paid;
  const monthName = MONTHS[month - 1];
  const subtitle = houseName ? `${houseName} - ${monthName} ${year}` : `${monthName} ${year}`;

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page} orientation="landscape">
        <PDFHeader title="Rent Collection Report" subtitle={subtitle} />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>${totals.due.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Due</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statGreen]}>${totals.paid.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Collected</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, outstanding > 0 ? styles.statRed : styles.statGreen]}>
              ${outstanding.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totals.signedOff} / {payments.length}</Text>
            <Text style={styles.statLabel}>Signed Off</Text>
          </View>
        </View>

        {/* Payments Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Client</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>House</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Check Delivery</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "right" }]}>Due</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "right" }]}>Paid</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Payment Date</Text>
            <Text style={[styles.tableHeaderCell, { width: "8%" }]}>Method</Text>
            <Text style={[styles.tableHeaderCell, { width: "8%" }]}>Check #</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Entered By</Text>
            <Text style={[styles.tableHeaderCell, { width: "9%", borderRightWidth: 0 }]}>Status</Text>
          </View>

          {payments.map((payment) => (
            <View key={payment.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {payment.client.lastName}, {payment.client.firstName}
              </Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>{payment.house.name}</Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>
                {payment.client.checkDeliveryLocation || "Not Set"}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { width: "10%" }]}>
                ${Number(payment.amountDue).toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { width: "10%" }]}>
                ${Number(payment.amountPaid).toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>
                {payment.paymentDate ? format(new Date(payment.paymentDate), "MM/dd/yyyy") : "—"}
              </Text>
              <Text style={[styles.tableCell, { width: "8%" }]}>
                {getPaymentMethodLabel(payment.paymentMethod)}
              </Text>
              <Text style={[styles.tableCell, { width: "8%" }]}>
                {payment.checkNumber || "—"}
              </Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>{payment.enteredBy.name}</Text>
              <View style={[styles.tableCell, { width: "9%", borderRightWidth: 0 }]}>
                {payment.signedOffBy ? (
                  <Text style={styles.signedOff}>{payment.signedOffBy.name}</Text>
                ) : (
                  <Text style={styles.pending}>Pending</Text>
                )}
              </View>
            </View>
          ))}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalLabel, { width: "35%" }]}>TOTALS</Text>
            <Text style={[styles.totalValue, { width: "10%" }]}>${totals.due.toFixed(2)}</Text>
            <Text style={[styles.totalValue, { width: "10%" }]}>${totals.paid.toFixed(2)}</Text>
            <Text style={[styles.totalLabel, { width: "45%", textAlign: "right" }]}>
              Outstanding: ${outstanding.toFixed(2)}
            </Text>
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
            <Text style={styles.signatureLabel}>Designated Coordinator / Date</Text>
          </View>
        </View>

        <PDFFooter showConfidential={false} />
      </Page>
    </Document>
  );
}

// Helper function to generate filename
export function getRentCollectionFilename(month: number, year: number): string {
  const monthName = MONTHS[month - 1];
  return `RentCollection_${monthName}_${year}.pdf`;
}
