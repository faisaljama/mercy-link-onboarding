// Form acknowledgments for policy forms
import { FormType, FORM_TYPE } from "./constants";

export interface AcknowledgmentItem {
  id: string;
  label: string;
  required: boolean;
}

export interface FormAcknowledgment {
  title: string;
  policyContent?: string; // Optional policy text to display before acknowledgments
  items: AcknowledgmentItem[];
}

export const FORM_ACKNOWLEDGMENTS: Partial<Record<FormType, FormAcknowledgment>> = {
  [FORM_TYPE.JOB_DESCRIPTION]: {
    title: "Job Description Acknowledgment",
    items: [
      {
        id: "understand_duties",
        label: "I have read and understand the job duties and responsibilities of the Direct Support Professional position.",
        required: true,
      },
      {
        id: "meet_requirements",
        label: "I confirm that I meet the minimum qualifications for this position.",
        required: true,
      },
      {
        id: "physical_requirements",
        label: "I understand and can perform the physical requirements of this position.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.DATA_PRIVACY_HIPAA]: {
    title: "Data Privacy & HIPAA Acknowledgment",
    items: [
      {
        id: "hipaa_training",
        label: "I understand I will receive HIPAA training and must comply with all privacy regulations.",
        required: true,
      },
      {
        id: "phi_protection",
        label: "I will protect all Protected Health Information (PHI) and client data.",
        required: true,
      },
      {
        id: "report_breaches",
        label: "I will immediately report any suspected privacy breaches to my supervisor.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.AT_WILL_EMPLOYMENT]: {
    title: "At-Will Employment Acknowledgment",
    items: [
      {
        id: "at_will_understand",
        label: "I understand that my employment is at-will and may be terminated at any time by either party.",
        required: true,
      },
      {
        id: "no_contract",
        label: "I understand that this acknowledgment does not constitute an employment contract.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.ANTI_FRAUD]: {
    title: "Anti-Fraud Policy Acknowledgment",
    items: [
      {
        id: "fraud_policy",
        label: "I have read and understand the company's anti-fraud policy.",
        required: true,
      },
      {
        id: "report_fraud",
        label: "I will report any suspected fraudulent activity immediately.",
        required: true,
      },
      {
        id: "accurate_records",
        label: "I will maintain accurate and truthful records in all documentation.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.EUMR_POLICY]: {
    title: "Emergency Use of Manual Restraint (EUMR) Policy",
    items: [
      {
        id: "eumr_understand",
        label: "I understand the EUMR policy and when manual restraint may be used.",
        required: true,
      },
      {
        id: "eumr_training",
        label: "I understand I must complete EUMR training before using any manual restraint.",
        required: true,
      },
      {
        id: "eumr_reporting",
        label: "I understand the reporting requirements for any use of manual restraint.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.DRUG_FREE_WORKPLACE]: {
    title: "Drug-Free Workplace Acknowledgment",
    items: [
      {
        id: "drug_free_policy",
        label: "I have read and understand the drug-free workplace policy.",
        required: true,
      },
      {
        id: "no_substances",
        label: "I will not use, possess, or be under the influence of alcohol or illegal drugs while working.",
        required: true,
      },
      {
        id: "drug_testing",
        label: "I understand I may be subject to drug testing as outlined in the policy.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.GRIEVANCE_POLICY]: {
    title: "Grievance Policy Acknowledgment",
    items: [
      {
        id: "grievance_understand",
        label: "I have read and understand the employee grievance procedure.",
        required: true,
      },
      {
        id: "grievance_process",
        label: "I understand how to file a grievance and the steps involved.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.MALTREATMENT_REPORTING]: {
    title: "Maltreatment Reporting Acknowledgment",
    items: [
      {
        id: "mandatory_reporter",
        label: "I understand that I am a mandatory reporter under Minnesota law.",
        required: true,
      },
      {
        id: "report_maltreatment",
        label: "I will immediately report any suspected maltreatment of vulnerable adults.",
        required: true,
      },
      {
        id: "reporting_process",
        label: "I understand the process for reporting maltreatment to the Minnesota Adult Abuse Reporting Center (MAARC).",
        required: true,
      },
      {
        id: "no_retaliation",
        label: "I understand that retaliation against reporters is prohibited.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.CELL_PHONE_POLICY]: {
    title: "Cell Phone & Electronic Device Policy",
    items: [
      {
        id: "cell_phone_policy",
        label: "I have read and understand the cell phone and electronic device policy.",
        required: true,
      },
      {
        id: "limited_use",
        label: "I understand that personal cell phone use is limited during work hours.",
        required: true,
      },
      {
        id: "no_photos",
        label: "I will not take photos or videos of clients without proper authorization.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.CONFIDENTIALITY]: {
    title: "Confidentiality Agreement",
    items: [
      {
        id: "confidential_info",
        label: "I will maintain the confidentiality of all client and company information.",
        required: true,
      },
      {
        id: "no_disclosure",
        label: "I will not disclose confidential information to unauthorized persons.",
        required: true,
      },
      {
        id: "post_employment",
        label: "I understand that confidentiality obligations continue after employment ends.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.SERVICE_RECIPIENT_RIGHTS]: {
    title: "Service Recipient Rights Acknowledgment",
    items: [
      {
        id: "rights_understand",
        label: "I have read and understand the rights of service recipients.",
        required: true,
      },
      {
        id: "dignity_respect",
        label: "I will treat all clients with dignity and respect.",
        required: true,
      },
      {
        id: "protect_rights",
        label: "I will actively protect and advocate for client rights.",
        required: true,
      },
      {
        id: "report_violations",
        label: "I will report any violations of client rights immediately.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.STAFF_PAPP]: {
    title: "Staff PAPP Orientation Acknowledgment",
    items: [
      {
        id: "papp_understand",
        label: "I have completed the Person-Centered Practices (PAPP) orientation.",
        required: true,
      },
      {
        id: "person_centered",
        label: "I understand and will apply person-centered approaches in my work.",
        required: true,
      },
      {
        id: "individual_needs",
        label: "I will respect and support each client's individual needs, preferences, and goals.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.DIRECT_DEPOSIT]: {
    title: "Direct Deposit Authorization",
    items: [
      {
        id: "authorize_deposit",
        label: "I authorize Mercy Link LLC to deposit my pay directly into the bank account provided.",
        required: true,
      },
      {
        id: "accurate_info",
        label: "I certify that the bank account information provided is accurate.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.EMERGENCY_CONTACT]: {
    title: "Emergency Contact Authorization",
    items: [
      {
        id: "contact_permission",
        label: "I authorize Mercy Link LLC to contact the individuals listed in case of emergency.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.AUTO_INSURANCE]: {
    title: "Auto Insurance Verification",
    items: [
      {
        id: "valid_license",
        label: "I certify that I have a valid driver's license.",
        required: true,
      },
      {
        id: "valid_insurance",
        label: "I certify that I maintain valid auto insurance that meets Minnesota minimum requirements.",
        required: true,
      },
      {
        id: "notify_changes",
        label: "I will notify Mercy Link LLC immediately of any changes to my license or insurance status.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.EMPLOYMENT_APPLICATION]: {
    title: "Employment Application Certification",
    items: [
      {
        id: "accurate_info",
        label: "I certify that all information provided in this application is true and complete.",
        required: true,
      },
      {
        id: "background_check",
        label: "I understand that a background check will be conducted as part of the hiring process.",
        required: true,
      },
      {
        id: "false_info",
        label: "I understand that false or misleading information may result in disqualification or termination.",
        required: true,
      },
    ],
  },

  [FORM_TYPE.BACKGROUND_STUDY]: {
    title: "Background Study Authorization",
    items: [
      {
        id: "authorize_study",
        label: "I authorize the Minnesota Department of Human Services to conduct a background study.",
        required: true,
      },
      {
        id: "accurate_ssn",
        label: "I certify that the Social Security Number provided is accurate.",
        required: true,
      },
      {
        id: "netstudy_consent",
        label: "I consent to the NETStudy 2.0 background check process.",
        required: true,
      },
    ],
  },
};
