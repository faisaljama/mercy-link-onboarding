"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { downloadPDF } from "@/lib/pdf-service";
import {
  QAChecklistPDF,
  getQAChecklistFilename,
} from "@/lib/pdf-templates/qa-checklist-pdf";

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

interface QAChecklistPDFButtonProps {
  checklist: QAChecklistData;
  items: ChecklistItem[];
  house: { name: string } | null;
  client: { firstName: string; lastName: string } | null;
  reviewer: { name: string } | null;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function QAChecklistPDFButton({
  checklist,
  items,
  house,
  client,
  reviewer,
  variant = "outline",
  size = "default",
  className = "",
}: QAChecklistPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const filename = getQAChecklistFilename(checklist);
      await downloadPDF(
        <QAChecklistPDF
          checklist={checklist}
          items={items}
          house={house}
          client={client}
          reviewer={reviewer}
        />,
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
          Download PDF
        </>
      )}
    </Button>
  );
}
