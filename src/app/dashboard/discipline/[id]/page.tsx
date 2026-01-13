import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  Download,
  Pencil,
  XCircle,
} from "lucide-react";
import { VoidActionButton } from "./void-action-button";
import { SignActionButton } from "./sign-action-button";

async function getCorrectiveAction(id: string) {
  const action = await prisma.correctiveAction.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          hireDate: true,
        },
      },
      issuedBy: {
        select: { id: true, name: true, email: true },
      },
      house: {
        select: { id: true, name: true },
      },
      violationCategory: true,
      signatures: {
        include: {
          signer: { select: { name: true, email: true } },
        },
        orderBy: { signedAt: "asc" },
      },
      voidedBy: {
        select: { name: true },
      },
    },
  });

  return action;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING_SIGNATURE":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" /> Pending Signature
        </Badge>
      );
    case "ACKNOWLEDGED":
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" /> Acknowledged
        </Badge>
      );
    case "DISPUTED":
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3 mr-1" /> Disputed
        </Badge>
      );
    case "VOIDED":
      return (
        <Badge className="bg-slate-100 text-slate-800">
          <Ban className="h-3 w-3 mr-1" /> Voided
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function getSeverityBadge(severity: string) {
  const colors: Record<string, string> = {
    MINOR: "border-blue-300 text-blue-700",
    MODERATE: "border-yellow-300 text-yellow-700",
    SERIOUS: "border-orange-300 text-orange-700",
    CRITICAL: "border-red-300 text-red-700",
    IMMEDIATE_TERMINATION: "bg-red-600 text-white border-red-600",
  };
  const labels: Record<string, string> = {
    MINOR: "Minor (1-2 pts)",
    MODERATE: "Moderate (3-4 pts)",
    SERIOUS: "Serious (5-6 pts)",
    CRITICAL: "Critical (8-10 pts)",
    IMMEDIATE_TERMINATION: "Immediate Review",
  };
  return (
    <Badge variant="outline" className={colors[severity] || ""}>
      {labels[severity] || severity}
    </Badge>
  );
}

function getDisciplineLevelBadge(level: string) {
  const labels: Record<string, string> = {
    COACHING: "Coaching",
    VERBAL_WARNING: "Verbal Warning",
    WRITTEN_WARNING: "Written Warning",
    FINAL_WARNING: "Final Warning",
    PIP: "Performance Improvement Plan",
    TERMINATION: "Termination Review",
  };
  const colors: Record<string, string> = {
    COACHING: "bg-blue-50 text-blue-700 border-blue-200",
    VERBAL_WARNING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    WRITTEN_WARNING: "bg-orange-50 text-orange-700 border-orange-200",
    FINAL_WARNING: "bg-red-50 text-red-700 border-red-200",
    PIP: "bg-purple-50 text-purple-700 border-purple-200",
    TERMINATION: "bg-red-100 text-red-800 border-red-300",
  };
  return (
    <Badge variant="outline" className={colors[level] || ""}>
      {labels[level] || level}
    </Badge>
  );
}

function getSignerTypeLabel(type: string) {
  const labels: Record<string, string> = {
    EMPLOYEE: "Employee",
    SUPERVISOR: "Supervisor",
    WITNESS: "Witness",
    HR: "HR Representative",
  };
  return labels[type] || type;
}

export default async function CorrectiveActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const action = await getCorrectiveAction(id);

  if (!action) {
    notFound();
  }

  const canVoid = session.role === "ADMIN" || session.role === "HR";
  const canEdit = (session.role === "ADMIN" || session.role === "HR" || action.issuedById === session.id)
    && action.status === "PENDING_SIGNATURE";
  const isVoided = action.status === "VOIDED";

  const expectations = action.correctiveExpectations
    ? JSON.parse(action.correctiveExpectations)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/discipline">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Corrective Action
              </h1>
              {getStatusBadge(action.status)}
            </div>
            <p className="text-slate-500">
              {action.violationCategory.categoryName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/discipline/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/api/corrective-actions/${id}/pdf`} target="_blank">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Link>
          </Button>
          {canVoid && !isVoided && (
            <VoidActionButton actionId={id} />
          )}
        </div>
      </div>

      {/* Voided Banner */}
      {isVoided && (
        <Card className="bg-slate-100 border-slate-300">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-700">
                  This corrective action has been voided
                </p>
                {action.voidReason && (
                  <p className="text-sm text-slate-500">
                    Reason: {action.voidReason}
                  </p>
                )}
                {action.voidedBy && action.voidedAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Voided by {action.voidedBy.name} on{" "}
                    {format(new Date(action.voidedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <Link
                    href={`/dashboard/employees/${action.employee.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {action.employee.lastName}, {action.employee.firstName}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Position</p>
                  <p className="font-medium">{action.employee.position}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Hire Date</p>
                  <p className="font-medium">
                    {format(new Date(action.employee.hireDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Site</p>
                  <p className="font-medium">{action.house?.name || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Violation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Violation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Violation Date</p>
                  <p className="font-medium">
                    {format(new Date(action.violationDate), "EEEE, MMMM d, yyyy")}
                  </p>
                  {action.violationTime && (
                    <p className="text-sm text-slate-600">{action.violationTime}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium">{action.violationCategory.categoryName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {getSeverityBadge(action.violationCategory.severityLevel)}
                {getDisciplineLevelBadge(action.disciplineLevel)}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-slate-500 mb-2">Incident Description</p>
                <div className="bg-slate-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {action.incidentDescription}
                </div>
              </div>

              {action.mitigatingCircumstances && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Mitigating Circumstances</p>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm">
                    {action.mitigatingCircumstances}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points & Discipline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Points & Disciplinary Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">
                    {action.pointsAdjusted ?? action.pointsAssigned}
                  </p>
                  <p className="text-sm text-slate-500">Points Assigned</p>
                  {action.pointsAdjusted !== null && action.pointsAdjusted !== action.pointsAssigned && (
                    <p className="text-xs text-slate-400">
                      (Original: {action.pointsAssigned})
                    </p>
                  )}
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-lg font-medium text-slate-900">
                    {action.violationCategory.severityLevel.replace("_", " ")}
                  </p>
                  <p className="text-sm text-slate-500">Severity Level</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-lg font-medium text-slate-900">
                    {action.disciplineLevel.replace("_", " ")}
                  </p>
                  <p className="text-sm text-slate-500">Discipline Level</p>
                </div>
              </div>

              {action.adjustmentReason && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Point Adjustment Reason</p>
                  <p className="text-sm bg-yellow-50 p-3 rounded-lg">
                    {action.adjustmentReason}
                  </p>
                </div>
              )}

              {expectations.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Expectations for Improvement</p>
                  <ul className="space-y-2">
                    {expectations.map((exp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {action.consequencesText && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Consequences</p>
                  <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800">
                    {action.consequencesText}
                  </div>
                </div>
              )}

              {action.pipScheduled && action.pipDate && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-medium text-purple-800">
                    Performance Improvement Plan Scheduled
                  </p>
                  <p className="text-sm text-purple-600">
                    Meeting: {format(new Date(action.pipDate), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signatures</CardTitle>
              <CardDescription>
                {action.signatures.length === 0
                  ? "No signatures yet"
                  : `${action.signatures.length} signature(s) collected`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {action.signatures.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  Waiting for signatures
                </div>
              ) : (
                action.signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-800">
                        {getSignerTypeLabel(sig.signerType)}
                      </span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-green-700">{sig.signer.name}</p>
                    <p className="text-xs text-green-600">
                      {format(new Date(sig.signedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                ))
              )}

              {/* Supervisor/Witness/HR can add their signature */}
              {!isVoided && (
                <SignActionButton
                  actionId={id}
                  existingSignerTypes={action.signatures.map(s => s.signerType)}
                  userRole={session.role}
                />
              )}

              {/* Link to send to employee for signature */}
              {action.status === "PENDING_SIGNATURE" && !isVoided && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/discipline/sign/${id}`}>
                    Employee Sign Link
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Employee Comments */}
          {action.employeeComments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employee Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {action.employeeComments}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Issued By</p>
                <p className="font-medium">{action.issuedBy.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Created</p>
                <p className="font-medium">
                  {format(new Date(action.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(action.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Record ID</p>
                <p className="font-mono text-xs text-slate-400">{action.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
