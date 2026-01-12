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
import { ArrowLeft, Loader2, User, Shield, AlertCircle, Stethoscope, Heart, UserCheck, DollarSign, Users, Monitor, Plus, Trash2, Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { formatPhoneInput } from "@/lib/format-phone";

interface ClientProvider {
  id: string;
  providerType: string;
  providerName: string;
  organization: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

const PROVIDER_TYPES = [
  { value: "CHIROPRACTOR", label: "Chiropractor" },
  { value: "PHYSICAL_THERAPIST", label: "Physical Therapist" },
  { value: "OCCUPATIONAL_THERAPIST", label: "Occupational Therapist" },
  { value: "SPEECH_THERAPIST", label: "Speech Therapist" },
  { value: "PSYCHOLOGIST", label: "Psychologist/Counselor" },
  { value: "PODIATRIST", label: "Podiatrist" },
  { value: "NEUROLOGIST", label: "Neurologist" },
  { value: "CARDIOLOGIST", label: "Cardiologist" },
  { value: "DERMATOLOGIST", label: "Dermatologist" },
  { value: "AUDIOLOGIST", label: "Audiologist" },
  { value: "NUTRITIONIST", label: "Nutritionist/Dietitian" },
  { value: "PAIN_MANAGEMENT", label: "Pain Management" },
  { value: "WOUND_CARE", label: "Wound Care" },
  { value: "UROLOGIST", label: "Urologist" },
  { value: "GASTROENTEROLOGIST", label: "Gastroenterologist" },
  { value: "PULMONOLOGIST", label: "Pulmonologist" },
  { value: "ENDOCRINOLOGIST", label: "Endocrinologist" },
  { value: "ORTHOPEDIST", label: "Orthopedist" },
  { value: "OTHER", label: "Other Specialist" },
];

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
  // Guardian & Rep Payee
  hasGuardian: boolean;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianAddress: string | null;
  guardianRelationship: string | null;
  hasRepPayee: boolean;
  repPayeeName: string | null;
  repPayeePhone: string | null;
  repPayeeAddress: string | null;
  // Financial
  rentAmount: number | null;
  checkDeliveryLocation: string | null;
  // Internal - Staffing & Rate
  dailyRate: number | null;
  staffingRatio: string | null;
  individualHours: number | null;
  sharedStaffingHours: number | null;
  // Internal - MyChart
  myChartUsername: string | null;
  myChartPassword: string | null;
  myChartUrl: string | null;
  // Insurance
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
  pharmacyOrg: string | null;
  pharmacyPhone: string | null;
  pharmacyAddress: string | null;
  primaryCareName: string | null;
  primaryCareOrg: string | null;
  primaryCarePhone: string | null;
  primaryCareAddress: string | null;
  psychiatristName: string | null;
  psychiatristOrg: string | null;
  psychiatristPhone: string | null;
  psychiatristAddress: string | null;
  dentalName: string | null;
  dentalOrg: string | null;
  dentalPhone: string | null;
  dentalAddress: string | null;
  visionName: string | null;
  visionOrg: string | null;
  visionPhone: string | null;
  visionAddress: string | null;
  allergies: string | null;
  dietaryRestrictions: string | null;
  diagnoses: string | null;
  medications: string | null;
  // Case Managers
  mhCaseManagerName: string | null;
  mhCaseManagerOrg: string | null;
  mhCaseManagerEmail: string | null;
  mhCaseManagerPhone: string | null;
  cadiCaseManagerName: string | null;
  cadiCaseManagerOrg: string | null;
  cadiCaseManagerEmail: string | null;
  cadiCaseManagerPhone: string | null;
  legalRepName: string | null;
  legalRepPhone: string | null;
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
  const [additionalProviders, setAdditionalProviders] = useState<ClientProvider[]>([]);
  const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
  const [newProvider, setNewProvider] = useState({
    providerType: "",
    providerName: "",
    organization: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [formData, setFormData] = useState({
    // Personal Info
    middleName: "",
    ssn: "",
    gender: "",
    ethnicity: "",
    preferredLanguage: "",
    maritalStatus: "",
    // Guardian
    hasGuardian: false,
    guardianName: "",
    guardianPhone: "",
    guardianAddress: "",
    guardianRelationship: "",
    // Rep Payee
    hasRepPayee: false,
    repPayeeName: "",
    repPayeePhone: "",
    repPayeeAddress: "",
    // Financial
    rentAmount: "",
    checkDeliveryLocation: "",
    // Internal - Staffing & Rate
    dailyRate: "",
    staffingRatio: "",
    individualHours: "",
    sharedStaffingHours: "",
    // Internal - MyChart
    myChartUsername: "",
    myChartPassword: "",
    myChartUrl: "",
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
    pharmacyOrg: "",
    pharmacyPhone: "",
    pharmacyAddress: "",
    primaryCareName: "",
    primaryCareOrg: "",
    primaryCarePhone: "",
    primaryCareAddress: "",
    psychiatristName: "",
    psychiatristOrg: "",
    psychiatristPhone: "",
    psychiatristAddress: "",
    dentalName: "",
    dentalOrg: "",
    dentalPhone: "",
    dentalAddress: "",
    visionName: "",
    visionOrg: "",
    visionPhone: "",
    visionAddress: "",
    // Medical Info
    allergies: "",
    dietaryRestrictions: "",
    diagnoses: "",
    medications: "",
    // Case Managers
    mhCaseManagerName: "",
    mhCaseManagerOrg: "",
    mhCaseManagerEmail: "",
    mhCaseManagerPhone: "",
    cadiCaseManagerName: "",
    cadiCaseManagerOrg: "",
    cadiCaseManagerEmail: "",
    cadiCaseManagerPhone: "",
    legalRepName: "",
    legalRepPhone: "",
  });

  useEffect(() => {
    fetchClient();
    fetchAdditionalProviders();
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
          // Guardian
          hasGuardian: data.client.hasGuardian || false,
          guardianName: data.client.guardianName || "",
          guardianPhone: data.client.guardianPhone || "",
          guardianAddress: data.client.guardianAddress || "",
          guardianRelationship: data.client.guardianRelationship || "",
          // Rep Payee
          hasRepPayee: data.client.hasRepPayee || false,
          repPayeeName: data.client.repPayeeName || "",
          repPayeePhone: data.client.repPayeePhone || "",
          repPayeeAddress: data.client.repPayeeAddress || "",
          // Financial
          rentAmount: data.client.rentAmount ? String(data.client.rentAmount) : "",
          checkDeliveryLocation: data.client.checkDeliveryLocation || "",
          // Internal - Staffing & Rate
          dailyRate: data.client.dailyRate ? String(data.client.dailyRate) : "",
          staffingRatio: data.client.staffingRatio || "",
          individualHours: data.client.individualHours ? String(data.client.individualHours) : "",
          sharedStaffingHours: data.client.sharedStaffingHours ? String(data.client.sharedStaffingHours) : "",
          // Internal - MyChart
          myChartUsername: data.client.myChartUsername || "",
          myChartPassword: data.client.myChartPassword || "",
          myChartUrl: data.client.myChartUrl || "",
          // Insurance
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
          pharmacyOrg: data.client.pharmacyOrg || "",
          pharmacyPhone: data.client.pharmacyPhone || "",
          pharmacyAddress: data.client.pharmacyAddress || "",
          primaryCareName: data.client.primaryCareName || "",
          primaryCareOrg: data.client.primaryCareOrg || "",
          primaryCarePhone: data.client.primaryCarePhone || "",
          primaryCareAddress: data.client.primaryCareAddress || "",
          psychiatristName: data.client.psychiatristName || "",
          psychiatristOrg: data.client.psychiatristOrg || "",
          psychiatristPhone: data.client.psychiatristPhone || "",
          psychiatristAddress: data.client.psychiatristAddress || "",
          dentalName: data.client.dentalName || "",
          dentalOrg: data.client.dentalOrg || "",
          dentalPhone: data.client.dentalPhone || "",
          dentalAddress: data.client.dentalAddress || "",
          visionName: data.client.visionName || "",
          visionOrg: data.client.visionOrg || "",
          visionPhone: data.client.visionPhone || "",
          visionAddress: data.client.visionAddress || "",
          allergies: data.client.allergies || "",
          dietaryRestrictions: data.client.dietaryRestrictions || "",
          diagnoses: data.client.diagnoses || "",
          medications: data.client.medications || "",
          // Case Managers
          mhCaseManagerName: data.client.mhCaseManagerName || "",
          mhCaseManagerOrg: data.client.mhCaseManagerOrg || "",
          mhCaseManagerEmail: data.client.mhCaseManagerEmail || "",
          mhCaseManagerPhone: data.client.mhCaseManagerPhone || "",
          cadiCaseManagerName: data.client.cadiCaseManagerName || "",
          cadiCaseManagerOrg: data.client.cadiCaseManagerOrg || "",
          cadiCaseManagerEmail: data.client.cadiCaseManagerEmail || "",
          cadiCaseManagerPhone: data.client.cadiCaseManagerPhone || "",
          legalRepName: data.client.legalRepName || "",
          legalRepPhone: data.client.legalRepPhone || "",
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

  const fetchAdditionalProviders = async () => {
    try {
      const res = await fetch(`/api/clients/${id}/providers`);
      if (res.ok) {
        const data = await res.json();
        setAdditionalProviders(data);
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    }
  };

  const handleAddProvider = async () => {
    if (!newProvider.providerType || !newProvider.providerName) return;

    try {
      const res = await fetch(`/api/clients/${id}/providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProvider),
      });

      if (res.ok) {
        const provider = await res.json();
        setAdditionalProviders([...additionalProviders, provider]);
        setNewProvider({
          providerType: "",
          providerName: "",
          organization: "",
          phone: "",
          address: "",
          notes: "",
        });
        setShowAddProviderDialog(false);
      }
    } catch (error) {
      console.error("Failed to add provider:", error);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      const res = await fetch(`/api/clients/${id}/providers/${providerId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAdditionalProviders(additionalProviders.filter((p) => p.id !== providerId));
      }
    } catch (error) {
      console.error("Failed to delete provider:", error);
    }
  };

  const getProviderTypeLabel = (type: string) => {
    return PROVIDER_TYPES.find((pt) => pt.value === type)?.label || type;
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

        {/* Guardian & Rep Payee */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Guardian & Representative Payee
            </CardTitle>
            <CardDescription>Guardian and financial representative information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Guardian */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  id="hasGuardian"
                  checked={formData.hasGuardian}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, hasGuardian: checked === true }))
                  }
                />
                <Label htmlFor="hasGuardian" className="font-medium">
                  This client has a guardian
                </Label>
              </div>
              {formData.hasGuardian && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) => updateField("guardianName", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianRelationship">Relationship</Label>
                    <Input
                      id="guardianRelationship"
                      value={formData.guardianRelationship}
                      onChange={(e) => updateField("guardianRelationship", e.target.value)}
                      placeholder="e.g., Parent, Sibling"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Phone</Label>
                    <Input
                      id="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={(e) => updateField("guardianPhone", formatPhoneInput(e.target.value))}
                      placeholder="###-###-####"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianAddress">Address</Label>
                    <Input
                      id="guardianAddress"
                      value={formData.guardianAddress}
                      onChange={(e) => updateField("guardianAddress", e.target.value)}
                      placeholder="Full address"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rep Payee */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  id="hasRepPayee"
                  checked={formData.hasRepPayee}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, hasRepPayee: checked === true }))
                  }
                />
                <Label htmlFor="hasRepPayee" className="font-medium">
                  This client has a representative payee
                </Label>
              </div>
              {formData.hasRepPayee && (
                <div className="grid gap-4 sm:grid-cols-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="repPayeeName">Rep Payee Name</Label>
                    <Input
                      id="repPayeeName"
                      value={formData.repPayeeName}
                      onChange={(e) => updateField("repPayeeName", e.target.value)}
                      placeholder="Full name or organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repPayeePhone">Phone</Label>
                    <Input
                      id="repPayeePhone"
                      value={formData.repPayeePhone}
                      onChange={(e) => updateField("repPayeePhone", formatPhoneInput(e.target.value))}
                      placeholder="###-###-####"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repPayeeAddress">Address</Label>
                    <Input
                      id="repPayeeAddress"
                      value={formData.repPayeeAddress}
                      onChange={(e) => updateField("repPayeeAddress", e.target.value)}
                      placeholder="Full address"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial Information
            </CardTitle>
            <CardDescription>Rent and check delivery details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Monthly Rent Amount</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  step="0.01"
                  value={formData.rentAmount}
                  onChange={(e) => updateField("rentAmount", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkDeliveryLocation">Check Delivery Location</Label>
                <Select
                  value={formData.checkDeliveryLocation}
                  onValueChange={(value) => updateField("checkDeliveryLocation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICE">Main Office</SelectItem>
                    <SelectItem value="HOUSE">House/Residence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internal Information - Staffing & Rates */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Internal Information - Staffing & Rates
            </CardTitle>
            <CardDescription>Internal use only - not shown on external face sheet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate ($)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  value={formData.dailyRate}
                  onChange={(e) => updateField("dailyRate", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffingRatio">Staffing Ratio</Label>
                <Select
                  value={formData.staffingRatio}
                  onValueChange={(value) => updateField("staffingRatio", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3:1">3:1 (3 staff to 1 client)</SelectItem>
                    <SelectItem value="2:1">2:1 (2 staff to 1 client)</SelectItem>
                    <SelectItem value="1:1">1:1 (1 staff to 1 client)</SelectItem>
                    <SelectItem value="1:4">1:4 (1 staff to 4 clients)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="individualHours">Individual Hours</Label>
                <Input
                  id="individualHours"
                  type="number"
                  step="0.01"
                  value={formData.individualHours}
                  onChange={(e) => updateField("individualHours", e.target.value)}
                  placeholder="Hours per week"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sharedStaffingHours">Shared Staffing Hours</Label>
                <Input
                  id="sharedStaffingHours"
                  type="number"
                  step="0.01"
                  value={formData.sharedStaffingHours}
                  onChange={(e) => updateField("sharedStaffingHours", e.target.value)}
                  placeholder="Hours per week"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internal Information - MyChart Login */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-600" />
              Internal Information - MyChart Login
            </CardTitle>
            <CardDescription>Patient portal credentials for staff access to appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="myChartUsername">MyChart Username</Label>
                <Input
                  id="myChartUsername"
                  value={formData.myChartUsername}
                  onChange={(e) => updateField("myChartUsername", e.target.value)}
                  placeholder="Username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="myChartPassword">MyChart Password</Label>
                <Input
                  id="myChartPassword"
                  type="password"
                  value={formData.myChartPassword}
                  onChange={(e) => updateField("myChartPassword", e.target.value)}
                  placeholder="Password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="myChartUrl">MyChart Portal URL</Label>
                <Input
                  id="myChartUrl"
                  value={formData.myChartUrl}
                  onChange={(e) => updateField("myChartUrl", e.target.value)}
                  placeholder="https://mychart.example.com"
                />
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
                  onChange={(e) => updateField("insurancePhone", formatPhoneInput(e.target.value))}
                  placeholder="###-###-####"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Managers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Case Managers
            </CardTitle>
            <CardDescription>Mental health and CADI case manager information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mental Health Case Manager */}
            <div>
              <p className="font-medium text-slate-700 mb-3">Mental Health Case Manager</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="mhCaseManagerName">Name</Label>
                  <Input
                    id="mhCaseManagerName"
                    value={formData.mhCaseManagerName}
                    onChange={(e) => updateField("mhCaseManagerName", e.target.value)}
                    placeholder="Case Manager Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mhCaseManagerOrg">Organization</Label>
                  <Input
                    id="mhCaseManagerOrg"
                    value={formData.mhCaseManagerOrg}
                    onChange={(e) => updateField("mhCaseManagerOrg", e.target.value)}
                    placeholder="Agency or Organization"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mhCaseManagerEmail">Email</Label>
                  <Input
                    id="mhCaseManagerEmail"
                    type="email"
                    value={formData.mhCaseManagerEmail}
                    onChange={(e) => updateField("mhCaseManagerEmail", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mhCaseManagerPhone">Phone</Label>
                  <Input
                    id="mhCaseManagerPhone"
                    value={formData.mhCaseManagerPhone}
                    onChange={(e) => updateField("mhCaseManagerPhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
                  />
                </div>
              </div>
            </div>

            {/* CADI Case Manager */}
            <div>
              <p className="font-medium text-slate-700 mb-3">CADI Case Manager</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="cadiCaseManagerName">Name</Label>
                  <Input
                    id="cadiCaseManagerName"
                    value={formData.cadiCaseManagerName}
                    onChange={(e) => updateField("cadiCaseManagerName", e.target.value)}
                    placeholder="Case Manager Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadiCaseManagerOrg">Organization</Label>
                  <Input
                    id="cadiCaseManagerOrg"
                    value={formData.cadiCaseManagerOrg}
                    onChange={(e) => updateField("cadiCaseManagerOrg", e.target.value)}
                    placeholder="Agency or Organization"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadiCaseManagerEmail">Email</Label>
                  <Input
                    id="cadiCaseManagerEmail"
                    type="email"
                    value={formData.cadiCaseManagerEmail}
                    onChange={(e) => updateField("cadiCaseManagerEmail", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cadiCaseManagerPhone">Phone</Label>
                  <Input
                    id="cadiCaseManagerPhone"
                    value={formData.cadiCaseManagerPhone}
                    onChange={(e) => updateField("cadiCaseManagerPhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
                  />
                </div>
              </div>
            </div>

            {/* Legal Representative */}
            <div>
              <p className="font-medium text-slate-700 mb-3">Legal Representative</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalRepName">Name</Label>
                  <Input
                    id="legalRepName"
                    value={formData.legalRepName}
                    onChange={(e) => updateField("legalRepName", e.target.value)}
                    placeholder="Legal Representative Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalRepPhone">Phone</Label>
                  <Input
                    id="legalRepPhone"
                    value={formData.legalRepPhone}
                    onChange={(e) => updateField("legalRepPhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
                  />
                </div>
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
                    onChange={(e) => updateField("emergencyContact1Phone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
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
                    onChange={(e) => updateField("emergencyContact2Phone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName">Pharmacy Name</Label>
                  <Input
                    id="pharmacyName"
                    value={formData.pharmacyName}
                    onChange={(e) => updateField("pharmacyName", e.target.value)}
                    placeholder="e.g., CVS, Walgreens"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyOrg">Location/Branch</Label>
                  <Input
                    id="pharmacyOrg"
                    value={formData.pharmacyOrg}
                    onChange={(e) => updateField("pharmacyOrg", e.target.value)}
                    placeholder="e.g., Downtown location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyPhone">Phone</Label>
                  <Input
                    id="pharmacyPhone"
                    value={formData.pharmacyPhone}
                    onChange={(e) => updateField("pharmacyPhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryCareName">Doctor Name</Label>
                  <Input
                    id="primaryCareName"
                    value={formData.primaryCareName}
                    onChange={(e) => updateField("primaryCareName", e.target.value)}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCareOrg">Clinic/Organization</Label>
                  <Input
                    id="primaryCareOrg"
                    value={formData.primaryCareOrg}
                    onChange={(e) => updateField("primaryCareOrg", e.target.value)}
                    placeholder="e.g., Mayo Clinic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCarePhone">Phone</Label>
                  <Input
                    id="primaryCarePhone"
                    value={formData.primaryCarePhone}
                    onChange={(e) => updateField("primaryCarePhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="psychiatristName">Doctor Name</Label>
                  <Input
                    id="psychiatristName"
                    value={formData.psychiatristName}
                    onChange={(e) => updateField("psychiatristName", e.target.value)}
                    placeholder="Dr. Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psychiatristOrg">Clinic/Organization</Label>
                  <Input
                    id="psychiatristOrg"
                    value={formData.psychiatristOrg}
                    onChange={(e) => updateField("psychiatristOrg", e.target.value)}
                    placeholder="e.g., Mental Health Center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psychiatristPhone">Phone</Label>
                  <Input
                    id="psychiatristPhone"
                    value={formData.psychiatristPhone}
                    onChange={(e) => updateField("psychiatristPhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="dentalName">Dentist Name</Label>
                  <Input
                    id="dentalName"
                    value={formData.dentalName}
                    onChange={(e) => updateField("dentalName", e.target.value)}
                    placeholder="Dr. Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentalOrg">Clinic/Organization</Label>
                  <Input
                    id="dentalOrg"
                    value={formData.dentalOrg}
                    onChange={(e) => updateField("dentalOrg", e.target.value)}
                    placeholder="e.g., Family Dental Care"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentalPhone">Phone</Label>
                  <Input
                    id="dentalPhone"
                    value={formData.dentalPhone}
                    onChange={(e) => updateField("dentalPhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="visionName">Doctor Name</Label>
                  <Input
                    id="visionName"
                    value={formData.visionName}
                    onChange={(e) => updateField("visionName", e.target.value)}
                    placeholder="Dr. Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visionOrg">Clinic/Organization</Label>
                  <Input
                    id="visionOrg"
                    value={formData.visionOrg}
                    onChange={(e) => updateField("visionOrg", e.target.value)}
                    placeholder="e.g., Vision Center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visionPhone">Phone</Label>
                  <Input
                    id="visionPhone"
                    value={formData.visionPhone}
                    onChange={(e) => updateField("visionPhone", formatPhoneInput(e.target.value))}
                    placeholder="###-###-####"
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

            {/* Additional Providers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-slate-700">Additional Specialists</p>
                <Dialog open={showAddProviderDialog} onOpenChange={setShowAddProviderDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Provider</DialogTitle>
                      <DialogDescription>
                        Add a new healthcare provider for this client.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Provider Type</Label>
                        <Select
                          value={newProvider.providerType}
                          onValueChange={(value) =>
                            setNewProvider({ ...newProvider, providerType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROVIDER_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Provider Name</Label>
                        <Input
                          value={newProvider.providerName}
                          onChange={(e) =>
                            setNewProvider({ ...newProvider, providerName: e.target.value })
                          }
                          placeholder="Dr. Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Organization/Clinic</Label>
                        <Input
                          value={newProvider.organization}
                          onChange={(e) =>
                            setNewProvider({ ...newProvider, organization: e.target.value })
                          }
                          placeholder="Clinic name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={newProvider.phone}
                          onChange={(e) =>
                            setNewProvider({ ...newProvider, phone: e.target.value })
                          }
                          placeholder="###-###-####"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={newProvider.address}
                          onChange={(e) =>
                            setNewProvider({ ...newProvider, address: e.target.value })
                          }
                          placeholder="Full address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={newProvider.notes}
                          onChange={(e) =>
                            setNewProvider({ ...newProvider, notes: e.target.value })
                          }
                          placeholder="Any additional notes..."
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddProviderDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddProvider}
                        disabled={!newProvider.providerType || !newProvider.providerName}
                      >
                        Add Provider
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {additionalProviders.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  No additional providers added yet. Click "Add Provider" to add specialists.
                </p>
              ) : (
                <div className="space-y-3">
                  {additionalProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="border rounded-lg p-4 bg-slate-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {getProviderTypeLabel(provider.providerType)}
                            </span>
                          </div>
                          <p className="font-medium text-slate-900">
                            {provider.providerName}
                            {provider.organization && (
                              <span className="text-slate-500 font-normal">
                                {" "}- {provider.organization}
                              </span>
                            )}
                          </p>
                          {provider.phone && (
                            <p className="text-sm text-slate-600">{provider.phone}</p>
                          )}
                          {provider.address && (
                            <p className="text-sm text-slate-500">{provider.address}</p>
                          )}
                          {provider.notes && (
                            <p className="text-sm text-slate-500 mt-1 italic">{provider.notes}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
