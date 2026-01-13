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
  PDFFooter,
} from "../pdf-service";

interface ShiftNoteData {
  id: string;
  noteType: string;
  shiftDate: string;
  shiftType: string;
  content: string;
  submittedBy: {
    firstName: string;
    lastName: string;
  };
}

interface ResidentData {
  id: string;
  firstName: string;
  lastName: string;
  onePageProfile?: {
    preferredName: string | null;
  } | null;
}

interface HouseData {
  id: string;
  name: string;
}

interface ShiftNotesPDFProps {
  notes: ShiftNoteData[];
  resident: ResidentData;
  house: HouseData;
  dateRange?: {
    start: string;
    end: string;
  };
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 10,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    textAlign: "right",
  },
  houseName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
  },
  houseSubtitle: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
  },
  reportSubtitle: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 2,
  },
  residentInfo: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  residentName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
  },
  dateRange: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 4,
  },
  noteContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteType: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.primary,
  },
  noteContent: {
    fontSize: 10,
    color: colors.text,
    padding: 12,
    lineHeight: 1.5,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteDate: {
    fontSize: 9,
    color: colors.secondary,
  },
  noteStaff: {
    fontSize: 9,
    color: colors.text,
  },
  staffTitle: {
    color: colors.secondary,
  },
  noNotes: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    padding: 40,
    fontStyle: "italic",
  },
});

const NOTE_TYPE_LABELS: Record<string, string> = {
  progress_note: "Progress Note",
  incident_report: "Incident Report",
  medication_note: "Medication Note",
  activity_note: "Activity Note",
  communication_log: "Communication Log",
};

const SHIFT_TYPE_LABELS: Record<string, string> = {
  day: "Day Shift",
  evening: "Evening Shift",
  overnight: "Overnight Shift",
};

export function ShiftNotesPDF({
  notes,
  resident,
  house,
  dateRange,
}: ShiftNotesPDFProps) {
  const displayName = resident.onePageProfile?.preferredName || resident.firstName;
  const fullName = `${resident.lastName}, ${displayName}`;

  // Format date range for display
  const dateRangeText = dateRange
    ? `${format(new Date(dateRange.start), "MMM d, yyyy")} - ${format(new Date(dateRange.end), "MMM d, yyyy")}`
    : notes.length > 0
    ? format(new Date(notes[0].shiftDate), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  return (
    <Document>
      <Page size="LETTER" style={baseStyles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.houseName}>{house.name} - 245D</Text>
            <Text style={styles.houseSubtitle}>Mercy Link MN, LLC</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Resident Notes</Text>
            <Text style={styles.reportSubtitle}>Progress Notes</Text>
          </View>
        </View>

        {/* Resident Info */}
        <View style={styles.residentInfo}>
          <Text style={styles.residentName}>{fullName}</Text>
          <Text style={styles.dateRange}>{dateRangeText}</Text>
        </View>

        {/* Notes */}
        {notes.length > 0 ? (
          notes.map((note) => (
            <View key={note.id} style={styles.noteContainer} wrap={false}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteType}>
                  {NOTE_TYPE_LABELS[note.noteType] || note.noteType}
                </Text>
                <Text style={styles.noteDate}>
                  {SHIFT_TYPE_LABELS[note.shiftType] || note.shiftType}
                </Text>
              </View>
              <Text style={styles.noteContent}>{note.content}</Text>
              <View style={styles.noteFooter}>
                {/* Only show shiftDate - NOT submittedAt per user's requirement */}
                <Text style={styles.noteDate}>
                  {format(new Date(note.shiftDate), "MM/dd/yy")}
                </Text>
                <Text style={styles.noteStaff}>
                  {note.submittedBy.firstName} {note.submittedBy.lastName}{" "}
                  <Text style={styles.staffTitle}>- DSP</Text>
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noNotes}>No notes found for this period</Text>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Helper function to generate filename
export function getShiftNotesFilename(
  resident: { firstName: string; lastName: string },
  dateRange?: { start: string; end: string }
): string {
  const name = `${resident.lastName}_${resident.firstName}`.replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = dateRange
    ? `${format(new Date(dateRange.start), "yyyy-MM-dd")}_to_${format(new Date(dateRange.end), "yyyy-MM-dd")}`
    : format(new Date(), "yyyy-MM-dd");
  return `ProgressNotes_${name}_${dateStr}.pdf`;
}
