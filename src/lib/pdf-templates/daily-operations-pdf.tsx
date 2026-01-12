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

interface DailyReportData {
  id: string;
  date: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  censusCount: number | null;
  censusNotes: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  staffOnDuty: string | null;
  medicationNotes: string | null;
  mealNotes: string | null;
  activitiesNotes: string | null;
  incidentNotes: string | null;
  maintenanceNotes: string | null;
  generalNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  house: { id: string; name: string };
  createdBy: { id: string; name: string };
  submittedBy: { id: string; name: string } | null;
  reviewedBy: { id: string; name: string } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  location: string | null;
  client: { id: string; firstName: string; lastName: string } | null;
}

interface DailyOperationsPDFProps {
  report: DailyReportData;
  calendarEvents?: CalendarEvent[];
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
  statusDraft: {
    backgroundColor: "#ca8a04", // yellow-600
  },
  statusSubmitted: {
    backgroundColor: colors.primary,
  },
  statusReviewed: {
    backgroundColor: colors.success,
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  notesBox: {
    width: "48%",
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notesContent: {
    fontSize: 9,
    color: colors.text,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 4,
    minHeight: 50,
  },
  notesEmpty: {
    color: colors.textLight,
    fontStyle: "italic",
  },
  incidentLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.error,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#fee2e2",
  },
  incidentContent: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  shiftInfo: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  shiftItem: {
    flex: 1,
  },
  shiftLabel: {
    fontSize: 8,
    color: colors.secondary,
  },
  shiftValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2,
  },
  eventsList: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventTitle: {
    fontSize: 9,
    color: colors.text,
  },
  eventClient: {
    fontSize: 8,
    color: colors.secondary,
    marginLeft: 4,
  },
  eventTime: {
    fontSize: 8,
    color: colors.secondary,
  },
  signoffBox: {
    marginTop: 16,
    padding: 10,
    borderRadius: 4,
  },
  signoffSubmitted: {
    backgroundColor: "#dbeafe",
  },
  signoffReviewed: {
    backgroundColor: "#dcfce7",
  },
  signoffText: {
    fontSize: 9,
    color: colors.text,
  },
  signoffBold: {
    fontWeight: "bold",
  },
});

function formatTime(dateString: string | null): string {
  if (!dateString) return "—";
  return format(new Date(dateString), "h:mm a");
}

function NotesBox({
  label,
  content,
  isIncident = false,
}: {
  label: string;
  content: string | null;
  isIncident?: boolean;
}) {
  const getContentStyle = () => {
    const baseStyle = styles.notesContent;
    if (isIncident && content) {
      return [baseStyle, styles.incidentContent];
    }
    if (!content) {
      return [baseStyle, styles.notesEmpty];
    }
    return baseStyle;
  };

  return (
    <View style={styles.notesBox}>
      <Text style={isIncident ? styles.incidentLabel : styles.notesLabel}>{label}</Text>
      <Text style={getContentStyle()}>
        {content || "No notes recorded"}
      </Text>
    </View>
  );
}

