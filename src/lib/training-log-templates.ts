// Training Log Templates for Employee Training Tracking
// Based on Minnesota 245D.09 Requirements

export interface TrainingItem {
  key: string;
  label: string;
  hours: number;
  deadline: string; // Deadline description
  platform: "STAR" | "COMPANY" | "EXTERNAL";
  optional?: boolean;
}

export interface TrainingSection {
  title: string;
  items: TrainingItem[];
}

export interface ChecklistItemState {
  completed: boolean;
  completedDate?: string;
  score?: string;
  trainerInitials?: string;
  notes?: string;
  hours?: number;
}

export type TrainingChecklistState = Record<string, ChecklistItemState>;

// New Hire Orientation Training (Within First 60 Days)
export const NEW_HIRE_ORIENTATION_TEMPLATE: TrainingSection[] = [
  {
    title: "Star Services Platform Courses",
    items: [
      {
        key: "mandated_reporting",
        label: "Mandated Reporting: Maltreatment of Minors & Vulnerable Adults",
        hours: 2.25,
        deadline: "Within 72 hours of hire",
        platform: "STAR",
      },
      {
        key: "orientation_direct_care",
        label: "Orientation for Direct Care Staff",
        hours: 5.0,
        deadline: "Within 60 days",
        platform: "STAR",
      },
      {
        key: "positive_supports_rule",
        label: "Positive Supports Rule Core",
        hours: 7.5,
        deadline: "Before unsupervised contact",
        platform: "STAR",
      },
      {
        key: "medication_admin",
        label: "Medication Administration",
        hours: 3.25,
        deadline: "Before medication duties",
        platform: "STAR",
      },
      {
        key: "first_aid",
        label: "First Aid Training",
        hours: 4.0,
        deadline: "Within 60 days",
        platform: "EXTERNAL",
      },
      {
        key: "suicide_prevention",
        label: "Suicide Prevention",
        hours: 1.0,
        deadline: "If SMI diagnosis in caseload",
        platform: "STAR",
        optional: true,
      },
      {
        key: "crisis_response",
        label: "Crisis Response, De-escalation",
        hours: 1.0,
        deadline: "If SMI diagnosis in caseload",
        platform: "STAR",
        optional: true,
      },
      {
        key: "crs_training",
        label: "CRS Training",
        hours: 2.25,
        deadline: "If CRS in support plan",
        platform: "STAR",
        optional: true,
      },
    ],
  },
  {
    title: "Company-Specific Training",
    items: [
      {
        key: "job_description",
        label: "Job Description & Job Functions",
        hours: 0.5,
        deadline: "Day 1",
        platform: "COMPANY",
      },
      {
        key: "policies_procedures",
        label: "Company Policies & Procedures Review",
        hours: 1.0,
        deadline: "Within 72 hours",
        platform: "COMPANY",
      },
      {
        key: "drug_alcohol_policy",
        label: "Drug and Alcohol Policy Acknowledgement",
        hours: 0.25,
        deadline: "Day 1",
        platform: "COMPANY",
      },
      {
        key: "eumr_policy",
        label: "EUMR Policy & Prohibited Procedures",
        hours: 0.5,
        deadline: "Before unsupervised contact",
        platform: "COMPANY",
      },
      {
        key: "person_specific_training",
        label: "Person-Specific Training (CSSP, IAPP)",
        hours: 2.0,
        deadline: "Before working with individual",
        platform: "COMPANY",
      },
      {
        key: "cpr_training",
        label: "CPR Training",
        hours: 2.0,
        deadline: "Within 60 days",
        platform: "EXTERNAL",
      },
    ],
  },
];

