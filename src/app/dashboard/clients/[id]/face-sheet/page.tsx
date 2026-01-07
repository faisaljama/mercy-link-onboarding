import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Home,
  Phone,
  Shield,
  Heart,
  Stethoscope,
  Pill,
  Eye,
  Activity,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

async function getClient(id: string, houseIds: string[]) {
  const client = await prisma.client.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: true,
    },
  });

  return client;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

function ContactCard({
  title,
  icon: Icon,
  name,
  phone,
  address,
}: {
  title: string;
  icon: React.ElementType;
  name: string | null | undefined;
  phone: string | null | undefined;
  address?: string | null | undefined;
}) {
  if (!name && !phone && !address) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-700">{title}</span>
        </div>
        <p className="text-sm text-slate-400">Not on file</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-slate-700">{title}</span>
      </div>
      {name && <p className="text-sm font-medium text-slate-900">{name}</p>}
      {phone && (
        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
          <Phone className="h-3 w-3" />
          {phone}
        </p>
      )}
      {address && <p className="text-sm text-slate-500 mt-1">{address}</p>}
    </div>
  );
}

export default async function FaceSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const client = await getClient(id, houseIds);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header - hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/dashboard/clients/${client.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Client
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/clients/${client.id}/face-sheet/edit`}>
            <Button variant="outline">Edit Face Sheet</Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Face Sheet Content */}
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
        {/* Header Section */}
        <div className="text-center border-b pb-4 print:pb-2">
          <h1 className="text-2xl font-bold text-slate-900 print:text-xl">MERCY LINK MN, LLC</h1>
          <p className="text-slate-500">Client Face Sheet</p>
        </div>

        {/* Client Name & Status */}
        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {client.photoUrl ? (
                  <img
                    src={client.photoUrl}
                    alt={`${client.firstName} ${client.lastName}`}
                    className="h-16 w-16 rounded-full object-cover border-2 border-blue-100"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 print:bg-slate-100">
                    <User className="h-8 w-8 text-blue-600 print:text-slate-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {client.firstName} {client.middleName || ""} {client.lastName}
                  </h2>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <Home className="h-4 w-4" />
                    <span>{client.house.name}</span>
                    <span className="mx-1">|</span>
                    <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Waiver Type</p>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {client.waiverType || "N/A"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <InfoRow label="Date of Birth" value={format(client.dob, "MMMM d, yyyy")} />
                <InfoRow label="SSN (Last 4)" value={client.ssn ? `XXX-XX-${client.ssn}` : null} />
                <InfoRow label="Gender" value={client.gender} />
                <InfoRow label="Ethnicity" value={client.ethnicity} />
              </div>
              <div>
                <InfoRow label="Preferred Language" value={client.preferredLanguage} />
                <InfoRow label="Marital Status" value={client.maritalStatus} />
                <InfoRow label="Admission Date" value={format(client.admissionDate, "MMMM d, yyyy")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Residence Information */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="h-5 w-5 text-blue-600" />
              Residence Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <InfoRow label="House Name" value={client.house.name} />
                <InfoRow label="Address" value={client.house.address} />
              </div>
              <div>
                <InfoRow label="County" value={client.house.county} />
                <InfoRow label="License Number" value={client.house.licenseNumber} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              Insurance Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <InfoRow label="PMI/MA Number" value={client.pmiNumber} />
                <InfoRow label="Insurance Name" value={client.insuranceName} />
                <InfoRow label="Policy Number" value={client.insurancePolicyNumber} />
              </div>
              <div>
                <InfoRow label="Group Number" value={client.insuranceGroupNumber} />
                <InfoRow label="Insurance Phone" value={client.insurancePhone} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg print:bg-slate-50">
                <p className="font-medium text-slate-700 mb-2">Emergency Contact #1</p>
                {client.emergencyContact1Name ? (
                  <>
                    <p className="text-sm font-medium text-slate-900">{client.emergencyContact1Name}</p>
                    <p className="text-sm text-slate-600">{client.emergencyContact1Relationship}</p>
                    {client.emergencyContact1Phone && (
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {client.emergencyContact1Phone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Not on file</p>
                )}
              </div>
              <div className="p-4 bg-red-50 rounded-lg print:bg-slate-50">
                <p className="font-medium text-slate-700 mb-2">Emergency Contact #2</p>
                {client.emergencyContact2Name ? (
                  <>
                    <p className="text-sm font-medium text-slate-900">{client.emergencyContact2Name}</p>
                    <p className="text-sm text-slate-600">{client.emergencyContact2Relationship}</p>
                    {client.emergencyContact2Phone && (
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {client.emergencyContact2Phone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Not on file</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Management */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-600" />
              Case Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700 mb-2">Mental Health Case Manager</p>
                {client.mhCaseManagerName ? (
                  <>
                    <p className="text-sm font-medium text-slate-900">{client.mhCaseManagerName}</p>
                    {client.mhCaseManagerEmail && (
                      <p className="text-sm text-slate-600 mt-1">{client.mhCaseManagerEmail}</p>
                    )}
                    {client.mhCaseManagerPhone && (
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {client.mhCaseManagerPhone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Not assigned</p>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700 mb-2">CADI Case Manager</p>
                {client.cadiCaseManagerName ? (
                  <>
                    <p className="text-sm font-medium text-slate-900">{client.cadiCaseManagerName}</p>
                    {client.cadiCaseManagerEmail && (
                      <p className="text-sm text-slate-600 mt-1">{client.cadiCaseManagerEmail}</p>
                    )}
                    {client.cadiCaseManagerPhone && (
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {client.cadiCaseManagerPhone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Not assigned</p>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700 mb-2">Legal Representative</p>
                {client.legalRepName ? (
                  <>
                    <p className="text-sm font-medium text-slate-900">{client.legalRepName}</p>
                    {client.legalRepPhone && (
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {client.legalRepPhone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Not assigned</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Providers */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Medical Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ContactCard
                title="Pharmacy"
                icon={Pill}
                name={client.pharmacyName}
                phone={client.pharmacyPhone}
                address={client.pharmacyAddress}
              />
              <ContactCard
                title="Primary Care"
                icon={Stethoscope}
                name={client.primaryCareName}
                phone={client.primaryCarePhone}
                address={client.primaryCareAddress}
              />
              <ContactCard
                title="Psychiatrist"
                icon={Heart}
                name={client.psychiatristName}
                phone={client.psychiatristPhone}
                address={client.psychiatristAddress}
              />
              <ContactCard
                title="Dental"
                icon={Activity}
                name={client.dentalName}
                phone={client.dentalPhone}
                address={client.dentalAddress}
              />
              <ContactCard
                title="Vision"
                icon={Eye}
                name={client.visionName}
                phone={client.visionPhone}
                address={client.visionAddress}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-red-600" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Allergies</p>
                <div className="p-3 bg-red-50 rounded-lg min-h-[60px] print:bg-slate-50">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {client.allergies || "None documented"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Dietary Restrictions</p>
                <div className="p-3 bg-orange-50 rounded-lg min-h-[60px] print:bg-slate-50">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {client.dietaryRestrictions || "None documented"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Diagnoses</p>
                <div className="p-3 bg-blue-50 rounded-lg min-h-[60px] print:bg-slate-50">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {client.diagnoses || "None documented"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Current Medications</p>
                <div className="p-3 bg-purple-50 rounded-lg min-h-[60px] print:bg-slate-50">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {client.medications || "None documented"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t print:pt-2">
          <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p>This document contains confidential information protected under HIPAA and Minnesota Statutes Chapter 245D</p>
        </div>
      </div>
    </div>
  );
}
