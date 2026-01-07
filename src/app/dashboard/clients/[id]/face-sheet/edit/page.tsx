"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, User, Shield, AlertCircle, Stethoscope, Heart } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  ssn: string | null;
  gender: string | null;
  ethnicity: string | null;
  preferredLanguage: string | null;
  maritalStatus: string | null;
  pmiNumber: string | null;
  insuranceName: string | null;
  insurancePolicyNumber: string | null;
  insuranceGroupNumber: string | null;
  insurancePhone: string | null;
  emergencyContact1Name: string | null;
  emergencyContact1Phone: string | null;
  emergencyContact1Relationship: string | null;
  emergencyContact2Name: string | null;
  emergencyContact2Phone: string | null;
  emergencyContact2Relationship: string | null;
  pharmacyName: string | null;
  pharmacyPhone: string | null;
  pharmacyAddress: string | null;
  primaryCareName: string | null;
  primaryCarePhone: string | null;
  primaryCareAddress: string | null;
  psychiatristName: string | null;
  psychiatristPhone: string | null;
  psychiatristAddress: string | null;
  dentalName: string | null;
  dentalPhone: string | null;
  dentalAddress: string | null;
  visionName: string | null;
  visionPhone: string | null;
  visionAddress: string | null;
  allergies: string | null;
  dietaryRestrictions: string | null;
  diagnoses: string | null;
  medications: string | null;
}

