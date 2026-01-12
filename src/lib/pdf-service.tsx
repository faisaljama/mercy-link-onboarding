import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts (using default system fonts for now)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

// Color palette matching Mercy Link branding
export const colors = {
  primary: "#2563eb", // blue-600
  primaryDark: "#1d4ed8", // blue-700
  secondary: "#64748b", // slate-500
  text: "#0f172a", // slate-900
  textMuted: "#475569", // slate-600
  textLight: "#94a3b8", // slate-400
  border: "#e2e8f0", // slate-200
  borderDark: "#cbd5e1", // slate-300
  background: "#f8fafc", // slate-50
  white: "#ffffff",
  success: "#16a34a", // green-600
  warning: "#ca8a04", // yellow-600
  error: "#dc2626", // red-600
};

// Base styles for PDF documents
export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: colors.white,
  },
  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 12,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  companySubtitle: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 2,
  },
  headerRight: {
    textAlign: "right",
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  documentSubtitle: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 2,
  },
  // Footer styles
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.textLight,
  },
  footerRight: {
    textAlign: "right",
  },
  pageNumber: {
    fontSize: 8,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 8,
  },
  // Content styles
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
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
  sectionContent: {
    paddingHorizontal: 8,
  },
  // Field styles
  fieldRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.secondary,
    width: 120,
    marginRight: 8,
  },
  fieldValue: {
    fontSize: 10,
    color: colors.text,
    flex: 1,
  },
  fieldValueBold: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  // Grid layouts
  twoColumn: {
    flexDirection: "row",
    gap: 20,
  },
  column: {
    flex: 1,
  },
  threeColumn: {
    flexDirection: "row",
    gap: 15,
  },
  // Table styles
  table: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.text,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  // Status badges
  badge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: colors.success,
  },
  badgeWarning: {
    backgroundColor: "#fef3c7",
    color: colors.warning,
  },
  badgeError: {
    backgroundColor: "#fee2e2",
    color: colors.error,
  },
  badgeInfo: {
    backgroundColor: "#dbeafe",
    color: colors.primary,
  },
  // Signature area
  signatureArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
    marginBottom: 4,
    height: 30,
  },
  signatureLabel: {
    fontSize: 9,
    color: colors.secondary,
  },
  // Utility styles
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  mb4: {
    marginBottom: 4,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 12,
  },
});

// Reusable PDF Header component
interface PDFHeaderProps {
  title: string;
  subtitle?: string;
}

export function PDFHeader({ title, subtitle }: PDFHeaderProps) {
  return (
    <View style={baseStyles.header}>
      <View style={baseStyles.headerLeft}>
        <View>
          <Text style={baseStyles.companyName}>MERCY LINK MN, LLC</Text>
          <Text style={baseStyles.companySubtitle}>245D Residential Services</Text>
        </View>
      </View>
      <View style={baseStyles.headerRight}>
        <Text style={baseStyles.documentTitle}>{title}</Text>
        {subtitle && <Text style={baseStyles.documentSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// Reusable PDF Footer component
interface PDFFooterProps {
  showConfidential?: boolean;
}

export function PDFFooter({ showConfidential = true }: PDFFooterProps) {
  return (
    <View style={baseStyles.footer} fixed>
      <View>
        <Text style={baseStyles.footerText}>
          Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
        </Text>
        <Text style={baseStyles.footerText}>
          Mercy Link MN, LLC | 245D Licensed Provider
        </Text>
      </View>
      {showConfidential && (
        <View style={baseStyles.footerRight}>
          <Text style={baseStyles.footerText}>CONFIDENTIAL</Text>
          <Text style={baseStyles.footerText}>
            Protected under HIPAA & MN Statutes 245D
          </Text>
        </View>
      )}
      <Text
        style={baseStyles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        fixed
      />
    </View>
  );
}

// Section component
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <View style={baseStyles.section} wrap={false}>
      <Text style={baseStyles.sectionTitle}>{title}</Text>
      <View style={baseStyles.sectionContent}>{children}</View>
    </View>
  );
}

// Field row component
interface FieldProps {
  label: string;
  value: string | null | undefined;
  bold?: boolean;
}

export function Field({ label, value, bold = false }: FieldProps) {
  return (
    <View style={baseStyles.fieldRow}>
      <Text style={baseStyles.fieldLabel}>{label}:</Text>
      <Text style={bold ? baseStyles.fieldValueBold : baseStyles.fieldValue}>
        {value || "—"}
      </Text>
    </View>
  );
}

// Two column layout
interface TwoColumnProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function TwoColumn({ left, right }: TwoColumnProps) {
  return (
    <View style={baseStyles.twoColumn}>
      <View style={baseStyles.column}>{left}</View>
      <View style={baseStyles.column}>{right}</View>
    </View>
  );
}

// Signature area component
interface SignatureAreaProps {
  leftLabel?: string;
  rightLabel?: string;
}

export function SignatureArea({
  leftLabel = "Signature",
  rightLabel = "Date",
}: SignatureAreaProps) {
  return (
    <View style={baseStyles.signatureArea}>
      <View style={baseStyles.signatureBlock}>
        <View style={baseStyles.signatureLine} />
        <Text style={baseStyles.signatureLabel}>{leftLabel}</Text>
      </View>
      <View style={baseStyles.signatureBlock}>
        <View style={baseStyles.signatureLine} />
        <Text style={baseStyles.signatureLabel}>{rightLabel}</Text>
      </View>
    </View>
  );
}

// Base PDF document wrapper
interface BasePDFDocumentProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showConfidential?: boolean;
}

export function BasePDFDocument({
  title,
  subtitle,
  children,
  showConfidential = true,
}: BasePDFDocumentProps) {
  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader title={title} subtitle={subtitle} />
        {children}
        <PDFFooter showConfidential={showConfidential} />
      </Page>
    </Document>
  );
}

// Utility function to generate PDF blob
export async function generatePDFBlob(
  document: React.ReactElement<React.ComponentProps<typeof Document>>
): Promise<Blob> {
  const blob = await pdf(document).toBlob();
  return blob;
}

// Utility function to download PDF
export async function downloadPDF(
  document: React.ReactElement<React.ComponentProps<typeof Document>>,
  filename: string
): Promise<void> {
  const blob = await generatePDFBlob(document);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utility function to open PDF in new tab
export async function openPDFInNewTab(
  document: React.ReactElement<React.ComponentProps<typeof Document>>
): Promise<void> {
  const blob = await generatePDFBlob(document);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
