"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { downloadPDF } from "@/lib/pdf-service";
import {
  DailyOperationsPDF,
  getDailyOperationsFilename,
} from "@/lib/pdf-templates/daily-operations-pdf";

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

interface DailyOperationsPDFButtonProps {
  report: DailyReportData;
  calendarEvents?: CalendarEvent[];
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DailyOperationsPDFButton({
  report,
  calendarEvents = [],
  variant = "outline",
  size = "sm",
  className = "",
}: DailyOperationsPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const filename = getDailyOperationsFilename(report);
      await downloadPDF(
        <DailyOperationsPDF report={report} calendarEvents={calendarEvents} />,
        filename
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          PDF
        </>
      )}
    </Button>
  );
}