// Annual Training Refreshers
export const ANNUAL_TRAINING_TEMPLATE: TrainingSection[] = [
  {
    title: "Annual Refresher Courses (Star Services)",
    items: [
      {
        key: "refresher_mandated_reporting",
        label: "Refresher: Mandated Reporting",
        hours: 0.75,
        deadline: "Annual",
        platform: "STAR",
      },
      {
        key: "refresher_positive_supports",
        label: "Refresher: Positive Supports Rule Core for DSPs",
        hours: 4.0,
        deadline: "Annual",
        platform: "STAR",
      },
      {
        key: "refresher_data_privacy",
        label: "Refresher: Data Privacy/HIPAA",
        hours: 0.5,
        deadline: "Annual",
        platform: "STAR",
      },
      {
        key: "refresher_rights",
        label: "Refresher: Rights",
        hours: 0.5,
        deadline: "Annual",
        platform: "STAR",
      },
      {
        key: "fraud_statement",
        label: "Annual Fraud Statement Acknowledgement",
        hours: 0.1,
        deadline: "Annual",
        platform: "COMPANY",
      },
      {
        key: "refresher_bloodborne",
        label: "Refresher: Bloodborne Pathogens/Universal Precautions",
        hours: 0.5,
        deadline: "Annual",
        platform: "STAR",
      },
      {
        key: "refresher_sexual_violence",
        label: "Refresher: Minimizing Sexual Violence",
        hours: 0.5,
        deadline: "Annual",
        platform: "STAR",
      },
    ],
  },
  {
    title: "Annual Certifications",
    items: [
      {
        key: "annual_first_aid",
        label: "First Aid Training (Annual Refresher)",
        hours: 4.0,
        deadline: "Before expiration",
        platform: "EXTERNAL",
      },
      {
        key: "annual_cpr",
        label: "CPR Training",
        hours: 2.0,
        deadline: "Before expiration",
        platform: "EXTERNAL",
      },
    ],
  },
  {
    title: "Person-Centered Updates",
    items: [
      {
        key: "person_specific_updates",
        label: "Person-Specific Training Updates",
        hours: 1.0,
        deadline: "As needed",
        platform: "COMPANY",
      },
      {
        key: "cssp_review",
        label: "CSSP/CSSP Addendum Review",
        hours: 0.5,
        deadline: "Annual",
        platform: "COMPANY",
      },
      {
        key: "iapp_review",
        label: "IAPP Review",
        hours: 0.5,
        deadline: "Annual",
        platform: "COMPANY",
      },
    ],
  },
];

export function getTrainingTemplate(logType: string): TrainingSection[] {
  switch (logType) {
    case "ORIENTATION":
      return NEW_HIRE_ORIENTATION_TEMPLATE;
    case "ANNUAL":
      return ANNUAL_TRAINING_TEMPLATE;
    default:
      return [];
  }
}

export function getTrainingCompletionStats(
  logType: string,
  checklistState: TrainingChecklistState
): {
  completed: number;
  total: number;
  requiredComplete: number;
  requiredTotal: number;
  hoursCompleted: number;
  hoursRequired: number;
} {
  const template = getTrainingTemplate(logType);
  let completed = 0;
  let total = 0;
  let requiredComplete = 0;
  let requiredTotal = 0;
  let hoursCompleted = 0;
  let hoursRequired = 0;

  for (const section of template) {
    for (const item of section.items) {
      total++;
      if (!item.optional) {
        requiredTotal++;
        hoursRequired += item.hours;
      }

      if (checklistState[item.key]?.completed) {
        completed++;
        hoursCompleted += checklistState[item.key]?.hours || item.hours;
        if (!item.optional) {
          requiredComplete++;
        }
      }
    }
  }

  return {
    completed,
    total,
    requiredComplete,
    requiredTotal,
    hoursCompleted,
    hoursRequired,
  };
}

export const LOG_TYPE_LABELS: Record<string, string> = {
  ORIENTATION: "New Hire Orientation",
  ANNUAL: "Annual Training",
};

export const PLATFORM_LABELS: Record<string, string> = {
  STAR: "Star Services",
  COMPANY: "Company Training",
  EXTERNAL: "External Provider",
};

export const PLATFORM_COLORS: Record<string, string> = {
  STAR: "bg-blue-100 text-blue-700",
  COMPANY: "bg-purple-100 text-purple-700",
  EXTERNAL: "bg-green-100 text-green-700",
};
