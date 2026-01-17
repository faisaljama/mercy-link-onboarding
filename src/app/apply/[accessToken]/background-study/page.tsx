"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Shield } from "lucide-react";

interface AddressHistory {
  id?: string;
  streetAddress: string;
  city: string;
  state: string;
  fromDate: string;
  toDate: string;
  isCurrent: boolean;
}

interface FormData {
  // Personal Info
  ssn: string;
  confirmSsn: string;
  dateOfBirth: string;

  // Physical Description
  gender: string;
  eyeColor: string;
  hairColor: string;
  height: string;
  weight: string;

  // Address History (5 years)
  addressHistory: AddressHistory[];
}

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Black", "Other"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Gray", "White", "Bald", "Other"];
const GENDERS = ["Male", "Female", "Non-Binary", "Prefer not to say"];

export default function BackgroundStudyPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = params.accessToken as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [formStatus, setFormStatus] = useState<string>("NOT_STARTED");

  const [formData, setFormData] = useState<FormData>({
    ssn: "",
    confirmSsn: "",
    dateOfBirth: "",
    gender: "",
    eyeColor: "",
    hairColor: "",
    height: "",
    weight: "",
    addressHistory: [
      { streetAddress: "", city: "", state: "MN", fromDate: "", toDate: "", isCurrent: true },
    ],
  });

  const [signature, setSignature] = useState({
    typedName: "",
    agreed: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/apply/${accessToken}/forms/BACKGROUND_STUDY`);
        if (res.ok) {
          const data = await res.json();
          if (data.formData) {
            // Don't populate SSN from saved data for security
            const { ssn, confirmSsn, ...rest } = data.formData;
            setFormData((prev) => ({ ...prev, ...rest }));
            // Show masked SSN if it exists
            if (data.ssnLastFour) {
              setFormData((prev) => ({
                ...prev,
                ssn: `***-**-${data.ssnLastFour}`,
                confirmSsn: `***-**-${data.ssnLastFour}`,
              }));
            }
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
      // Validate SSN match
      if (formData.ssn !== formData.confirmSsn && !formData.ssn.includes("*")) {
        throw new Error("Social Security Numbers do not match");
      }

      const dataToSend = { ...formData };
      // Don't send masked SSN back to server
      if (formData.ssn.includes("*")) {
        delete (dataToSend as Partial<FormData>).ssn;
        delete (dataToSend as Partial<FormData>).confirmSsn;
      }

      const res = await fetch(`/api/apply/${accessToken}/forms/BACKGROUND_STUDY`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: dataToSend }),
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
      // Validate SSN match
      if (formData.ssn !== formData.confirmSsn && !formData.ssn.includes("*")) {
        throw new Error("Social Security Numbers do not match");
      }

      const dataToSend = { ...formData };
      if (formData.ssn.includes("*")) {
        delete (dataToSend as Partial<FormData>).ssn;
        delete (dataToSend as Partial<FormData>).confirmSsn;
      }

      // Save first
      await fetch(`/api/apply/${accessToken}/forms/BACKGROUND_STUDY`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: dataToSend }),
      });

      // Then sign
      const res = await fetch(`/api/apply/${accessToken}/forms/BACKGROUND_STUDY/sign`, {
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

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addressHistory: [
        ...prev.addressHistory,
        { streetAddress: "", city: "", state: "MN", fromDate: "", toDate: "", isCurrent: false },
      ],
    }));
  };

  const removeAddress = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addressHistory: prev.addressHistory.filter((_, i) => i !== index),
    }));
  };

  const updateAddress = (index: number, field: keyof AddressHistory, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      addressHistory: prev.addressHistory.map((addr, i) => {
        if (i === index) {
          const updated = { ...addr, [field]: value };
          // If setting as current, clear toDate
          if (field === "isCurrent" && value === true) {
            updated.toDate = "";
          }
          return updated;
        }
        // If setting another address as current, unset others
        if (field === "isCurrent" && value === true) {
          return { ...addr, isCurrent: false };
        }
        return addr;
      }),
    }));
  };

  const formatSSN = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Background Study Authorization
          </h1>
          <p className="text-slate-600">Required for Minnesota DHS NETStudy 2.0</p>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Security Notice:</strong> Your Social Security Number is encrypted using AES-256 encryption and stored securely.
              It will only be used for the Minnesota DHS background study and will not be shared with any other parties.
            </p>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>This information is required for the DHS background study</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ssn">Social Security Number *</Label>
                <Input
                  id="ssn"
                  value={formData.ssn}
                  onChange={(e) => updateField("ssn", formatSSN(e.target.value))}
                  disabled={isCompleted}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmSsn">Confirm SSN *</Label>
                <Input
                  id="confirmSsn"
                  value={formData.confirmSsn}
                  onChange={(e) => updateField("confirmSsn", formatSSN(e.target.value))}
                  disabled={isCompleted}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                disabled={isCompleted}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Physical Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Physical Description</CardTitle>
            <CardDescription>Required for background study identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)} disabled={isCompleted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eyeColor">Eye Color *</Label>
                <Select value={formData.eyeColor} onValueChange={(v) => updateField("eyeColor", v)} disabled={isCompleted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select eye color" />
                  </SelectTrigger>
                  <SelectContent>
                    {EYE_COLORS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hairColor">Hair Color *</Label>
                <Select value={formData.hairColor} onValueChange={(v) => updateField("hairColor", v)} disabled={isCompleted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hair color" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAIR_COLORS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height *</Label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g., 5'10&quot;"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g., 170"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address History */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Address History (5 Years)</CardTitle>
                <CardDescription>List all addresses where you have lived in the past 5 years, starting with your current address</CardDescription>
              </div>
              {!isCompleted && (
                <Button onClick={addAddress} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Address
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.addressHistory.map((addr, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Address {index + 1}</p>
                    {addr.isCurrent && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Current</span>
                    )}
                  </div>
                  {!isCompleted && formData.addressHistory.length > 1 && (
                    <Button onClick={() => removeAddress(index)} variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input
                    value={addr.streetAddress}
                    onChange={(e) => updateAddress(index, "streetAddress", e.target.value)}
                    disabled={isCompleted}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>City *</Label>
                    <Input
                      value={addr.city}
                      onChange={(e) => updateAddress(index, "city", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={addr.state} onValueChange={(v) => updateAddress(index, "state", v)} disabled={isCompleted}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date *</Label>
                    <Input
                      type="date"
                      value={addr.fromDate}
                      onChange={(e) => updateAddress(index, "fromDate", e.target.value)}
                      disabled={isCompleted}
                    />
                  </div>
                  {!addr.isCurrent && (
                    <div className="space-y-2">
                      <Label>To Date *</Label>
                      <Input
                        type="date"
                        value={addr.toDate}
                        onChange={(e) => updateAddress(index, "toDate", e.target.value)}
                        disabled={isCompleted}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`isCurrent-${index}`}
                    checked={addr.isCurrent}
                    onCheckedChange={(checked) => updateAddress(index, "isCurrent", checked)}
                    disabled={isCompleted}
                  />
                  <Label htmlFor={`isCurrent-${index}`} className="font-normal">This is my current address</Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Authorization */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Background Study Authorization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-3">
              <p>
                I authorize Mercy Link LLC to submit my information to the Minnesota Department of Human Services
                (DHS) for a background study as required under Minnesota Statutes, Chapter 245C.
              </p>
              <p>
                I understand that this background study will include a review of:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Minnesota Bureau of Criminal Apprehension records</li>
                <li>National Crime Information Center records</li>
                <li>Minnesota Court Information System records</li>
                <li>Maltreatment records maintained by DHS</li>
                <li>Other state records as allowed by law</li>
              </ul>
              <p>
                I understand that DHS will determine my eligibility to work with vulnerable adults and children
                based on the results of this background study.
              </p>
              <p>
                I certify that all information provided is true and accurate to the best of my knowledge.
                I understand that providing false information may result in disqualification or termination.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        {!isCompleted && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Electronic Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  I agree that typing my name above constitutes my legal signature and authorization for the background study
                </Label>
              </div>

              <Button onClick={handleSign} disabled={signing || !signature.typedName || !signature.agreed} className="w-full">
                {signing ? "Signing..." : "Sign & Complete Authorization"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <p className="text-green-700 font-medium">This authorization has been completed and signed.</p>
              <p className="text-sm text-green-600 mt-1">Signed by: {signature.typedName}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
