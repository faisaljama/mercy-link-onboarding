"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { downloadPDF } from "@/lib/pdf-service";
import { FaceSheetPDF, getFaceSheetFilename } from "@/lib/pdf-templates/face-sheet-pdf";

// Helper type for Prisma Decimal compatibility
type DecimalLike = { toString(): string } | number | string | null | undefined;

interface ClientData {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob: Date | string;
  ssn?: string | null;
  gender?: string | null;
  ethnicity?: string | null;
  preferredLanguage?: string | null;
  maritalStatus?: string | null;
  status: string;
  admissionDate: Date | string;
  waiverType?: string | null;
  photoUrl?: string | null;
  pmiNumber?: string | null;
  insuranceName?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceGroupNumber?: string | null;
  insurancePhone?: string | null;
  emergencyContact1Name?: string | null;
  emergencyContact1Relationship?: string | null;
  emergencyContact1Phone?: string | null;
  emergencyContact2Name?: string | null;
  emergencyContact2Relationship?: string | null;
  emergencyContact2Phone?: string | null;
  mhCaseManagerName?: string | null;
  mhCaseManagerOrg?: string | null;
  mhCaseManagerEmail?: string | null;
  mhCaseManagerPhone?: string | null;
  cadiCaseManagerName?: string | null;
  cadiCaseManagerOrg?: string | null;
  cadiCaseManagerEmail?: string | null;
  cadiCaseManagerPhone?: string | null;
  legalRepName?: string | null;
  legalRepPhone?: string | null;
  hasGuardian: boolean;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  guardianPhone?: string | null;
  guardianAddress?: string | null;
  hasRepPayee: boolean;
  repPayeeName?: string | null;
  repPayeePhone?: string | null;
  repPayeeAddress?: string | null;
  rentAmount?: DecimalLike;
  checkDeliveryLocation?: string | null;
  dailyRate?: DecimalLike;
  staffingRatio?: string | null;
  individualHours?: DecimalLike;
  sharedStaffingHours?: DecimalLike;
  myChartUsername?: string | null;
  myChartPassword?: string | null;
  myChartUrl?: string | null;
  pharmacyName?: string | null;
  pharmacyOrg?: string | null;
  pharmacyPhone?: string | null;
  pharmacyAddress?: string | null;
  primaryCareName?: string | null;
  primaryCareOrg?: string | null;
  primaryCarePhone?: string | null;
  primaryCareAddress?: string | null;
  psychiatristName?: string | null;
  psychiatristOrg?: string | null;
  psychiatristPhone?: string | null;
  psychiatristAddress?: string | null;
  dentalName?: string | null;
  dentalOrg?: string | null;
  dentalPhone?: string | null;
  dentalAddress?: string | null;
  visionName?: string | null;
  visionOrg?: string | null;
  visionPhone?: string | null;
  visionAddress?: string | null;
  allergies?: string | null;
  dietaryRestrictions?: string | null;
  diagnoses?: string | null;
  medications?: string | null;
  house: {
    name: string;
    address?: string | null;
    county?: string | null;
    licenseNumber?: string | null;
  };
  additionalProviders?: {
    id: string;
    providerType: string;
    providerName: string;
    organization?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  }[];
}

interface FaceSheetPDFButtonProps {
  client: ClientData;
  isInternal?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FaceSheetPDFButton({
  client,
  isInternal = false,
  variant = "outline",
  size = "default",
  className = "",
}: FaceSheetPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const filename = getFaceSheetFilename(client);
      await downloadPDF(
        <FaceSheetPDF client={client} isInternal={isInternal} />,
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
