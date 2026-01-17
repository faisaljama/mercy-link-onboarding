"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";

interface FormMetadata {
  name: string;
  description: string;
  category: string;
  requiresAcknowledgments: boolean;
  requiresDocumentUpload: boolean;
  documentTypes?: string[];
}

const FORM_METADATA: Record<string, FormMetadata> = {
  "direct-deposit": {
    name: "Direct Deposit Authorization",
    description: "Authorize direct deposit for your paycheck",
    category: "Information",
    requiresAcknowledgments: false,
    requiresDocumentUpload: true,
    documentTypes: ["VOIDED_CHECK"],
  },
  "emergency-contact": {
    name: "Emergency Contact Form",
    description: "Provide emergency contact information",
    category: "Information",
    requiresAcknowledgments: false,
    requiresDocumentUpload: false,
  },
  "auto-insurance": {
    name: "Auto Insurance & Vehicle Information",
    description: "Provide vehicle and insurance information",
    category: "Information",
    requiresAcknowledgments: false,
    requiresDocumentUpload: true,
    documentTypes: ["INSURANCE_CARD", "VEHICLE_REGISTRATION"],
  },
  "job-description": {
    name: "Job Description Acknowledgment",
    description: "Review and acknowledge the job description",
    category: "Information",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "data-privacy-hipaa": {
    name: "Data Privacy & HIPAA Acknowledgment",
    description: "Review HIPAA requirements and data privacy policies",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "at-will-employment": {
    name: "At-Will Employment Acknowledgment",
    description: "Acknowledge at-will employment status",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "anti-fraud-policy": {
    name: "Anti-Fraud Policy Acknowledgment",
    description: "Review and acknowledge anti-fraud policies",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "eumr-policy": {
    name: "EUMR Policy Acknowledgment",
    description: "Review the Emergency Use of Manual Restraints policy",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "drug-free-workplace": {
    name: "Drug-Free Workplace Acknowledgment",
    description: "Review and acknowledge drug-free workplace policy",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "grievance-policy": {
    name: "Grievance Policy Acknowledgment",
    description: "Review the grievance policy and procedures",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "maltreatment-reporting": {
    name: "Maltreatment Reporting Acknowledgment",
    description: "Review mandatory maltreatment reporting requirements",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "cell-phone-policy": {
    name: "Cell Phone & Electronic Device Acknowledgment",
    description: "Review cell phone and electronic device policies",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "confidentiality": {
    name: "Confidentiality Agreement",
    description: "Review and sign the confidentiality agreement",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "service-recipient-rights": {
    name: "Service Recipient Rights Acknowledgment",
    description: "Review service recipient rights requirements",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
  "staff-papp-orientation": {
    name: "Staff PAPP Orientation Acknowledgment",
    description: "Review the Positive Approaches and Person-centered Practices orientation",
    category: "Policy",
    requiresAcknowledgments: true,
    requiresDocumentUpload: false,
  },
};

// Default acknowledgment items for policy forms
const getAcknowledgmentItems = (formType: string): string[] => {
  const baseItems = [
    "I have read and understood this policy in its entirety",
    "I agree to comply with all requirements outlined in this policy",
    "I understand that failure to comply may result in disciplinary action",
    "I have had the opportunity to ask questions about this policy",
  ];

  const specificItems: Record<string, string[]> = {
    "data-privacy-hipaa": [
      "I understand HIPAA regulations regarding protected health information",
      "I will maintain confidentiality of all client health information",
      "I will only access information necessary for my job duties",
      "I will report any suspected HIPAA violations immediately",
    ],
    "maltreatment-reporting": [
      "I understand my obligation as a mandated reporter",
      "I will report any suspected maltreatment immediately",
      "I understand the types of maltreatment that must be reported",
      "I know who to contact to make a report",
    ],
    "confidentiality": [
      "I will maintain confidentiality of all client information",
      "I will not disclose any client information without proper authorization",
      "I understand that confidentiality obligations continue after employment ends",
    ],
    "job-description": [
      "I have read and understand the job description for my position",
      "I am able to perform the essential functions of this position",
      "I understand the physical requirements of this position",
    ],
  };

  return specificItems[formType] || baseItems;
};

export default function OnboardingFormPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = params.accessToken as string;
  const formTypeSlug = params.formType as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [formStatus, setFormStatus] = useState<string>("NOT_STARTED");

  const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});

  const [signature, setSignature] = useState({
    typedName: "",
    agreed: false,
  });

  // Convert slug to form type (e.g., "direct-deposit" -> "DIRECT_DEPOSIT")
  const formType = formTypeSlug.toUpperCase().replace(/-/g, "_");
  const metadata = FORM_METADATA[formTypeSlug];
  const acknowledgmentItems = metadata?.requiresAcknowledgments ? getAcknowledgmentItems(formTypeSlug) : [];

  useEffect(() => {
    if (!metadata) {
      setError("Form not found");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/apply/${accessToken}/forms/${formType}`);
        if (res.ok) {
          const data = await res.json();
          if (data.formData) {
            setFormData(data.formData);
          }
          if (data.acknowledgments) {
            setAcknowledgments(data.acknowledgments);
          }
          setFormStatus(data.status || "NOT_STARTED");
          if (data.signatureTypedName) {
            setSignature({
              typedName: data.signatureTypedName,
              agreed: true,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching form:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, formType, metadata]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/apply/${accessToken}/forms/${formType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, acknowledgments }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setFormStatus("IN_PROGRESS");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!signature.typedName || !signature.agreed) {
      setError("Please type your full name and agree to the signature");
      return;
    }

    // Check all acknowledgments
    if (metadata?.requiresAcknowledgments) {
      const allChecked = acknowledgmentItems.every((item) => acknowledgments[item]);
      if (!allChecked) {
        setError("Please check all acknowledgment items before signing");
        return;
      }
    }

    setSigning(true);
    setError("");

    try {
      // Save first
      await fetch(`/api/apply/${accessToken}/forms/${formType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, acknowledgments }),
      });

      // Then sign
      const res = await fetch(`/api/apply/${accessToken}/forms/${formType}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureTypedName: signature.typedName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign");
      }

      router.push(`/apply/${accessToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign");
    } finally {
      setSigning(false);
    }
  };

  const toggleAcknowledgment = (item: string) => {
    setAcknowledgments((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading form...</p>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Form Not Found</h2>
            <p className="text-slate-600 mb-4">This form type does not exist.</p>
            <Button onClick={() => router.push(`/apply/${accessToken}`)}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = formStatus === "COMPLETED";

  // Render form-specific fields
  const renderFormFields = () => {
    switch (formTypeSlug) {
      case "direct-deposit":
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Bank Account Information</CardTitle>
              <CardDescription>Enter your bank account details for direct deposit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
                  disabled={isCompleted}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number *</Label>
                  <Input
                    id="routingNumber"
                    value={formData.routingNumber || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, routingNumber: e.target.value }))}
                    disabled={isCompleted}
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    disabled={isCompleted}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="checking"
                      checked={formData.accountType === "CHECKING"}
                      onChange={() => setFormData((prev) => ({ ...prev, accountType: "CHECKING" }))}
                      disabled={isCompleted}
                    />
                    <Label htmlFor="checking" className="font-normal">Checking</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="savings"
                      checked={formData.accountType === "SAVINGS"}
                      onChange={() => setFormData((prev) => ({ ...prev, accountType: "SAVINGS" }))}
                      disabled={isCompleted}
                    />
                    <Label htmlFor="savings" className="font-normal">Savings</Label>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Please attach a voided check or bank statement showing your account information.
              </p>
            </CardContent>
          </Card>
        );

      case "emergency-contact":
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Emergency Contact Information</CardTitle>
              <CardDescription>Provide at least one emergency contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg space-y-4">
                <p className="font-medium">Primary Emergency Contact</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ec1Name">Full Name *</Label>
                    <Input
                      id="ec1Name"
                      value={formData.emergencyContact1Name || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact1Name: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ec1Relationship">Relationship *</Label>
                    <Input
                      id="ec1Relationship"
                      value={formData.emergencyContact1Relationship || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact1Relationship: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ec1Phone">Phone Number *</Label>
                    <Input
                      id="ec1Phone"
                      value={formData.emergencyContact1Phone || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact1Phone: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ec1AltPhone">Alternative Phone</Label>
                    <Input
                      id="ec1AltPhone"
                      value={formData.emergencyContact1AltPhone || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact1AltPhone: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-4">
                <p className="font-medium">Secondary Emergency Contact (Optional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ec2Name">Full Name</Label>
                    <Input
                      id="ec2Name"
                      value={formData.emergencyContact2Name || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact2Name: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ec2Relationship">Relationship</Label>
                    <Input
                      id="ec2Relationship"
                      value={formData.emergencyContact2Relationship || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact2Relationship: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ec2Phone">Phone Number</Label>
                    <Input
                      id="ec2Phone"
                      value={formData.emergencyContact2Phone || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact2Phone: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "auto-insurance":
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Vehicle & Insurance Information</CardTitle>
              <CardDescription>Provide details about your vehicle and insurance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Vehicle Year *</Label>
                  <Input
                    id="vehicleYear"
                    value={formData.vehicleYear || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicleYear: e.target.value }))}
                    disabled={isCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleMake">Make *</Label>
                  <Input
                    id="vehicleMake"
                    value={formData.vehicleMake || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicleMake: e.target.value }))}
                    disabled={isCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleModel">Model *</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                    disabled={isCompleted}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, licensePlate: e.target.value }))}
                    disabled={isCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleColor">Color</Label>
                  <Input
                    id="vehicleColor"
                    value={formData.vehicleColor || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicleColor: e.target.value }))}
                    disabled={isCompleted}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="font-medium mb-4">Insurance Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceCompany">Insurance Company *</Label>
                    <Input
                      id="insuranceCompany"
                      value={formData.insuranceCompany || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, insuranceCompany: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyNumber">Policy Number *</Label>
                    <Input
                      id="policyNumber"
                      value={formData.policyNumber || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, policyNumber: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyExpiration">Policy Expiration Date *</Label>
                    <Input
                      id="policyExpiration"
                      type="date"
                      value={formData.policyExpiration || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, policyExpiration: e.target.value }))}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Please attach a copy of your insurance card and vehicle registration.
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/apply/${accessToken}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            {!isCompleted && (
              <Button onClick={handleSave} disabled={saving} variant="outline">
                {saving ? "Saving..." : "Save Progress"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {metadata.name}
          </h1>
          <p className="text-slate-600">{metadata.description}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Form-specific fields */}
        {renderFormFields()}

        {/* Acknowledgments */}
        {metadata.requiresAcknowledgments && acknowledgmentItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Acknowledgments</CardTitle>
              <CardDescription>Please read and check each item below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {acknowledgmentItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Checkbox
                    id={`ack-${index}`}
                    checked={acknowledgments[item] || false}
                    onCheckedChange={() => toggleAcknowledgment(item)}
                    disabled={isCompleted}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`ack-${index}`} className="font-normal text-sm leading-relaxed">
                    {item}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Signature */}
        {!isCompleted && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Electronic Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                By signing below, I acknowledge that I have read and understand this document
                and agree to comply with all stated policies and procedures.
              </p>

              <div className="space-y-2">
                <Label htmlFor="signatureTypedName">Type your full legal name to sign *</Label>
                <Input
                  id="signatureTypedName"
                  value={signature.typedName}
                  onChange={(e) => setSignature((prev) => ({ ...prev, typedName: e.target.value }))}
                  placeholder="Type your full legal name"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="signatureAgreed"
                  checked={signature.agreed}
                  onCheckedChange={(checked) => setSignature((prev) => ({ ...prev, agreed: checked as boolean }))}
                />
                <Label htmlFor="signatureAgreed" className="font-normal text-sm">
                  I agree that typing my name above constitutes my legal signature
                </Label>
              </div>

              <Button onClick={handleSign} disabled={signing || !signature.typedName || !signature.agreed} className="w-full">
                {signing ? "Signing..." : "Sign & Complete Form"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <p className="text-green-700 font-medium">This form has been completed and signed.</p>
              <p className="text-sm text-green-600 mt-1">Signed by: {signature.typedName}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