export function DailyOperationsPDF({
  report,
  calendarEvents = [],
}: DailyOperationsPDFProps) {
  const getStatusStyle = () => {
    switch (report.status) {
      case "DRAFT":
        return styles.statusDraft;
      case "SUBMITTED":
        return styles.statusSubmitted;
      case "REVIEWED":
        return styles.statusReviewed;
    }
  };

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        <PDFHeader
          title="Daily Operations Report"
          subtitle={`${report.house.name} - ${format(new Date(report.date), "MMMM d, yyyy")}`}
        />

        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Date</Text>
            <Text style={styles.headerValue}>
              {format(new Date(report.date), "EEEE, MMMM d, yyyy")}
            </Text>
          </View>
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>House</Text>
            <Text style={styles.headerValue}>{report.house.name}</Text>
          </View>
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Created By</Text>
            <Text style={styles.headerValue}>{report.createdBy.name}</Text>
          </View>
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Status</Text>
            <Text style={[styles.statusBadge, getStatusStyle()]}>{report.status}</Text>
          </View>
        </View>

        {/* Shift Information */}
        <Section title="Shift Information">
          <View style={styles.shiftInfo}>
            <View style={styles.shiftItem}>
              <Text style={styles.shiftLabel}>Shift Start</Text>
              <Text style={styles.shiftValue}>{formatTime(report.shiftStart)}</Text>
            </View>
            <View style={styles.shiftItem}>
              <Text style={styles.shiftLabel}>Shift End</Text>
              <Text style={styles.shiftValue}>{formatTime(report.shiftEnd)}</Text>
            </View>
            <View style={[styles.shiftItem, { flex: 2 }]}>
              <Text style={styles.shiftLabel}>Staff On Duty</Text>
              <Text style={styles.shiftValue}>{report.staffOnDuty || "Not recorded"}</Text>
            </View>
          </View>
        </Section>

        {/* Census Section */}
        <Section title="Census">
          <View style={styles.shiftInfo}>
            <View style={styles.shiftItem}>
              <Text style={styles.shiftLabel}>Census Count</Text>
              <Text style={styles.shiftValue}>
                {report.censusCount !== null ? report.censusCount : "Not recorded"}
              </Text>
            </View>
            <View style={[styles.shiftItem, { flex: 3 }]}>
              <Text style={styles.shiftLabel}>Census Notes</Text>
              <Text style={[styles.shiftValue, { fontWeight: "normal" }]}>
                {report.censusNotes || "No notes"}
              </Text>
            </View>
          </View>
        </Section>

        {/* Scheduled Events */}
        {calendarEvents.length > 0 && (
          <Section title="Scheduled Events">
            <View style={styles.eventsList}>
              {calendarEvents.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.client && (
                      <Text style={styles.eventClient}>
                        ({event.client.firstName} {event.client.lastName})
                      </Text>
                    )}
                  </View>
                  <Text style={styles.eventTime}>
                    {format(new Date(event.startDate), "h:mm a")}
                    {event.location && ` - ${event.location}`}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Daily Notes */}
        <Section title="Daily Notes">
          <View style={styles.notesGrid}>
            <NotesBox label="Medication Notes" content={report.medicationNotes} />
            <NotesBox label="Meal Notes" content={report.mealNotes} />
            <NotesBox label="Activities Notes" content={report.activitiesNotes} />
            <NotesBox label="Maintenance / Housekeeping" content={report.maintenanceNotes} />
          </View>
        </Section>

        {/* Incidents - Always show, highlight if content */}
        <Section title="Incidents / Concerns">
          <NotesBox
            label="Incident Notes"
            content={report.incidentNotes}
            isIncident={!!report.incidentNotes}
          />
        </Section>

        {/* General Notes */}
        <Section title="General Notes">
          <Text
            style={report.generalNotes ? styles.notesContent : [styles.notesContent, styles.notesEmpty]}
          >
            {report.generalNotes || "No general notes recorded"}
          </Text>
        </Section>

        {/* Sign-off Information */}
        {report.submittedBy && (
          <View style={[styles.signoffBox, styles.signoffSubmitted]}>
            <Text style={styles.signoffText}>
              Submitted by{" "}
              <Text style={styles.signoffBold}>{report.submittedBy.name}</Text>
              {report.submittedAt &&
                ` on ${format(new Date(report.submittedAt), "MMMM d, yyyy 'at' h:mm a")}`}
            </Text>
          </View>
        )}

        {report.reviewedBy && (
          <View style={[styles.signoffBox, styles.signoffReviewed]}>
            <Text style={styles.signoffText}>
              Reviewed by{" "}
              <Text style={styles.signoffBold}>{report.reviewedBy.name}</Text>
              {report.reviewedAt &&
                ` on ${format(new Date(report.reviewedAt), "MMMM d, yyyy 'at' h:mm a")}`}
            </Text>
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Helper function to generate filename
export function getDailyOperationsFilename(report: {
  house: { name: string };
  date: string;
}): string {
  const date = format(new Date(report.date), "yyyy-MM-dd");
  const houseName = report.house.name.replace(/[^a-zA-Z0-9]/g, "_");
  return `DailyOps_${houseName}_${date}.pdf`;
}
