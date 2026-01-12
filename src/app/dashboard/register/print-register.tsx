"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { downloadPDF } from "@/lib/pdf-service";
import {
  AdmissionRegisterPDF,
  getAdmissionRegisterFilename,
} from "@/lib/pdf-templates/admission-register-pdf";

interface Entry {
  id: string;
  type: string;
  date: Date;
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

export function PrintRegisterButton({
  admissions,
  discharges,
}: {
  admissions: Entry[];
  discharges: Entry[];
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const filename = getAdmissionRegisterFilename();
      await downloadPDF(
        <AdmissionRegisterPDF admissions={admissions} discharges={discharges} />,
        filename
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Download Register PDF
        </>
      )}
    </Button>
  );
}
