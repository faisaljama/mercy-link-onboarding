// 245D Compliance Document Checklist Templates
// Based on STAR Services 245D Paperwork Requirements

export interface ChecklistItem {
  key: string;
  label: string;
  sublabel?: string;
  signers: string[];
  optional?: boolean;
}

export interface ChecklistItemState {
  completed: boolean;
  completedDate?: string;
  notes?: string;
}

export type ChecklistState = Record<string, ChecklistItemState>;

// Signer display labels
export const SIGNER_LABELS: Record<string, string> = {
  person: "Person",
  legal_rep: "Legal Representative",
  case_manager: "Case Manager",
  provider: "Provider",
};

// Format signers array to display string
export function formatSigners(signers: string[] | undefined): string {
  if (!signers || signers.length === 0) return "";
  const labels = signers.map((s) => SIGNER_LABELS[s] || s);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and/or ${labels[1]}`;
  return labels.slice(0, -1).join(", ") + ", and " + labels[labels.length - 1];
}

// Meeting type display labels
export const MEETING_TYPE_LABELS: Record<string, string> = {
  ADMISSION: "Admission Meeting",
  INITIAL_45_60_DAY: "Initial Planning (45/60 Day)",
  SEMI_ANNUAL: "Semi-Annual Review",
  ANNUAL: "Annual Meeting",
};

// ========================================
// ADMISSION MEETING DOCUMENTS
// ========================================
export const ADMISSION_CHECKLIST: ChecklistItem[] = [
  {
    key: "service_recipient_rights",
    label: "Service Recipient Rights",
    sublabel: "Give a copy to person and/or legal representative, explain the rights",
    signers: ["person", "legal_rep"],
  },
  {
    key: "policy_orientation",
    label: "Policy Orientation",
    sublabel: "Grievance, Data Privacy, EUMR, Suspension, Termination, VAA, MOMA, PAPP (for physical sites: CRS, FRS, DSF, ICS)",
    signers: ["person", "legal_rep", "case_manager"],
  },
  {
    key: "funds_property_auth",
    label: "Funds & Property Authorization",
    sublabel: "Includes frequency of itemized financial statements",
    signers: ["person", "legal_rep", "case_manager"],
  },
  {
    key: "medical_emergency_auth",
    label: "Authorization to Act in Medical Emergency",
    signers: ["person", "legal_rep"],
  },
  {
    key: "medication_admin_auth",
    label: "Medication Administration Authorization",
    signers: ["person", "legal_rep"],
  },
  {
    key: "injectable_med_agreement",
    label: "Injectable Medication Agreement (if applicable)",
    sublabel: "Ex: Epi-Pen - signed by person/legal rep, prescriber and provider if no RN supervising",
    signers: ["person", "legal_rep"],
    optional: true,
  },
  {
    key: "residency_agreement",
    label: "Residency Agreement (CRS/FRS only)",
    signers: ["person", "legal_rep", "provider"],
    optional: true,
  },
  {
    key: "release_of_info",
    label: "Release(s) of Information",
    signers: ["person", "legal_rep"],
  },
  {
    key: "admission_form",
    label: "Admission Form/Data Sheet",
    signers: ["person", "legal_rep"],
  },
  {
    key: "iapp",
    label: "Individual Abuse Prevention Plan (IAPP)",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
  {
    key: "support_plan_preliminary",
    label: "Support Plan Preliminary Addendum",
    sublabel: "To be completed at minimum within 15 days after the meeting",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
];

// ========================================
// INITIAL PLANNING MEETING (45/60 DAY)
// ========================================
export const INITIAL_PLANNING_CHECKLIST: ChecklistItem[] = [
  {
    key: "iapp",
    label: "Individual Abuse Prevention Plan (IAPP)",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
  {
    key: "support_plan_addendum",
    label: "Support Plan Addendum",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
  {
    key: "self_management_assessment",
    label: "Self-Management Assessment",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
  {
    key: "outcome",
    label: "Outcome",
    signers: [],
  },
];

// ========================================
// SEMI-ANNUAL REVIEW
// ========================================
export const SEMI_ANNUAL_CHECKLIST: ChecklistItem[] = [
  {
    key: "progress_report",
    label: "Progress Report (as requested by support team)",
    signers: [],
    optional: true,
  },
  {
    key: "support_plan_addendum",
    label: "Support Plan Addendum (if updates needed)",
    sublabel: "Signatures obtained if changes occurred",
    signers: ["person", "legal_rep", "case_manager", "provider"],
    optional: true,
  },
  {
    key: "iapp",
    label: "IAPP (if updates needed)",
    sublabel: "Signatures obtained if changes occurred",
    signers: ["person", "legal_rep", "case_manager", "provider"],
    optional: true,
  },
  {
    key: "self_management_assessment",
    label: "Self-Management Assessment (if updates needed)",
    sublabel: "Signatures obtained if changes occurred",
    signers: ["person", "legal_rep", "case_manager", "provider"],
    optional: true,
  },
  {
    key: "positive_support_review",
    label: "Six-month Review for Positive Support Strategies and Person-Centered Practices",
    signers: [],
  },
  {
    key: "rights_restrictions_review",
    label: "Six-month Review for Rights Restrictions (if applicable)",
    signers: [],
    optional: true,
  },
];

// ========================================
// ANNUAL MEETING
// ========================================
export const ANNUAL_CHECKLIST: ChecklistItem[] = [
  {
    key: "service_recipient_rights",
    label: "Service Recipient Rights",
    sublabel: "Give a copy to person and/or legal representative, explain the rights",
    signers: ["person", "legal_rep"],
  },
  {
    key: "residency_agreement",
    label: "Residency Agreement (CRS/FRS only)",
    signers: ["person", "legal_rep", "provider"],
    optional: true,
  },
  {
    key: "release_of_info",
    label: "Release(s) of Information",
    signers: ["person", "legal_rep"],
  },
  {
    key: "funds_property_auth",
    label: "Funds & Property Authorization",
    sublabel: "Includes frequency of itemized financial statements",
    signers: ["person", "legal_rep", "case_manager"],
  },
  {
    key: "iapp",
    label: "Individual Abuse Prevention Plan (IAPP)",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
  {
    key: "support_plan_addendum",
    label: "Support Plan Addendum",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
  {
    key: "self_management_assessment",
    label: "Self-Management Assessment",
    signers: ["person", "legal_rep", "case_manager", "provider"],
  },
  {
    key: "outcome",
    label: "Outcome",
    signers: [],
  },
  {
    key: "progress_report",
    label: "Progress Report",
    signers: [],
  },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get checklist template by meeting type
export function getChecklistTemplate(meetingType: string): ChecklistItem[] {
  switch (meetingType) {
    case "ADMISSION":
      return ADMISSION_CHECKLIST;
    case "INITIAL_45_60_DAY":
      return INITIAL_PLANNING_CHECKLIST;
    case "SEMI_ANNUAL":
      return SEMI_ANNUAL_CHECKLIST;
    case "ANNUAL":
      return ANNUAL_CHECKLIST;
    default:
      return [];
  }
}

// Initialize empty checklist state for a meeting type
export function initializeChecklistState(meetingType: string): ChecklistState {
  const template = getChecklistTemplate(meetingType);
  const state: ChecklistState = {};
  template.forEach((item) => {
    state[item.key] = { completed: false };
  });
  return state;
}

// Calculate completion stats for a checklist
export function getCompletionStats(
  meetingType: string,
  checklistState: ChecklistState | null | undefined
): { completed: number; total: number; requiredComplete: number; requiredTotal: number } {
  const template = getChecklistTemplate(meetingType);
  const safeState = checklistState || {};

  let completed = 0;
  let total = 0;
  let requiredComplete = 0;
  let requiredTotal = 0;

  template.forEach((item) => {
    total++;
    if (!item.optional) requiredTotal++;

    if (safeState[item.key]?.completed) {
      completed++;
      if (!item.optional) requiredComplete++;
    }
  });

  return { completed, total, requiredComplete, requiredTotal };
}

// ========================================
// MEETING DUE DATE CALCULATIONS
// ========================================

export interface MeetingSchedule {
  type: string;
  label: string;
  dueDate: Date;
  year: number;
  daysUntilDue: number;
  isOverdue: boolean;
}

// Calculate expected meeting due dates based on admission date
export function calculateMeetingDueDates(
  admissionDate: Date,
  existingMeetings: Array<{ meetingType: string; year: number }> | null | undefined
): MeetingSchedule[] {
  const today = new Date();
  const schedules: MeetingSchedule[] = [];
  const safeMeetings = existingMeetings || [];

  // Helper to add days/months
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const diffDays = (date1: Date, date2: Date): number => {
    return Math.ceil((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Check if meeting already exists
  const meetingExists = (type: string, year: number): boolean => {
    return safeMeetings.some((m) => m.meetingType === type && m.year === year);
  };

  // Initial 45/60 Day Meeting - due 45 days after admission
  if (!meetingExists("INITIAL_45_60_DAY", 1)) {
    const dueDate = addDays(admissionDate, 45);
    schedules.push({
      type: "INITIAL_45_60_DAY",
      label: MEETING_TYPE_LABELS["INITIAL_45_60_DAY"],
      dueDate,
      year: 1,
      daysUntilDue: diffDays(dueDate, today),
      isOverdue: dueDate < today,
    });
  }

  // Semi-Annual Meetings - every 6 months (for years 1-5)
  for (let i = 1; i <= 5; i++) {
    const dueDate = addMonths(admissionDate, 6 * i);
    // Only show if within reasonable future (next 2 years) or overdue
    if (diffDays(dueDate, today) <= 730 || dueDate < today) {
      if (!meetingExists("SEMI_ANNUAL", i)) {
        schedules.push({
          type: "SEMI_ANNUAL",
          label: MEETING_TYPE_LABELS["SEMI_ANNUAL"],
          dueDate,
          year: i,
          daysUntilDue: diffDays(dueDate, today),
          isOverdue: dueDate < today,
        });
      }
    }
  }

  // Annual Meetings - every 12 months (for years 1-5)
  for (let i = 1; i <= 5; i++) {
    const dueDate = addMonths(admissionDate, 12 * i);
    // Only show if within reasonable future (next 2 years) or overdue
    if (diffDays(dueDate, today) <= 730 || dueDate < today) {
      if (!meetingExists("ANNUAL", i)) {
        schedules.push({
          type: "ANNUAL",
          label: MEETING_TYPE_LABELS["ANNUAL"],
          dueDate,
          year: i,
          daysUntilDue: diffDays(dueDate, today),
          isOverdue: dueDate < today,
        });
      }
    }
  }

  // Sort by due date (overdue first, then soonest)
  schedules.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return schedules;
}
