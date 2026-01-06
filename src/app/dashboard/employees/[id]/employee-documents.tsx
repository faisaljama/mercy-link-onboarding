"use client";

import { useState } from "react";
import { DocumentUpload } from "@/components/document-upload";
import { DocumentList } from "@/components/document-list";

interface ComplianceItem {
  id: string;
  itemName: string;
  itemType: string;
}

interface EmployeeDocumentsProps {
  employeeId: string;
  complianceItems: ComplianceItem[];
  canDelete: boolean;
}

export function EmployeeDocuments({ employeeId, complianceItems, canDelete }: EmployeeDocumentsProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Upload Document</h3>
        <DocumentUpload
          employeeId={employeeId}
          complianceItems={complianceItems}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Uploaded Documents</h3>
        <DocumentList
          employeeId={employeeId}
          refreshTrigger={refreshTrigger}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}
