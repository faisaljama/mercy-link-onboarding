"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Education {
  id?: string;
  schoolName: string;
  location: string;
  yearsAttended: string;
  graduated: boolean;
  degree: string;
}

interface WorkHistory {
  id?: string;
  companyName: string;
  jobTitle: string;
  supervisorName: string;
  phone: string;
  address: string;
  startDate: string;
  endDate: string;
  reasonForLeaving: string;
  mayContact: boolean;
}

interface Reference {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

interface FormData {
  // Personal Info
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;

  // Position
  positionAppliedFor: string;
  employmentType: string[];
  availableShifts: string[];
  dateAvailableToStart: string;

  // Eligibility
  authorizedToWork: boolean | null;
  isOver18: boolean | null;
  hasDriversLicense: boolean | null;
  driversLicenseNumber: string;
  driversLicenseState: string;
  hasReliableTransport: boolean | null;
  hasAutoInsurance: boolean | null;

  // Conviction
  hasConviction: boolean | null;
  convictionExplanation: string;

  // Arrays
  education: Education[];
  workHistory: WorkHistory[];
  references: Reference[];
}

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function EmploymentApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = params.accessToken as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [formStatus, setFormStatus] = useState<string>("NOT_STARTED");

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "MN",
    zipCode: "",
    positionAppliedFor: "Direct Support Professional",
    employmentType: [],
    availableShifts: [],
    dateAvailableToStart: "",
    authorizedToWork: null,
    isOver18: null,
    hasDriversLicense: null,
    driversLicenseNumber: "",
    driversLicenseState: "MN",
    hasReliableTransport: null,
    hasAutoInsurance: null,
    hasConviction: null,
    convictionExplanation: "",
    education: [{ schoolName: "", location: "", yearsAttended: "", graduated: false, degree: "" }],
    workHistory: [],
    references: [
      { name: "", phone: "", relationship: "" },
      { name: "", phone: "", relationship: "" },
      { name: "", phone: "", relationship: "" },
    ],
  });

  const [signature, setSignature] = useState({
    typedName: "",
    agreed: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/apply/${accessToken}/forms/EMPLOYMENT_APPLICATION`);
        if (res.ok) {
          const data = await res.json();
          if (data.formData) {
            setFormData((prev) => ({ ...prev, ...data.formData }));
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
  }, [accessToken]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/apply/${accessToken}/forms/EMPLOYMENT_APPLICATION`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
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

    setSigning(true);
    setError("");

    try {
      // Save first
      await fetch(`/api/apply/${accessToken}/forms/EMPLOYMENT_APPLICATION`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });

      // Then sign
      const res = await fetch(`/api/apply/${accessToken}/forms/EMPLOYMENT_APPLICATION/sign`, {
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

  const updateField = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "employmentType" | "availableShifts", value: string) => {
    setFormData((prev) => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { schoolName: "", location: "", yearsAttended: "", graduated: false, degree: "" }],
    }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu)),
    }));
  };

  const addWorkHistory = () => {
    setFormData((prev) => ({
      ...prev,
      workHistory: [
        ...prev.workHistory,
        { companyName: "", jobTitle: "", supervisorName: "", phone: "", address: "", startDate: "", endDate: "", reasonForLeaving: "", mayContact: true },
      ],
    }));
  };

  const removeWorkHistory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workHistory: prev.workHistory.filter((_, i) => i !== index),
    }));
  };

  const updateWorkHistory = (index: number, field: keyof WorkHistory, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((work, i) => (i === index ? { ...work, [field]: value } : work)),
    }));
  };

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    setFormData((prev) => ({
      ...prev,
      references: prev.references.map((ref, i) => (i === index ? { ...ref, [field]: value } : ref)),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading form...</p>
      </div>
    );
  }

  const isCompleted = formStatus === "COMPLETED";

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
          <h1 className="text-2xl font-bold text-slate-900">Employment Application</h1>
          <p className="text-slate-600">Please complete all required fields</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  disabled={isCompleted}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => updateField("middleName", e.target.value)}
                  disabled={isCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  disabled={isCompleted}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={isCompleted}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address *</Label>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => updateField("streetAddress", e.target.value)}
                disabled={isCompleted}
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  disabled={isCompleted}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(v) => updateField("state", v)} disabled={isCompleted}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  disabled={isCompleted}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position & Availability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Position & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Position Applied For</Label>
              <Input value="Direct Support Professional" disabled className="bg-slate-50" />
            </div>

            <div className="space-y-2">
              <Label>Employment Type *</Label>
              <div className="flex flex-wrap gap-4">
                {["FULL_TIME", "PART_TIME", "ON_CALL"].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={formData.employmentType.includes(type)}
                      onCheckedChange={() => toggleArrayField("employmentType", type)}
                      disabled={isCompleted}
                    />
                    <Label htmlFor={`type-${type}`} className="font-normal">
                      {type.replace(/_/g, " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available Shifts *</Label>
              <div className="flex flex-wrap gap-4">
                {["DAYS", "EVENINGS", "OVERNIGHTS", "WEEKENDS"].map((shift) => (
                  <div key={shift} className="flex items-center gap-2">
                    <Checkbox
                      id={`shift-${shift}`}
                      checked={formData.availableShifts.includes(shift)}
                      onCheckedChange={() => toggleArrayField("availableShifts", shift)}
                      disabled={isCompleted}
                    />
                    <Label htmlFor={`shift-${shift}`} className="font-normal">
                      {shift}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateAvailableToStart">Date Available to Start *</Label>
              <Input
                id="dateAvailableToStart"
                type="date"
                value={formData.dateAvailableToStart}
                onChange={(e) => updateField("dateAvailableToStart", e.target.value)}
                disabled={isCompleted}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Eligibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Are you legally authorized to work in the United States? *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="authorized-yes"
                    checked={formData.authorizedToWork === true}
                    onChange={() => updateField("authorizedToWork", true)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="authorized-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="authorized-no"
                    checked={formData.authorizedToWork === false}
                    onChange={() => updateField("authorizedToWork", false)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="authorized-no" className="font-normal">No</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Are you 18 years of age or older? *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="over18-yes"
                    checked={formData.isOver18 === true}
                    onChange={() => updateField("isOver18", true)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="over18-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="over18-no"
                    checked={formData.isOver18 === false}
                    onChange={() => updateField("isOver18", false)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="over18-no" className="font-normal">No</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Do you have a valid driver&apos;s license? *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="license-yes"
                    checked={formData.hasDriversLicense === true}
                    onChange={() => updateField("hasDriversLicense", true)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="license-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="license-no"
                    checked={formData.hasDriversLicense === false}
                    onChange={() => updateField("hasDriversLicense", false)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="license-no" className="font-normal">No</Label>
                </div>
              </div>
            </div>

            {formData.hasDriversLicense && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="driversLicenseNumber">License Number</Label>
                  <Input
                    id="driversLicenseNumber"
                    value={formData.driversLicenseNumber}
                    onChange={(e) => updateField("driversLicenseNumber", e.target.value)}
                    disabled={isCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driversLicenseState">License State</Label>
                  <Select value={formData.driversLicenseState} onValueChange={(v) => updateField("driversLicenseState", v)} disabled={isCompleted}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Do you have reliable transportation? *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="transport-yes"
                    checked={formData.hasReliableTransport === true}
                    onChange={() => updateField("hasReliableTransport", true)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="transport-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="transport-no"
                    checked={formData.hasReliableTransport === false}
                    onChange={() => updateField("hasReliableTransport", false)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="transport-no" className="font-normal">No</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Do you have auto insurance? *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="insurance-yes"
                    checked={formData.hasAutoInsurance === true}
                    onChange={() => updateField("hasAutoInsurance", true)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="insurance-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="insurance-no"
                    checked={formData.hasAutoInsurance === false}
                    onChange={() => updateField("hasAutoInsurance", false)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="insurance-no" className="font-normal">No</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conviction Disclosure */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conviction Disclosure</CardTitle>
            <CardDescription>
              A conviction will not necessarily disqualify you from employment. Each case will be considered based on job relatedness.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Have you ever been convicted of a crime? *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="conviction-yes"
                    checked={formData.hasConviction === true}
                    onChange={() => updateField("hasConviction", true)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="conviction-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="conviction-no"
                    checked={formData.hasConviction === false}
                    onChange={() => updateField("hasConviction", false)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor="conviction-no" className="font-normal">No</Label>
                </div>
              </div>
            </div>

            {formData.hasConviction && (
              <div className="space-y-2">
                <Label htmlFor="convictionExplanation">Please explain</Label>
                <Textarea
                  id="convictionExplanation"
                  value={formData.convictionExplanation}
                  onChange={(e) => updateField("convictionExplanation", e.target.value)}
                  disabled={isCompleted}
                  placeholder="Please provide details..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Education</CardTitle>
              {!isCompleted && (
                <Button onClick={addEducation} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add School
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.education.map((edu, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">School {index + 1}</p>
                  {!isCompleted && formData.education.length > 1 && (
                    <Button onClick={() => removeEducation(index)} variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>School Name</Label>
                    <Input
                      value={edu.schoolName}
                      onChange={(e) => updateEducation(index, "schoolName", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={edu.location}
                      onChange={(e) => updateEducation(index, "location", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Years Attended</Label>
                    <Input
                      value={edu.yearsAttended}
                      onChange={(e) => updateEducation(index, "yearsAttended", e.target.value)}
                      disabled={isCompleted}
                      placeholder="e.g., 2018-2022"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree/Diploma</Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`graduated-${index}`}
                    checked={edu.graduated}
                    onCheckedChange={(checked) => updateEducation(index, "graduated", checked)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor={`graduated-${index}`} className="font-normal">Graduated</Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Work History */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Work History</CardTitle>
                <CardDescription>List your most recent employment first</CardDescription>
              </div>
              {!isCompleted && (
                <Button onClick={addWorkHistory} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Job
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.workHistory.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No work history added. Click &quot;Add Job&quot; to add your work experience.</p>
            )}
            {formData.workHistory.map((work, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Job {index + 1}</p>
                  {!isCompleted && (
                    <Button onClick={() => removeWorkHistory(index)} variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={work.companyName}
                      onChange={(e) => updateWorkHistory(index, "companyName", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title *</Label>
                    <Input
                      value={work.jobTitle}
                      onChange={(e) => updateWorkHistory(index, "jobTitle", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supervisor Name</Label>
                    <Input
                      value={work.supervisorName}
                      onChange={(e) => updateWorkHistory(index, "supervisorName", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={work.phone}
                      onChange={(e) => updateWorkHistory(index, "phone", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={work.address}
                      onChange={(e) => updateWorkHistory(index, "address", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={work.startDate}
                      onChange={(e) => updateWorkHistory(index, "startDate", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={work.endDate}
                      onChange={(e) => updateWorkHistory(index, "endDate", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Reason for Leaving</Label>
                    <Input
                      value={work.reasonForLeaving}
                      onChange={(e) => updateWorkHistory(index, "reasonForLeaving", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`mayContact-${index}`}
                    checked={work.mayContact}
                    onCheckedChange={(checked) => updateWorkHistory(index, "mayContact", checked as boolean)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor={`mayContact-${index}`} className="font-normal">May we contact this employer?</Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* References */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>References</CardTitle>
            <CardDescription>Please provide three professional references (not relatives)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.references.map((ref, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <p className="font-medium">Reference {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={ref.name}
                      onChange={(e) => updateReference(index, "name", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={ref.phone}
                      onChange={(e) => updateReference(index, "phone", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship *</Label>
                    <Input
                      value={ref.relationship}
                      onChange={(e) => updateReference(index, "relationship", e.target.value)}
                      disabled={isCompleted}
                      placeholder="e.g., Former supervisor"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Signature */}
        {!isCompleted && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Certification & Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                I certify that the information contained in this application is true and complete. I understand that false information may be grounds for not hiring me or for immediate termination of employment.
              </p>
              <p className="text-sm text-slate-600">
                I authorize the verification of any and all information listed above. I authorize Mercy Link LLC to make any investigation of my personal, educational, vocational, or employment history.
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
