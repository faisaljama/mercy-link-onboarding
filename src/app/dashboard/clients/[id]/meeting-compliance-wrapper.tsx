"use client";

import dynamic from "next/dynamic";

// Dynamically import MeetingCompliance with SSR disabled to avoid hydration issues
const MeetingComplianceComponent = dynamic(
  () => import("./meeting-compliance").then((mod) => mod.MeetingCompliance),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
        <span className="ml-2 text-slate-500">Loading compliance documents...</span>
      </div>
    )
  }
);

interface MeetingComplianceWrapperProps {
  clientId: string;
  clientName: string;
  houseName: string;
  admissionDate: string;
}

export function MeetingComplianceWrapper({
  clientId,
  clientName,
  houseName,
  admissionDate,
}: MeetingComplianceWrapperProps) {
  return (
    <MeetingComplianceComponent
      clientId={clientId}
      clientName={clientName}
      houseName={houseName}
      admissionDate={admissionDate}
      meetings={[]}
    />
  );
}
