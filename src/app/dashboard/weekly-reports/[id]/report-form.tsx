"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Home,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Star,
  FileText,
  Users,
  Pill,
  Wrench,
  AlertTriangle,
  CalendarCheck,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Report {
  id: string;
  houseId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  status: string;
  overallWeekRating: number | null;
  staffingCoverage: string | null;
  staffPerformance: string | null;
  residentWellbeing: string | null;
  medicationIssues: string | null;
  maintenanceConcerns: string | null;
  incidentsSummary: string | null;
  appointmentsCompleted: string | null;
  upcomingConcerns: string | null;
  suppliesNeeded: string | null;
  trainingNeeds: string | null;
  additionalNotes: string | null;
  scheduleCreated: boolean;
  scheduleSubmitted: boolean;
  houseLeadMeeting: boolean;
  receiptsUploaded: boolean;
  notionUpdated: boolean;
  activitiesReviewed: boolean;
  dmComments: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  submittedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  reviewedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  house: {
    id: string;
    name: string;
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700">
          <Clock className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Send className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Reviewed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ReportForm({ report, isAdmin }: { report: Report; isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(report);
  const [dmComments, setDmComments] = useState(report.dmComments || "");

  const isReadOnly = report.status !== "DRAFT";
  const canSubmit = report.status === "DRAFT";
  const canReview = report.status === "SUBMITTED" && isAdmin;

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/weekly-reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to save report");
        return;
      }

      router.refresh();
      alert("Report saved successfully");
    } catch {
      alert("Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit this report? You cannot edit it after submission.")) {
      return;
    }

    setLoading(true);
    try {
      // First save any changes
      await fetch(`/api/weekly-reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Then submit
      const response = await fetch(`/api/weekly-reports/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to submit report");
        return;
      }

      router.refresh();
      alert("Report submitted successfully");
    } catch {
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/weekly-reports/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", dmComments }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to review report");
        return;
      }

      router.refresh();
      alert("Report reviewed successfully");
    } catch {
      alert("Failed to review report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/weekly-reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly DC Report</h1>
            <div className="flex items-center gap-3 text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                {report.house.name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(report.weekStartDate), "MMM d")} -{" "}
                {format(new Date(report.weekEndDate), "MMM d, yyyy")}
              </div>
              {getStatusBadge(report.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Submit to DM
              </Button>
            </>
          )}
          {canReview && (
            <Button onClick={handleReview} disabled={loading} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Reviewed
            </Button>
          )}
        </div>
      </div>

      {/* Overall Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Overall Week Rating
          </CardTitle>
          <CardDescription>How would you rate this week overall?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleChange("overallWeekRating", star)}
                className={`p-1 ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    (formData.overallWeekRating || 0) >= star
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200"
                  }`}
                />
              </button>
            ))}
            <span className="ml-4 text-sm text-slate-500">
              {formData.overallWeekRating
                ? `${formData.overallWeekRating}/5`
                : "Not rated"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
            Weekly Tasks Completed
          </CardTitle>
          <CardDescription>Check off the tasks you completed this week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "scheduleCreated", label: "Staff schedule created for next week" },
              { key: "scheduleSubmitted", label: "Schedule submitted to DM" },
              { key: "houseLeadMeeting", label: "Met with house lead/staff" },
              { key: "receiptsUploaded", label: "Receipts uploaded and organized" },
              { key: "notionUpdated", label: "Notion/documentation updated" },
              { key: "activitiesReviewed", label: "Weekly activities reviewed" },
            ].map((task) => (
              <div key={task.key} className="flex items-start space-x-2">
                <Checkbox
                  id={task.key}
                  checked={(formData as unknown as Record<string, boolean>)[task.key]}
                  onCheckedChange={(checked) => handleChange(task.key, checked)}
                  disabled={isReadOnly}
                />
                <Label
                  htmlFor={task.key}
                  className="text-sm font-normal leading-tight cursor-pointer"
                >
                  {task.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            Weekly Summary
          </CardTitle>
          <CardDescription>Provide updates for each area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Staffing Coverage
              </Label>
              <Textarea
                placeholder="How was staffing coverage this week?"
                value={formData.staffingCoverage || ""}
                onChange={(e) => handleChange("staffingCoverage", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                Staff Performance
              </Label>
              <Textarea
                placeholder="Any staff performance highlights or concerns?"
                value={formData.staffPerformance || ""}
                onChange={(e) => handleChange("staffPerformance", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Resident Wellbeing
              </Label>
              <Textarea
                placeholder="How are residents doing overall?"
                value={formData.residentWellbeing || ""}
                onChange={(e) => handleChange("residentWellbeing", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-red-500" />
                Medication Issues
              </Label>
              <Textarea
                placeholder="Any medication issues or discrepancies?"
                value={formData.medicationIssues || ""}
                onChange={(e) => handleChange("medicationIssues", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-slate-500" />
                Maintenance Concerns
              </Label>
              <Textarea
                placeholder="Any maintenance or facility concerns?"
                value={formData.maintenanceConcerns || ""}
                onChange={(e) => handleChange("maintenanceConcerns", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Incidents Summary
              </Label>
              <Textarea
                placeholder="Summary of any incidents this week"
                value={formData.incidentsSummary || ""}
                onChange={(e) => handleChange("incidentsSummary", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-blue-500" />
                Appointments Completed
              </Label>
              <Textarea
                placeholder="Appointments completed this week"
                value={formData.appointmentsCompleted || ""}
                onChange={(e) => handleChange("appointmentsCompleted", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Upcoming Concerns
              </Label>
              <Textarea
                placeholder="Any concerns for next week?"
                value={formData.upcomingConcerns || ""}
                onChange={(e) => handleChange("upcomingConcerns", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Supplies Needed</Label>
              <Textarea
                placeholder="Supplies or resources needed"
                value={formData.suppliesNeeded || ""}
                onChange={(e) => handleChange("suppliesNeeded", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Training Needs</Label>
              <Textarea
                placeholder="Any staff training needs identified?"
                value={formData.trainingNeeds || ""}
                onChange={(e) => handleChange("trainingNeeds", e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any other notes or comments for the DM"
              value={formData.additionalNotes || ""}
              onChange={(e) => handleChange("additionalNotes", e.target.value)}
              disabled={isReadOnly}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* DM Comments (for review) */}
      {(canReview || report.dmComments) && (
        <Card className={canReview ? "border-green-200 bg-green-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              DM Comments
            </CardTitle>
            <CardDescription>
              {canReview
                ? "Add your comments before marking as reviewed"
                : "Feedback from the Director of Management"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add comments or feedback..."
              value={dmComments}
              onChange={(e) => setDmComments(e.target.value)}
              disabled={!canReview}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Submission Info */}
      {report.status !== "DRAFT" && (
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-slate-600">
              {report.submittedBy && (
                <div>
                  <span className="font-medium">Submitted by:</span> {report.submittedBy.name}
                </div>
              )}
              {report.reviewedBy && (
                <div>
                  <span className="font-medium">Reviewed by:</span> {report.reviewedBy.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canSubmit && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            Submit to DM
          </Button>
        </div>
      )}

      {canReview && (
        <div className="flex justify-end">
          <Button onClick={handleReview} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Reviewed
          </Button>
        </div>
      )}
    </div>
  );
}
