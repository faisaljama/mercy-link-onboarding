// HR Application & Onboarding Constants

export const APPLICATION_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  ONBOARDING: "ONBOARDING",
  COMPLETED: "COMPLETED",
  HIRED: "HIRED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

export const FORM_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type FormStatus = typeof FORM_STATUS[keyof typeof FORM_STATUS];

// Form Types
export const FORM_TYPE = {
  // Pre-hire forms (2)
  EMPLOYMENT_APPLICATION: "EMPLOYMENT_APPLICATION",
  BACKGROUND_STUDY: "BACKGROUND_STUDY",

  // Onboarding forms - Information (4)
  DIRECT_DEPOSIT: "DIRECT_DEPOSIT",
  EMERGENCY_CONTACT: "EMERGENCY_CONTACT",
  AUTO_INSURANCE: "AUTO_INSURANCE",
  JOB_DESCRIPTION: "JOB_DESCRIPTION",

  // Onboarding forms - Policy Acknowledgments (11)
  DATA_PRIVACY_HIPAA: "DATA_PRIVACY_HIPAA",
  AT_WILL_EMPLOYMENT: "AT_WILL_EMPLOYMENT",
  ANTI_FRAUD: "ANTI_FRAUD",
  EUMR_POLICY: "EUMR_POLICY",
  DRUG_FREE_WORKPLACE: "DRUG_FREE_WORKPLACE",
  GRIEVANCE_POLICY: "GRIEVANCE_POLICY",
  MALTREATMENT_REPORTING: "MALTREATMENT_REPORTING",
  CELL_PHONE_POLICY: "CELL_PHONE_POLICY",
  CONFIDENTIALITY: "CONFIDENTIALITY",
  SERVICE_RECIPIENT_RIGHTS: "SERVICE_RECIPIENT_RIGHTS",
  STAFF_PAPP: "STAFF_PAPP",
} as const;

export type FormType = typeof FORM_TYPE[keyof typeof FORM_TYPE];

// Pre-hire forms (must be completed before submission)
export const PRE_HIRE_FORMS: FormType[] = [
  FORM_TYPE.EMPLOYMENT_APPLICATION,
  FORM_TYPE.BACKGROUND_STUDY,
];

// Onboarding forms (available after approval)
export const ONBOARDING_FORMS: FormType[] = [
  // Information forms
  FORM_TYPE.DIRECT_DEPOSIT,
  FORM_TYPE.EMERGENCY_CONTACT,
  FORM_TYPE.AUTO_INSURANCE,
  FORM_TYPE.JOB_DESCRIPTION,
  // Policy forms
  FORM_TYPE.DATA_PRIVACY_HIPAA,
  FORM_TYPE.AT_WILL_EMPLOYMENT,
  FORM_TYPE.ANTI_FRAUD,
  FORM_TYPE.EUMR_POLICY,
  FORM_TYPE.DRUG_FREE_WORKPLACE,
  FORM_TYPE.GRIEVANCE_POLICY,
  FORM_TYPE.MALTREATMENT_REPORTING,
  FORM_TYPE.CELL_PHONE_POLICY,
  FORM_TYPE.CONFIDENTIALITY,
  FORM_TYPE.SERVICE_RECIPIENT_RIGHTS,
  FORM_TYPE.STAFF_PAPP,
];

export const ALL_FORMS: FormType[] = [...PRE_HIRE_FORMS, ...ONBOARDING_FORMS];

// Form metadata
export const FORM_METADATA: Record<FormType, {
  name: string;
  description: string;
  category: "pre-hire" | "information" | "policy";
}> = {
  [FORM_TYPE.EMPLOYMENT_APPLICATION]: {
    name: "Employment Application",
    description: "Personal information, eligibility, work history, and references",
    category: "pre-hire",
  },
  [FORM_TYPE.BACKGROUND_STUDY]: {
    name: "Background Study Authorization",
    description: "Authorization for Minnesota DHS NETStudy 2.0 background check",
    category: "pre-hire",
  },
  [FORM_TYPE.DIRECT_DEPOSIT]: {
    name: "Direct Deposit Authorization",
    description: "Bank account information for payroll",
    category: "information",
  },
  [FORM_TYPE.EMERGENCY_CONTACT]: {
    name: "Emergency Contact Form",
    description: "Emergency contact information",
    category: "information",
  },
  [FORM_TYPE.AUTO_INSURANCE]: {
    name: "Auto Insurance & Vehicle Information",
    description: "Driver's license and vehicle insurance details",
    category: "information",
  },
  [FORM_TYPE.JOB_DESCRIPTION]: {
    name: "Job Description Acknowledgment",
    description: "Acknowledgment of DSP job duties and responsibilities",
    category: "information",
  },
  [FORM_TYPE.DATA_PRIVACY_HIPAA]: {
    name: "Data Privacy & HIPAA Acknowledgment",
    description: "Privacy and HIPAA compliance acknowledgment",
    category: "policy",
  },
  [FORM_TYPE.AT_WILL_EMPLOYMENT]: {
    name: "At-Will Employment Acknowledgment",
    description: "Understanding of at-will employment status",
    category: "policy",
  },
  [FORM_TYPE.ANTI_FRAUD]: {
    name: "Anti-Fraud Policy Acknowledgment",
    description: "Fraud prevention policy acknowledgment",
    category: "policy",
  },
  [FORM_TYPE.EUMR_POLICY]: {
    name: "EUMR Policy Acknowledgment",
    description: "Emergency Use of Manual Restraint policy",
    category: "policy",
  },
  [FORM_TYPE.DRUG_FREE_WORKPLACE]: {
    name: "Drug-Free Workplace Acknowledgment",
    description: "Drug and alcohol policy acknowledgment",
    category: "policy",
  },
  [FORM_TYPE.GRIEVANCE_POLICY]: {
    name: "Grievance Policy Acknowledgment",
    description: "Employee grievance procedure acknowledgment",
    category: "policy",
  },
  [FORM_TYPE.MALTREATMENT_REPORTING]: {
    name: "Maltreatment Reporting Acknowledgment",
    description: "Mandatory reporting requirements acknowledgment",
    category: "policy",
  },
  [FORM_TYPE.CELL_PHONE_POLICY]: {
    name: "Cell Phone & Electronic Device Policy",
    description: "Electronic device usage policy acknowledgment",
    category: "policy",
  },
  [FORM_TYPE.CONFIDENTIALITY]: {
    name: "Confidentiality Agreement",
    description: "Confidentiality and non-disclosure agreement",
    category: "policy",
  },
  [FORM_TYPE.SERVICE_RECIPIENT_RIGHTS]: {
    name: "Service Recipient Rights Acknowledgment",
    description: "Client rights and dignity acknowledgment",
    category: "policy",
  },
  [FORM_TYPE.STAFF_PAPP]: {
    name: "Staff PAPP Orientation Acknowledgment",
    description: "Person-centered practices orientation acknowledgment",
    category: "policy",
  },
};

// Employment types
export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "ON_CALL", label: "On-Call / PRN" },
];

// Available shifts
export const SHIFT_OPTIONS = [
  { value: "DAYS", label: "Days (7am - 3pm)" },
  { value: "EVENINGS", label: "Evenings (3pm - 11pm)" },
  { value: "OVERNIGHTS", label: "Overnights (11pm - 7am)" },
  { value: "WEEKENDS", label: "Weekends" },
];

// US States for address fields
export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

// Physical description options for background study
export const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Other"];
export const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Gray", "White", "Bald", "Other"];
export const GENDER_OPTIONS = ["Male", "Female", "Non-Binary", "Prefer not to say"];