export default function EditFaceSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(true);
  const [error, setError] = useState("");
  const [client, setClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    // Personal Info
    middleName: "",
    ssn: "",
    gender: "",
    ethnicity: "",
    preferredLanguage: "",
    maritalStatus: "",
    // Insurance
    pmiNumber: "",
    insuranceName: "",
    insurancePolicyNumber: "",
    insuranceGroupNumber: "",
    insurancePhone: "",
    // Emergency Contacts
    emergencyContact1Name: "",
    emergencyContact1Phone: "",
    emergencyContact1Relationship: "",
    emergencyContact2Name: "",
    emergencyContact2Phone: "",
    emergencyContact2Relationship: "",
    // Medical Providers
    pharmacyName: "",
    pharmacyPhone: "",
    pharmacyAddress: "",
    primaryCareName: "",
    primaryCarePhone: "",
    primaryCareAddress: "",
    psychiatristName: "",
    psychiatristPhone: "",
    psychiatristAddress: "",
    dentalName: "",
    dentalPhone: "",
    dentalAddress: "",
    visionName: "",
    visionPhone: "",
    visionAddress: "",
    // Medical Info
    allergies: "",
    dietaryRestrictions: "",
    diagnoses: "",
    medications: "",
  });

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setFormData({
          middleName: data.client.middleName || "",
          ssn: data.client.ssn || "",
          gender: data.client.gender || "",
          ethnicity: data.client.ethnicity || "",
          preferredLanguage: data.client.preferredLanguage || "",
          maritalStatus: data.client.maritalStatus || "",
          pmiNumber: data.client.pmiNumber || "",
          insuranceName: data.client.insuranceName || "",
          insurancePolicyNumber: data.client.insurancePolicyNumber || "",
          insuranceGroupNumber: data.client.insuranceGroupNumber || "",
          insurancePhone: data.client.insurancePhone || "",
          emergencyContact1Name: data.client.emergencyContact1Name || "",
          emergencyContact1Phone: data.client.emergencyContact1Phone || "",
          emergencyContact1Relationship: data.client.emergencyContact1Relationship || "",
          emergencyContact2Name: data.client.emergencyContact2Name || "",
          emergencyContact2Phone: data.client.emergencyContact2Phone || "",
          emergencyContact2Relationship: data.client.emergencyContact2Relationship || "",
          pharmacyName: data.client.pharmacyName || "",
          pharmacyPhone: data.client.pharmacyPhone || "",
          pharmacyAddress: data.client.pharmacyAddress || "",
          primaryCareName: data.client.primaryCareName || "",
          primaryCarePhone: data.client.primaryCarePhone || "",
          primaryCareAddress: data.client.primaryCareAddress || "",
          psychiatristName: data.client.psychiatristName || "",
          psychiatristPhone: data.client.psychiatristPhone || "",
          psychiatristAddress: data.client.psychiatristAddress || "",
          dentalName: data.client.dentalName || "",
          dentalPhone: data.client.dentalPhone || "",
          dentalAddress: data.client.dentalAddress || "",
          visionName: data.client.visionName || "",
          visionPhone: data.client.visionPhone || "",
          visionAddress: data.client.visionAddress || "",
          allergies: data.client.allergies || "",
          dietaryRestrictions: data.client.dietaryRestrictions || "",
          diagnoses: data.client.diagnoses || "",
          medications: data.client.medications || "",
        });
      } else {
        setError("Client not found");
      }
    } catch (error) {
      console.error("Failed to fetch client:", error);
      setError("Failed to load client");
    } finally {
      setLoadingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/clients/${id}/face-sheet`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update face sheet");
      }

      router.push(`/dashboard/clients/${id}/face-sheet`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update face sheet");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Client not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${id}/face-sheet`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Face Sheet
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Edit Face Sheet</h1>
        <p className="text-slate-500">
          Update information for {client.firstName} {client.lastName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
            <CardDescription>Additional personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => updateField("middleName", e.target.value)}
                  placeholder="Middle name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssn">SSN (Last 4 digits)</Label>
                <Input
                  id="ssn"
                  value={formData.ssn}
                  onChange={(e) => updateField("ssn", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Last 4 digits only"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ethnicity">Ethnicity</Label>
                <Input
                  id="ethnicity"
                  value={formData.ethnicity}
                  onChange={(e) => updateField("ethnicity", e.target.value)}
                  placeholder="Ethnicity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Language</Label>
                <Input
                  id="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={(e) => updateField("preferredLanguage", e.target.value)}
                  placeholder="e.g., English, Somali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(value) => updateField("maritalStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Insurance Information
            </CardTitle>
            <CardDescription>PMI/MA and insurance details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pmiNumber">PMI/MA Number</Label>
                <Input
                  id="pmiNumber"
                  value={formData.pmiNumber}
                  onChange={(e) => updateField("pmiNumber", e.target.value)}
                  placeholder="PMI or MA number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceName">Insurance Name</Label>
                <Input
                  id="insuranceName"
                  value={formData.insuranceName}
                  onChange={(e) => updateField("insuranceName", e.target.value)}
                  placeholder="e.g., Blue Cross, UCare"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                <Input
                  id="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={(e) => updateField("insurancePolicyNumber", e.target.value)}
                  placeholder="Policy number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceGroupNumber">Group Number</Label>
                <Input
                  id="insuranceGroupNumber"
                  value={formData.insuranceGroupNumber}
                  onChange={(e) => updateField("insuranceGroupNumber", e.target.value)}
                  placeholder="Group number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurancePhone">Insurance Phone</Label>
                <Input
                  id="insurancePhone"
                  value={formData.insurancePhone}
                  onChange={(e) => updateField("insurancePhone", e.target.value)}
                  placeholder="(xxx) xxx-xxxx"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>People to contact in case of emergency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="font-medium text-slate-700 mb-3">Emergency Contact #1</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact1Name">Name</Label>
                  <Input
                    id="emergencyContact1Name"
                    value={formData.emergencyContact1Name}
                    onChange={(e) => updateField("emergencyContact1Name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact1Phone">Phone</Label>
                  <Input
                    id="emergencyContact1Phone"
                    value={formData.emergencyContact1Phone}
                    onChange={(e) => updateField("emergencyContact1Phone", e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact1Relationship">Relationship</Label>
                  <Input
                    id="emergencyContact1Relationship"
                    value={formData.emergencyContact1Relationship}
                    onChange={(e) => updateField("emergencyContact1Relationship", e.target.value)}
                    placeholder="e.g., Mother, Brother"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-3">Emergency Contact #2</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact2Name">Name</Label>
                  <Input
                    id="emergencyContact2Name"
                    value={formData.emergencyContact2Name}
                    onChange={(e) => updateField("emergencyContact2Name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact2Phone">Phone</Label>
                  <Input
                    id="emergencyContact2Phone"
                    value={formData.emergencyContact2Phone}
                    onChange={(e) => updateField("emergencyContact2Phone", e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact2Relationship">Relationship</Label>
                  <Input
                    id="emergencyContact2Relationship"
                    value={formData.emergencyContact2Relationship}
                    onChange={(e) => updateField("emergencyContact2Relationship", e.target.value)}
                    placeholder="e.g., Mother, Brother"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Providers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Medical Providers
            </CardTitle>
            <CardDescription>Healthcare providers and pharmacies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pharmacy */}
            <div>
              <p className="font-medium text-slate-700 mb-3">Pharmacy</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName">Name</Label>
                  <Input
                    id="pharmacyName"
                    value={formData.pharmacyName}
                    onChange={(e) => updateField("pharmacyName", e.target.value)}
                    placeholder="Pharmacy name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyPhone">Phone</Label>
                  <Input
                    id="pharmacyPhone"
                    value={formData.pharmacyPhone}
                    onChange={(e) => updateField("pharmacyPhone", e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyAddress">Address</Label>
                  <Input
                    id="pharmacyAddress"
                    value={formData.pharmacyAddress}
                    onChange={(e) => updateField("pharmacyAddress", e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Primary Care */}
            <div>
              <p className="font-medium text-slate-700 mb-3">Primary Care Physician</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primaryCareName">Name</Label>
                  <Input
                    id="primaryCareName"
                    value={formData.primaryCareName}
                    onChange={(e) => updateField("primaryCareName", e.target.value)}
                    placeholder="Doctor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCarePhone">Phone</Label>
                  <Input
                    id="primaryCarePhone"
                    value={formData.primaryCarePhone}
                    onChange={(e) => updateField("primaryCarePhone", e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCareAddress">Address</Label>
                  <Input
                    id="primaryCareAddress"
                    value={formData.primaryCareAddress}
                    onChange={(e) => updateField("primaryCareAddress", e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Psychiatrist */}
            <div>
              <p className="font-medium text-slate-700 mb-3">Psychiatrist</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="psychiatristName">Name</Label>
                  <Input
                    id="psychiatristName"
                    value={formData.psychiatristName}
                    onChange={(e) => updateField("psychiatristName", e.target.value)}
                    placeholder="Doctor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psychiatristPhone">Phone</Label>
                  <Input
                    id="psychiatristPhone"
                    value={formData.psychiatristPhone}
                    onChange={(e) => updateField("psychiatristPhone", e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psychiatristAddress">Address</Label>
                  <Input
                    id="psychiatristAddress"
                    value={formData.psychiatristAddress}
                    onChange={(e) => updateField("psychiatristAddress", e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Dental */}
            <div>
              <p className="font-medium text-slate-700 mb-3">Dental</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dentalName">Name</Label>
                  <Input
                    id="dentalName"
                    value={formData.dentalName}
                    onChange={(e) => updateField("dentalName", e.target.value)}
                    placeholder="Dentist name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentalPhone">Phone</Label>
                  <Input
                    id="dentalPhone"
                    value={formData.dentalPhone}
                    onChange={(e) => updateField("dentalPhone", e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentalAddress">Address</Label>
                  <Input
                    id="dentalAddress"
                    value={formData.dentalAddress}
                    onChange={(e) => updateField("dentalAddress", e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Vision */}
            <div>
              <p className="font-medium text-slate-700 mb-3">Vision/Eye Care</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="visionName">Name</Label>
                  <Input
                    id="visionName"
                    value={formData.visionName}
                    onChange={(e) => updateField("visionName", e.target.value)}
                    placeholder="Eye doctor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visionPhone">Phone</Label>
                  <Input
                    id="visionPhone"
                    value={formData.visionPhone}
                    onChange={(e) => updateField("visionPhone", e.target.value)}
                    placeholder="(xxx) xxx-xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visionAddress">Address</Label>
                  <Input
                    id="visionAddress"
                    value={formData.visionAddress}
                    onChange={(e) => updateField("visionAddress", e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Medical Information
            </CardTitle>
            <CardDescription>Allergies, diagnoses, and medications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                  placeholder="List any known allergies..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Textarea
                  id="dietaryRestrictions"
                  value={formData.dietaryRestrictions}
                  onChange={(e) => updateField("dietaryRestrictions", e.target.value)}
                  placeholder="List any dietary restrictions..."
                  rows={3}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="diagnoses">Diagnoses</Label>
                <Textarea
                  id="diagnoses"
                  value={formData.diagnoses}
                  onChange={(e) => updateField("diagnoses", e.target.value)}
                  placeholder="List diagnoses..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => updateField("medications", e.target.value)}
                  placeholder="List current medications..."
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
        )}

        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/clients/${id}/face-sheet`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Face Sheet
          </Button>
        </div>
      </form>
    </div>
  );
}
