"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";

interface ClientTraining {
  clientId: string;
  clientName: string;
  houseId: string;
  houseName: string;
  trainings: {
    IAPP?: { acknowledgedAt: Date; trainerName: string };
    SPA?: { acknowledgedAt: Date; trainerName: string };
    SMA?: { acknowledgedAt: Date; trainerName: string };
  };
}

interface ServiceRecipientLogPDFButtonProps {
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  trainings: ClientTraining[];
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 12,
  },
  employeeInfo: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottom: "1 solid #333",
    paddingBottom: 8,
  },
  employeeField: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    minHeight: 24,
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 24,
  },
  cellName: {
    width: "30%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  cellSmall: {
    width: "14%",
    padding: 6,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  cellTrainer: {
    width: "14%",
    padding: 6,
    textAlign: "center",
  },
  headerText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  cellText: {
    fontSize: 9,
  },
  checkmark: {
    fontSize: 9,
    color: "#16a34a",
  },
  dash: {
    fontSize: 9,
    color: "#999",
  },
  legend: {
    marginTop: 16,
    padding: 8,
    backgroundColor: "#f9f9f9",
  },
  legendTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  legendItem: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
  generatedDate: {
    fontSize: 8,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
});

function ServiceRecipientLogPDF({
  employeeName,
  employeePosition,
  trainings,
}: {
  employeeName: string;
  employeePosition: string;
  trainings: ClientTraining[];
}) {
  const formatPosition = (pos: string) => {
    switch (pos) {
      case "DSP":
        return "Direct Support Professional";
      case "LEAD_DSP":
        return "Lead DSP";
      case "DC":
        return "Designated Coordinator";
      case "DM":
        return "Designated Manager";
      default:
        return pos;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return format(new Date(date), "M/d/yy");
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SERVICE RECIPIENT ORIENTATION LOG</Text>
          <Text style={styles.subtitle}>
            Per MN Statute §245D.09, subd. 4a - Place in Employee Personnel File
          </Text>
        </View>

        {/* Employee Info */}
        <View style={styles.employeeInfo}>
          <View style={styles.employeeField}>
            <Text style={styles.label}>Employee Name</Text>
            <Text style={styles.value}>{employeeName}</Text>
          </View>
          <View style={styles.employeeField}>
            <Text style={styles.label}>Position</Text>
            <Text style={styles.value}>{formatPosition(employeePosition)}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.cellName}>
              <Text style={styles.headerText}>Client Name</Text>
            </View>
            <View style={styles.cellSmall}>
              <Text style={styles.headerText}>IAPP</Text>
            </View>
            <View style={styles.cellSmall}>
              <Text style={styles.headerText}>SPA</Text>
            </View>
            <View style={styles.cellSmall}>
              <Text style={styles.headerText}>SMA</Text>
            </View>
            <View style={styles.cellTrainer}>
              <Text style={styles.headerText}>Trainer</Text>
            </View>
          </View>

          {/* Table Rows */}
          {trainings.map((training, index) => (
            <View
              key={training.clientId}
              style={
                index === trainings.length - 1
                  ? styles.tableRowLast
                  : styles.tableRow
              }
            >
              <View style={styles.cellName}>
                <Text style={styles.cellText}>{training.clientName}</Text>
              </View>
              <View style={styles.cellSmall}>
                <Text
                  style={training.trainings.IAPP ? styles.checkmark : styles.dash}
                >
                  {formatDate(training.trainings.IAPP?.acknowledgedAt)}
                </Text>
              </View>
              <View style={styles.cellSmall}>
                <Text
                  style={training.trainings.SPA ? styles.checkmark : styles.dash}
                >
                  {formatDate(training.trainings.SPA?.acknowledgedAt)}
                </Text>
              </View>
              <View style={styles.cellSmall}>
                <Text
                  style={training.trainings.SMA ? styles.checkmark : styles.dash}
                >
                  {formatDate(training.trainings.SMA?.acknowledgedAt)}
                </Text>
              </View>
              <View style={styles.cellTrainer}>
                <Text style={styles.cellText}>
                  {training.trainings.IAPP?.trainerName ||
                    training.trainings.SPA?.trainerName ||
                    training.trainings.SMA?.trainerName ||
                    "—"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Abbreviations:</Text>
          <Text style={styles.legendItem}>
            IAPP = Individual Abuse Prevention Plan
          </Text>
          <Text style={styles.legendItem}>
            SPA = Support Plan Addendum (CSSP Addendum)
          </Text>
          <Text style={styles.legendItem}>
            SMA = Self-Management Assessment / Medication Administration
          </Text>
        </View>

        {/* Generated Date */}
        <Text style={styles.generatedDate}>
          Generated: {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
        </Text>

        {/* Footer */}
        <Text style={styles.footer}>Mercy Link LLC - 245D Compliance Portal</Text>
      </Page>
    </Document>
  );
}

export function ServiceRecipientLogPDFButton({
  employeeId,
  employeeName,
  employeePosition,
  trainings,
}: ServiceRecipientLogPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <ServiceRecipientLogPDF
          employeeName={employeeName}
          employeePosition={employeePosition}
          trainings={trainings}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `service-recipient-log-${employeeName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isGenerating || trainings.length === 0}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}
