import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, subDays, differenceInDays } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingDown,
  User,
  Calendar,
} from "lucide-react";

async function getEmployeeByEmail(email: string) {
  return prisma.employee.findFirst({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      hireDate: true,
    },
  });
}

async function getDisciplineRecord(employeeId: string) {
  const ninetyDaysAgo = subDays(new Date(), 90);

  // Get all non-voided actions from the last 90 days
  const recentActions = await prisma.correctiveAction.findMany({
    where: {
      employeeId,
      violationDate: { gte: ninetyDaysAgo },
      status: { not: "VOIDED" },
    },
    include: {
      violationCategory: true,
      house: { select: { name: true } },
      signatures: { select: { signerType: true } },
    },
    orderBy: { violationDate: "desc" },
  });

  // Calculate current points
  const currentPoints = recentActions.reduce((total, action) => {
    return total + (action.pointsAdjusted ?? action.pointsAssigned);
  }, 0);

  // Get pending signature actions
  const pendingSignature = recentActions.filter(
    (a) => a.status === "PENDING_SIGNATURE" && !a.signatures.some(s => s.signerType === "EMPLOYEE")
  );

  // Calculate points expiring soon (next 14 days)
  const fourteenDaysFromNow = subDays(new Date(), 76); // 90 - 14 = 76 days ago
  const expiringPoints = recentActions
    .filter((a) => new Date(a.violationDate) <= fourteenDaysFromNow)
    .map((a) => ({
      points: a.pointsAdjusted ?? a.pointsAssigned,
      expiresOn: subDays(new Date(a.violationDate), -90),
      category: a.violationCategory.categoryName,
    }));

  // Get all-time history (last 20 actions)
  const allActions = await prisma.correctiveAction.findMany({
    where: { employeeId },
    include: {
      violationCategory: true,
      house: { select: { name: true } },
      signatures: { select: { signerType: true, signedAt: true } },
    },
    orderBy: { violationDate: "desc" },
    take: 20,
  });

  // Get thresholds
  const thresholds = await prisma.disciplineThreshold.findMany({
    where: { isActive: true },
    orderBy: { pointMinimum: "asc" },
  });

  // Determine discipline level
  let disciplineLevel = "Good Standing";
  for (const threshold of thresholds) {
    if (currentPoints >= threshold.pointMinimum) {
      disciplineLevel = threshold.actionRequired;
    }
  }

  return {
    currentPoints,
    disciplineLevel,
    pendingSignature,
    expiringPoints,
    recentActions,
    allActions,
    thresholds,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING_SIGNATURE":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Signature</Badge>;
    case "ACKNOWLEDGED":
      return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>;
    case "DISPUTED":
      return <Badge className="bg-orange-100 text-orange-800">Disputed</Badge>;
    case "VOIDED":
      return <Badge className="bg-slate-100 text-slate-800">Voided</Badge>;
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
  return (
    <Badge variant="outline" className={colors[severity] || ""}>
      {severity.replace("_", " ")}
    </Badge>
  );
}

export default async function MyDisciplineRecordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const employee = await getEmployeeByEmail(session.email);

  if (!employee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Discipline Record</h1>
          <p className="text-slate-500">View your corrective action history</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">
              No Employee Record Found
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Your user account is not linked to an employee record. If you believe
              this is an error, please contact your supervisor or HR.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const record = await getDisciplineRecord(employee.id);
  const progressPercent = Math.min((record.currentPoints / 18) * 100, 100);
  const progressColor =
    record.currentPoints >= 14
      ? "bg-red-500"
      : record.currentPoints >= 10
      ? "bg-orange-500"
      : record.currentPoints >= 6
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Discipline Record</h1>
        <p className="text-slate-500">
          {employee.firstName} {employee.lastName} - {employee.position}
        </p>
      </div>

      {/* Pending Signatures Alert */}
      {record.pendingSignature.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">
                  Action Required: {record.pendingSignature.length} Pending Signature(s)
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You have corrective actions that require your acknowledgment.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {record.pendingSignature.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      asChild
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Link href={`/dashboard/discipline/sign/${action.id}`}>
                        Sign: {action.violationCategory.categoryName}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Standing */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Current Standing
            </CardTitle>
            <CardDescription>Rolling 90-day point total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold">{record.currentPoints}</span>
              <span className="text-slate-500">/ 18 points</span>
            </div>
            <div className="relative">
              <Progress value={progressPercent} className="h-4" />
              <div
                className={`absolute top-0 left-0 h-4 rounded-full ${progressColor}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span className="text-yellow-600">6 (Verbal)</span>
              <span className="text-orange-600">10 (Written)</span>
              <span className="text-red-600">14 (Final)</span>
              <span className="text-red-800">18</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm">
                <span className="text-slate-500">Current Level: </span>
                <span className="font-medium">{record.disciplineLevel}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Points Expiring Soon
            </CardTitle>
            <CardDescription>Within 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {record.expiringPoints.length === 0 ? (
              <p className="text-sm text-slate-500">No points expiring soon</p>
            ) : (
              <div className="space-y-2">
                {record.expiringPoints.map((exp, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm p-2 bg-green-50 rounded"
                  >
                    <span className="text-green-800">
                      -{exp.points} pts
                    </span>
                    <span className="text-green-600 text-xs">
                      {format(exp.expiresOn, "MMM d")}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-slate-400 mt-2">
                  Points expire 90 days after the violation date
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Corrective Actions</CardTitle>
          <CardDescription>Last 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          {record.recentActions.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-slate-500">No corrective actions in the last 90 days</p>
              <p className="text-sm text-slate-400">Keep up the great work!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {record.recentActions.map((action) => {
                const daysUntilExpiry = differenceInDays(
                  subDays(new Date(action.violationDate), -90),
                  new Date()
                );
                const employeeSigned = action.signatures.some(s => s.signerType === "EMPLOYEE");

                return (
                  <div
                    key={action.id}
                    className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {action.violationCategory.categoryName}
                          </span>
                          {getSeverityBadge(action.violationCategory.severityLevel)}
                          {getStatusBadge(action.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(action.violationDate), "MMM d, yyyy")}
                          </span>
                          {action.house && (
                            <span>{action.house.name}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {daysUntilExpiry > 0
                            ? `Points expire in ${daysUntilExpiry} days`
                            : "Points expired"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          {action.pointsAdjusted ?? action.pointsAssigned}
                        </span>
                        <span className="text-sm text-slate-500"> pts</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {!employeeSigned && action.status === "PENDING_SIGNATURE" ? (
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/discipline/sign/${action.id}`}>
                            Sign Now
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/discipline/${action.id}`}>
                            View Details
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All-Time History */}
      {record.allActions.length > record.recentActions.length && (
        <Card>
          <CardHeader>
            <CardTitle>Older History</CardTitle>
            <CardDescription>Actions older than 90 days (points expired)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {record.allActions
                .filter((a) => !record.recentActions.find((r) => r.id === a.id))
                .map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                  >
                    <div>
                      <span className="text-sm">
                        {action.violationCategory.categoryName}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {format(new Date(action.violationDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 line-through">
                        {action.pointsAdjusted ?? action.pointsAssigned} pts
                      </span>
                      {getStatusBadge(action.status)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discipline Thresholds Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Point Thresholds</CardTitle>
          <CardDescription>Progressive discipline levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {record.thresholds.map((threshold) => {
              const isCurrentLevel =
                record.currentPoints >= threshold.pointMinimum &&
                record.currentPoints <= threshold.pointMaximum;
              return (
                <div
                  key={threshold.id}
                  className={`p-3 rounded-lg border ${
                    isCurrentLevel
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200"
                  }`}
                >
                  <p className="font-medium text-sm">
                    {threshold.pointMinimum}-{threshold.pointMaximum} pts
                  </p>
                  <p className="text-xs text-slate-600">{threshold.actionRequired}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
