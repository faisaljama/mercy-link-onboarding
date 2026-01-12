"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { format, subDays, differenceInDays, addDays } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  XCircle,
  TrendingDown,
  Scale,
} from "lucide-react";

interface CorrectiveAction {
  id: string;
  violationDate: Date;
  violationTime: string | null;
  incidentDescription: string;
  pointsAssigned: number;
  pointsAdjusted: number | null;
  disciplineLevel: string;
  status: string;
  violationCategory: {
    categoryName: string;
    severityLevel: string;
  };
  house: { name: string } | null;
  issuedBy: { name: string };
  signatures: { signerType: string; signedAt: Date }[];
}

interface DisciplineStats {
  currentPoints: number;
  disciplineLevel: string;
  rollingCount: number;
  expiredCount: number;
  voidedCount: number;
  totalCount: number;
}

interface EmployeeDisciplineProps {
  employeeId: string;
  correctiveActions: CorrectiveAction[];
  stats: DisciplineStats;
}

function getSeverityBadge(severity: string) {
  const colors: Record<string, string> = {
    MINOR: "bg-blue-100 text-blue-700",
    MODERATE: "bg-yellow-100 text-yellow-700",
    SERIOUS: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
    IMMEDIATE_TERMINATION: "bg-red-600 text-white",
  };
  return (
    <Badge className={colors[severity] || "bg-slate-100"}>
      {severity.replace("_", " ")}
    </Badge>
  );
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

function isInRollingWindow(violationDate: Date): boolean {
  const ninetyDaysAgo = subDays(new Date(), 90);
  return new Date(violationDate) >= ninetyDaysAgo;
}

function getDaysUntilExpiry(violationDate: Date): number {
  const expiryDate = addDays(new Date(violationDate), 90);
  return differenceInDays(expiryDate, new Date());
}

export function EmployeeDiscipline({
  employeeId,
  correctiveActions,
  stats,
}: EmployeeDisciplineProps) {
  const progressPercent = Math.min((stats.currentPoints / 18) * 100, 100);

  // Separate actions into categories
  const rollingActions = correctiveActions.filter(
    (a) => a.status !== "VOIDED" && isInRollingWindow(a.violationDate)
  );
  const expiredActions = correctiveActions.filter(
    (a) => a.status !== "VOIDED" && !isInRollingWindow(a.violationDate)
  );
  const voidedActions = correctiveActions.filter((a) => a.status === "VOIDED");

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="p-4 bg-slate-50 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-slate-600" />
            <span className="font-medium">Current Standing</span>
          </div>
          <Link href="/dashboard/discipline/my-record">
            <Button variant="outline" size="sm">View Full Record</Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className={`font-bold ${
                stats.currentPoints >= 14 ? "text-red-600" :
                stats.currentPoints >= 10 ? "text-orange-600" :
                stats.currentPoints >= 6 ? "text-yellow-600" : "text-slate-700"
              }`}>
                {stats.currentPoints} points
              </span>
              <span className="text-slate-500">{stats.disciplineLevel}</span>
            </div>
            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                  stats.currentPoints >= 14 ? "bg-red-500" :
                  stats.currentPoints >= 10 ? "bg-orange-500" :
                  stats.currentPoints >= 6 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
              {/* Threshold markers */}
              <div className="absolute top-0 left-[33.3%] w-px h-full bg-slate-400 opacity-50" />
              <div className="absolute top-0 left-[55.5%] w-px h-full bg-slate-400 opacity-50" />
              <div className="absolute top-0 left-[77.7%] w-px h-full bg-slate-400 opacity-50" />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0</span>
              <span>6</span>
              <span>10</span>
              <span>14</span>
              <span>18</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Rolling: {stats.rollingCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-300 rounded-full" />
            <span>Expired: {stats.expiredCount}</span>
          </div>
          {stats.voidedCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-200 rounded-full border border-slate-300" />
              <span>Voided: {stats.voidedCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rolling (Active) Actions */}
      <div>
        <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          Active - Rolling 90-Day Window ({rollingActions.length})
        </h3>
        {rollingActions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
            <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-2" />
            <p>No active corrective actions</p>
            <p className="text-sm text-slate-400">Good standing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rollingActions.map((action) => {
              const daysUntilExpiry = getDaysUntilExpiry(action.violationDate);
              const points = action.pointsAdjusted ?? action.pointsAssigned;
              const employeeSigned = action.signatures.some(
                (s) => s.signerType === "EMPLOYEE"
              );

              return (
                <div
                  key={action.id}
                  className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">
                          {action.violationCategory.categoryName}
                        </span>
                        {getSeverityBadge(action.violationCategory.severityLevel)}
                        {getStatusBadge(action.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{format(new Date(action.violationDate), "MMM d, yyyy")}</span>
                        {action.house && <span>{action.house.name}</span>}
                        <span>Issued by: {action.issuedBy.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {daysUntilExpiry <= 14 && daysUntilExpiry > 0 && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Expires in {daysUntilExpiry} days
                          </Badge>
                        )}
                        {!employeeSigned && action.status === "PENDING_SIGNATURE" && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Awaiting employee signature
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold">{points}</span>
                      <span className="text-sm text-slate-500"> pts</span>
                      <div className="mt-2">
                        <Link href={`/dashboard/discipline/${action.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expired Actions */}
      {expiredActions.length > 0 && (
        <div>
          <Separator className="my-6" />
          <h3 className="font-medium text-slate-500 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 rounded-full" />
            Expired - Points No Longer Active ({expiredActions.length})
          </h3>
          <div className="space-y-2">
            {expiredActions.map((action) => {
              const points = action.pointsAdjusted ?? action.pointsAssigned;

              return (
                <div
                  key={action.id}
                  className="p-3 border rounded-lg bg-slate-50 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {action.violationCategory.categoryName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(action.violationDate), "MMM d, yyyy")}
                      </span>
                      {getStatusBadge(action.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400 line-through">
                        {points} pts
                      </span>
                      <Link href={`/dashboard/discipline/${action.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voided Actions */}
      {voidedActions.length > 0 && (
        <div>
          <Separator className="my-6" />
          <h3 className="font-medium text-slate-400 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Voided Actions ({voidedActions.length})
          </h3>
          <div className="space-y-2">
            {voidedActions.map((action) => (
              <div
                key={action.id}
                className="p-3 border rounded-lg bg-slate-50 opacity-40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm line-through">
                      {action.violationCategory.categoryName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(action.violationDate), "MMM d, yyyy")}
                    </span>
                    <Badge className="bg-slate-100 text-slate-500">Voided</Badge>
                  </div>
                  <Link href={`/dashboard/discipline/${action.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No history */}
      {correctiveActions.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p>No corrective action history</p>
          <p className="text-sm text-slate-400 mt-1">
            This employee has no recorded corrective actions
          </p>
        </div>
      )}
    </div>
  );
}
