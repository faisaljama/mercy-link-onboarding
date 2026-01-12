"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MobileSignaturePad } from "@/components/signature-pad";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, FileText, Loader2 } from "lucide-react";

interface CorrectiveAction {
  id: string;
  violationDate: string;
  incidentDescription: string;
  pointsAssigned: number;
  pointsAdjusted: number | null;
  disciplineLevel: string;
  correctiveExpectations: string | null;
  consequencesText: string | null;
  status: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
  };
  house: {
    name: string;
  } | null;
  violationCategory: {
    categoryName: string;
    severityLevel: string;
  };
  issuedBy: {
    name: string;
  };
  signatures: {
    signerType: string;
    signedAt: string;
    signer: { name: string };
  }[];
}

interface PointsInfo {
  currentPoints: number;
  disciplineLevel: string;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "MINOR": return "bg-blue-100 text-blue-800";
    case "MODERATE": return "bg-yellow-100 text-yellow-800";
    case "SERIOUS": return "bg-orange-100 text-orange-800";
    case "CRITICAL": return "bg-red-100 text-red-800";
    case "IMMEDIATE_TERMINATION": return "bg-red-600 text-white";
    default: return "bg-slate-100 text-slate-800";
  }
}

function getDisciplineLevelText(level: string) {
  const levels: Record<string, string> = {
    COACHING: "Coaching",
    VERBAL_WARNING: "Verbal Warning",
    WRITTEN_WARNING: "Written Warning",
    FINAL_WARNING: "Final Warning",
    PIP: "Performance Improvement Plan",
    TERMINATION: "Termination Review",
  };
  return levels[level] || level;
}

export default function SignCorrectiveActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [action, setAction] = useState<CorrectiveAction | null>(null);
  const [pointsInfo, setPointsInfo] = useState<PointsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [comments, setComments] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [actionRes, pointsRes] = await Promise.all([
          fetch(`/api/corrective-actions/${id}`),
          fetch(`/api/corrective-actions/${id}`).then(r => r.json()).then(data =>
            fetch(`/api/employees/${data.action?.employeeId}/points`)
          ),
        ]);

        if (!actionRes.ok) {
          throw new Error("Failed to load corrective action");
        }

        const actionData = await actionRes.json();
        setAction(actionData.action);

        if (pointsRes.ok) {
          const pointsData = await pointsRes.json();
          setPointsInfo(pointsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    if (!signatureData || !acknowledged) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/corrective-actions/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerType: "EMPLOYEE",
          signatureData,
          comments: comments || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit signature");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/discipline/my-record");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !action) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Signature Submitted</h2>
            <p className="text-slate-600">
              Your acknowledgment has been recorded. Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!action) return null;

  const alreadySigned = action.signatures.some((s) => s.signerType === "EMPLOYEE");
  const points = action.pointsAdjusted ?? action.pointsAssigned;
  const expectations = action.correctiveExpectations
    ? JSON.parse(action.correctiveExpectations)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Corrective Action Notice</CardTitle>
                <CardDescription>
                  Please review and sign below
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Standing */}
        {pointsInfo && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Your Current Standing</span>
                  <span className="font-medium">
                    {pointsInfo.currentPoints} / 18 points
                  </span>
                </div>
                <Progress
                  value={(pointsInfo.currentPoints / 18) * 100}
                  className="h-3"
                />
                <p className="text-xs text-slate-500">
                  Level: {getDisciplineLevelText(pointsInfo.disciplineLevel)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Violation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium">
                  {format(new Date(action.violationDate), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Location</p>
                <p className="font-medium">{action.house?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-500">Category</p>
                <p className="font-medium">{action.violationCategory.categoryName}</p>
              </div>
              <div>
                <p className="text-slate-500">Points</p>
                <p className="font-medium">{points} points</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Badge className={getSeverityColor(action.violationCategory.severityLevel)}>
                {action.violationCategory.severityLevel.replace("_", " ")}
              </Badge>
              <Badge variant="outline">
                {getDisciplineLevelText(action.disciplineLevel)}
              </Badge>
            </div>

            <div>
              <p className="text-slate-500 text-sm mb-1">Description</p>
              <p className="text-sm bg-slate-50 p-3 rounded-lg">
                {action.incidentDescription}
              </p>
            </div>

            {expectations.length > 0 && (
              <div>
                <p className="text-slate-500 text-sm mb-2">Expectations for Improvement</p>
                <ul className="text-sm space-y-1">
                  {expectations.map((exp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {action.consequencesText && (
              <div>
                <p className="text-slate-500 text-sm mb-1">Consequences</p>
                <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">
                  {action.consequencesText}
                </p>
              </div>
            )}

            <div className="text-xs text-slate-400 pt-2 border-t">
              Issued by: {action.issuedBy.name}
            </div>
          </CardContent>
        </Card>

        {/* Signature Section */}
        {alreadySigned ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium">Already Signed</p>
              <p className="text-sm text-slate-500">
                Signed on {format(new Date(action.signatures.find(s => s.signerType === "EMPLOYEE")!.signedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Comments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Comments (Optional)</CardTitle>
                <CardDescription>
                  Add any comments or concerns about this corrective action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter your comments here..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Acknowledgment */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acknowledge"
                    checked={acknowledged}
                    onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                  />
                  <label htmlFor="acknowledge" className="text-sm leading-relaxed">
                    I acknowledge that I have received and reviewed this corrective action
                    notice. My signature indicates that I have been made aware of the
                    concerns and expectations. It does not necessarily indicate agreement
                    with all statements.
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Signature Pad */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Signature</CardTitle>
                <CardDescription>
                  Sign using your finger or stylus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MobileSignaturePad
                  onSignatureChange={setSignatureData}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
              <div className="max-w-2xl mx-auto">
                {error && (
                  <p className="text-red-600 text-sm mb-2 text-center">{error}</p>
                )}
                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleSubmit}
                  disabled={!signatureData || !acknowledged || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Signature"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
