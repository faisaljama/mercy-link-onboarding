"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";

interface PDFDownloadButtonProps {
  generatePDF?: () => Promise<void>;
  endpoint?: string;
  filename?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PDFDownloadButton({
  generatePDF,
  endpoint,
  filename,
  label = "Download PDF",
  variant = "outline",
  size = "default",
  className = "",
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = async () => {
    setIsGenerating(true);
    try {
      if (generatePDF) {
        // Use the provided generatePDF function
        await generatePDF();
      } else if (endpoint) {
        // Use the API endpoint to download the PDF
        const response = await fetch(endpoint);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate PDF");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Get filename from Content-Disposition header or use provided filename
        const contentDisposition = response.headers.get("Content-Disposition");
        let downloadFilename = filename || "document.pdf";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) {
            downloadFilename = match[1];
          }
        }

        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(error instanceof Error ? error.message : "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
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
          {label}
        </>
      )}
    </Button>
  );
}
