import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  DollarSign,
  Home,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { EditAgreementForm } from "./edit-agreement-form";
import { DeleteAgreementButton } from "./delete-agreement-button";

async function getAgreement(id: string, houseIds: string[]) {
  const agreement = await prisma.serviceAgreement.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      house: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return agreement;
}

function getStatusBadge(status: string, endDate: Date) {
  const today = new Date();
  const daysUntilEnd = differenceInDays(new Date(endDate), today);

  if (status === "EXPIRED") {
    return (
      <Badge className="bg-slate-100 text-slate-800">
        <Clock className="mr-1 h-3 w-3" />
        Expired
      </Badge>
    );
  }

  if (status === "TERMINATED") {
    return (
      <Badge className="bg-red-100 text-red-800">
        Terminated
      </Badge>
    );
  }

  if (status === "PENDING") {
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Clock className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    );
  }

  // Active - check if expiring soon
  if (daysUntilEnd <= 45 && daysUntilEnd >= 0) {
    return (
      <Badge className="bg-orange-100 text-orange-800">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Expires in {daysUntilEnd} days
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      Active
    </Badge>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  CRS: "CRS - Community Residential Setting",
  ICS: "ICS - In-Home Family Child Care",
  IHS_WITH_TRAINING: "IHS with Training",
  IHS_WITHOUT_TRAINING: "IHS without Training",
  NIGHT_SUPERVISION: "Night Supervision",
  HOMEMAKING: "Homemaking",
  EA_24_HOUR: "EA 24-Hour",
};

export default async function AgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const agreement = await getAgreement(id, houseIds);

  if (!agreement) {
    notFound();
  }

  const dailyRate = Number(agreement.dailyRate);
  const monthlyRate = dailyRate * 30;
  const yearlyRate = dailyRate * 365;
  const daysUntilEnd = differenceInDays(new Date(agreement.endDate), new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Service Agreement
          </h1>
          <p className="text-slate-500">
            {agreement.client.firstName} {agreement.client.lastName} - {agreement.house.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(agreement.status, agreement.endDate)}
          {session.role === "ADMIN" && (
            <DeleteAgreementButton agreementId={agreement.id} />
          )}
        </div>
      </div>

      {/* Warning Banner for Expiring Soon */}
      {agreement.status === "ACTIVE" && daysUntilEnd <= 45 && daysUntilEnd >= 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Agreement Expiring Soon
                </p>
                <p className="text-sm text-orange-700">
                  This service agreement will expire in {daysUntilEnd} days on{" "}
                  {format(new Date(agreement.endDate), "MMMM d, yyyy")}.
                  Please renew or update as needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rate Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Rate Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-slate-600">Daily Rate</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(dailyRate)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-slate-600">Monthly (30 days)</span>
              <span className="font-medium">{formatCurrency(monthlyRate)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Yearly (365 days)</span>
              <span className="font-medium">{formatCurrency(yearlyRate)}</span>
            </div>
            {agreement.units && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-slate-600">Units</span>
                <span className="font-medium">{Number(agreement.units)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agreement Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Agreement Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agreement.agreementNumber && (
              <div>
                <p className="text-sm text-slate-500">Agreement Number</p>
                <p className="font-medium">{agreement.agreementNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Service Type</p>
              <p className="font-medium">
                {SERVICE_TYPE_LABELS[agreement.serviceType] || agreement.serviceType}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Start Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {format(new Date(agreement.startDate), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">End Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {format(new Date(agreement.endDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client & House */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client & House
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Client</p>
              <Link
                href={`/dashboard/clients/${agreement.client.id}`}
                className="font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                {agreement.client.firstName} {agreement.client.lastName}
              </Link>
            </div>
            <div>
              <p className="text-sm text-slate-500">House</p>
              <Link
                href={`/dashboard/houses/${agreement.house.id}`}
                className="font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                {agreement.house.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created By</p>
              <p className="font-medium">{agreement.createdBy.name}</p>
              <p className="text-xs text-slate-400">
                {format(new Date(agreement.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document */}
      {agreement.documentUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">{agreement.documentName || "Service Agreement"}</p>
                  <p className="text-sm text-slate-500">Service Agreement Document</p>
                </div>
              </div>
              <a
                href={agreement.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {agreement.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">{agreement.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Agreement</CardTitle>
          <CardDescription>
            Update the service agreement details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditAgreementForm agreement={agreement} />
        </CardContent>
      </Card>
    </div>
  );
}
