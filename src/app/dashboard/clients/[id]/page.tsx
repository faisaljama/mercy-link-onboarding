import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PDFDownloadButton } from "@/components/pdf-download-button";
import {
  User,
  Home,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { MonthlySummaries } from "./monthly-summaries";
import { SupportPlans } from "./support-plans";
import { MeetingComplianceWrapper } from "./meeting-compliance-wrapper";

async function getClient(id: string, houseIds: string[]) {
  const client = await prisma.client.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      meetingCompliance: {
        orderBy: [{ year: "asc" }, { meetingType: "asc" }],
        include: {
          createdBy: { select: { id: true, name: true } },
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      },
    },
  });

  return client;
}

export default async function ClientDetailPage({
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

  // Calculate meeting compliance stats
  const totalMeetings = client.meetingCompliance.length;
  const totalDocuments = client.meetingCompliance.reduce((sum, m) => sum + m.documents.length, 0);

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

      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {client.photoUrl ? (
            <img
              src={client.photoUrl}
              alt={`${client.firstName} ${client.lastName}`}
              className="h-16 w-16 rounded-full object-cover border-2 border-blue-100"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <User className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {client.firstName} {client.lastName}
            </h1>
            <div className="flex items-center gap-2 text-slate-500">
              <Home className="h-4 w-4" />
              {client.house.name}
              <span className="mx-2">•</span>
              <Badge variant="outline">{client.waiverType || "N/A"}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <PDFDownloadButton
            endpoint={`/api/reports/client-compliance?clientId=${client.id}`}
            label="Compliance Report"
          />
          <Link href={`/dashboard/clients/${client.id}/face-sheet`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Face Sheet
            </Button>
          </Link>
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline">Edit Client</Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Meetings</p>
                <p className="text-2xl font-bold text-blue-600">{totalMeetings}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Documents Uploaded</p>
                <p className="text-2xl font-bold text-green-600">{totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Days Since Admission</p>
                <p className="text-2xl font-bold">
                  {differenceInDays(new Date(), client.admissionDate)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Date of Birth</p>
              <p className="font-medium">{format(client.dob, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Admission Date</p>
              <p className="font-medium">{format(client.admissionDate, "MMMM d, yyyy")}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Mental Health Case Manager</p>
              {client.mhCaseManagerName ? (
                <div className="space-y-1">
                  <p className="font-medium">{client.mhCaseManagerName}</p>
                  {client.mhCaseManagerEmail && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {client.mhCaseManagerEmail}
                    </p>
                  )}
                  {client.mhCaseManagerPhone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.mhCaseManagerPhone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">Not assigned</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">CADI Case Manager</p>
              {client.cadiCaseManagerName ? (
                <div className="space-y-1">
                  <p className="font-medium">{client.cadiCaseManagerName}</p>
                  {client.cadiCaseManagerEmail && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {client.cadiCaseManagerEmail}
                    </p>
                  )}
                  {client.cadiCaseManagerPhone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.cadiCaseManagerPhone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">Not assigned</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Legal Representative</p>
              {client.legalRepName ? (
                <div className="space-y-1">
                  <p className="font-medium">{client.legalRepName}</p>
                  {client.legalRepPhone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.legalRepPhone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">Not assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 245D Compliance Documents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>245D Compliance Documents</CardTitle>
            <CardDescription>
              Track required documents per Minnesota Statutes Chapter 245D
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MeetingComplianceWrapper
              clientId={client.id}
              clientName={`${client.firstName} ${client.lastName}`}
              houseName={client.house.name}
              admissionDate={client.admissionDate.toISOString()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summaries */}
      <MonthlySummaries clientId={client.id} />

      {/* Support Plans */}
      <SupportPlans clientId={client.id} />
    </div>
  );
}
