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

interface Expense {
  id: string;
  houseId: string;
  date: string;
  amount: number;
  category: string;
  vendor: string | null;
  description: string | null;
  receiptUrl: string | null;
  purchasedBy: { id: string; name: string };
  participants: string | null;
  month: number;
  year: number;
  isConfirmed: boolean;
  house: { id: string; name: string };
  createdBy: { id: string; name: string };
}

interface ExpensesPDFProps {
  expenses: Expense[];
  month: number;
  year: number;
  houseName?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const EXPENSE_CATEGORIES: Record<string, string> = {
  GROCERIES: "Groceries",
  HOUSEHOLD: "Household",
  ACTIVITIES: "Activities",
  MEDICAL: "Medical",
  TRANSPORTATION: "Transportation",
  OTHER: "Other",
};

const styles = StyleSheet.create({
  summarySection: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryBox: {
    width: "15%",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  summaryBoxTotal: {
    backgroundColor: "#dbeafe",
    borderColor: colors.primary,
  },
  summaryCategory: {
    fontSize: 7,
    color: colors.secondary,
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.text,
  },
  summaryValueTotal: {
    color: colors.primary,
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
  categoryBadge: {
    fontSize: 7,
    backgroundColor: colors.background,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptLink: {
    fontSize: 7,
    color: colors.primary,
  },
  noReceipt: {
    fontSize: 7,
    color: colors.textLight,
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

export function ExpensesPDF({
  expenses,
  month,
  year,
  houseName,
}: ExpensesPDFProps) {
  // Calculate totals by category
  const totalsByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const monthName = MONTHS[month - 1];
  const subtitle = houseName ? `${houseName} - ${monthName} ${year}` : `${monthName} ${year}`;

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page} orientation="landscape">
        <PDFHeader title="House Expenses Report" subtitle={subtitle} />

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Expense Summary by Category</Text>
          <View style={styles.summaryGrid}>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
              <View key={key} style={styles.summaryBox}>
                <Text style={styles.summaryCategory}>{label}</Text>
                <Text style={styles.summaryValue}>
                  ${(totalsByCategory[key] || 0).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={[styles.summaryBox, styles.summaryBoxTotal]}>
              <Text style={styles.summaryCategory}>TOTAL</Text>
              <Text style={[styles.summaryValue, styles.summaryValueTotal]}>
                ${grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expenses Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>House</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Category</Text>
            <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Vendor</Text>
            <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "right" }]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Purchased By</Text>
            <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Participants</Text>
            <Text style={[styles.tableHeaderCell, { width: "8%", borderRightWidth: 0 }]}>Receipt</Text>
          </View>

          {expenses.map((expense) => {
            const participants = expense.participants
              ? JSON.parse(expense.participants)
              : [];
            return (
              <View key={expense.id} style={styles.tableRow} wrap={false}>
                <Text style={[styles.tableCell, { width: "10%" }]}>
                  {format(new Date(expense.date), "MM/dd/yyyy")}
                </Text>
                <Text style={[styles.tableCell, { width: "10%" }]}>{expense.house.name}</Text>
                <View style={[styles.tableCell, { width: "10%" }]}>
                  <Text style={styles.categoryBadge}>
                    {EXPENSE_CATEGORIES[expense.category] || expense.category}
                  </Text>
                </View>
                <Text style={[styles.tableCell, { width: "12%" }]}>
                  {expense.vendor || "—"}
                </Text>
                <Text style={[styles.tableCell, { width: "18%" }]}>
                  {expense.description || "—"}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { width: "10%" }]}>
                  ${Number(expense.amount).toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { width: "10%" }]}>
                  {expense.purchasedBy.name}
                </Text>
                <Text style={[styles.tableCell, { width: "12%" }]}>
                  {participants.length > 0
                    ? participants.slice(0, 2).join(", ") +
                      (participants.length > 2 ? ` +${participants.length - 2}` : "")
                    : "—"}
                </Text>
                <View style={[styles.tableCell, { width: "8%", borderRightWidth: 0 }]}>
                  {expense.receiptUrl ? (
                    <Text style={styles.receiptLink}>Yes</Text>
                  ) : (
                    <Text style={styles.noReceipt}>—</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalLabel, { width: "50%" }]}>
              TOTAL ({expenses.length} expenses)
            </Text>
            <Text style={[styles.totalValue, { width: "10%" }]}>${grandTotal.toFixed(2)}</Text>
            <Text style={[styles.totalLabel, { width: "40%" }]} />
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
export function getExpensesFilename(month: number, year: number): string {
  const monthName = MONTHS[month - 1];
  return `Expenses_${monthName}_${year}.pdf`;
}
