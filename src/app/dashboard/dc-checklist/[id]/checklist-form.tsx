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
  Eye,
  MapPin,
  FileText,
  Pill,
  Users,
  ClipboardCheck,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Checklist {
  id: string;
  houseId: string;
  date: Date;
  visitType: string;
  notes: string | null;
  followUpItems: string | null;
  issuesIdentified: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  house: {
    id: string;
    name: string;
  };
  // Remote tasks
  remoteLogNotesReviewed: boolean;
  remoteGmailChecked: boolean;
  remoteAppointmentsReviewed: boolean;
  remoteCalendarUpdated: boolean;
  remoteScheduleVerified: boolean;
  remoteClockInReviewed: boolean;
  remoteControlledSubstances: boolean;
  remoteMedsAdministered: boolean;
  remoteProgressNotesReviewed: boolean;
  remotePrnDocumented: boolean;
  remoteIncidentReportsReviewed: boolean;
  remoteAppointmentsFollowUp: boolean;
  remoteStaffTrainingChecked: boolean;
  remoteEveningMedsReviewed: boolean;
  remoteNarcoticCountsVerified: boolean;
  // Onsite tasks
  onsiteClockedIn: boolean;
  onsiteHandoffReviewed: boolean;
  onsiteVerbalHandoff: boolean;
  onsiteNarcoticCount: boolean;
  onsitePettyCashCount: boolean;
  onsiteMedQuantitiesReviewed: boolean;
  onsitePrnMedsChecked: boolean;
  onsiteOverflowBinsChecked: boolean;
  onsitePharmacyDeliveryReviewed: boolean;
  onsiteMedStorageChecked: boolean;
  onsiteGlucometerSupplies: boolean;
  onsiteStaffInteractions: boolean;
  onsiteRoomsClean: boolean;
  onsiteDietaryFollowed: boolean;
  onsiteActivitiesObserved: boolean;
  onsiteResidentSpoken: boolean;
  onsiteReceiptBinderReviewed: boolean;
  onsiteResidentBindersReviewed: boolean;
  onsiteAfterVisitSummaries: boolean;
  onsiteOutcomeTracker: boolean;
  onsiteFireDrillBinder: boolean;
  onsiteCommonAreasCleaned: boolean;
  onsiteFoodLabeled: boolean;
  onsiteSuppliesStocked: boolean;
  onsiteBathroomsCleaned: boolean;
  onsiteGarbageChecked: boolean;
  onsiteIpadCharged: boolean;
  onsiteDoorsSecure: boolean;
  onsiteWaterSoftener: boolean;
  onsiteFurnaceFilter: boolean;
  onsiteExteriorChecked: boolean;
  onsiteStaffCoaching: boolean;
}

const REMOTE_TASKS = [
  { key: "remoteLogNotesReviewed", label: "Review log notes in Therap/documentation system" },
  { key: "remoteGmailChecked", label: "Check house Gmail for updates and communications" },
  { key: "remoteAppointmentsReviewed", label: "Review upcoming appointments in calendar" },
  { key: "remoteCalendarUpdated", label: "Update house calendar with new appointments" },
  { key: "remoteScheduleVerified", label: "Verify staff schedule coverage for the day" },
  { key: "remoteClockInReviewed", label: "Review staff clock-in times for accuracy" },
  { key: "remoteControlledSubstances", label: "Check controlled substance documentation" },
  { key: "remoteMedsAdministered", label: "Verify all medications administered on time" },
  { key: "remoteProgressNotesReviewed", label: "Review progress notes for completeness" },
  { key: "remotePrnDocumented", label: "Check PRN medication documentation" },
  { key: "remoteIncidentReportsReviewed", label: "Review any new incident reports" },
  { key: "remoteAppointmentsFollowUp", label: "Follow up on appointment outcomes" },
  { key: "remoteStaffTrainingChecked", label: "Check staff training compliance status" },
  { key: "remoteEveningMedsReviewed", label: "Review evening medication administration" },
  { key: "remoteNarcoticCountsVerified", label: "Verify narcotic counts are documented" },
];

const ONSITE_TASKS_ARRIVAL = [
  { key: "onsiteClockedIn", label: "Clocked in at house location" },
  { key: "onsiteHandoffReviewed", label: "Reviewed written handoff notes" },
  { key: "onsiteVerbalHandoff", label: "Received verbal handoff from staff" },
];

const ONSITE_TASKS_MEDS = [
  { key: "onsiteNarcoticCount", label: "Completed narcotic count with staff" },
  { key: "onsitePettyCashCount", label: "Verified petty cash count" },
  { key: "onsiteMedQuantitiesReviewed", label: "Reviewed medication quantities" },
  { key: "onsitePrnMedsChecked", label: "Checked PRN medications supply" },
  { key: "onsiteOverflowBinsChecked", label: "Checked medication overflow bins" },
  { key: "onsitePharmacyDeliveryReviewed", label: "Reviewed pharmacy delivery/orders" },
  { key: "onsiteMedStorageChecked", label: "Verified proper medication storage" },
  { key: "onsiteGlucometerSupplies", label: "Checked glucometer and supplies" },
];

const ONSITE_TASKS_STAFF = [
  { key: "onsiteStaffInteractions", label: "Observed staff-resident interactions" },
  { key: "onsiteStaffCoaching", label: "Provided staff coaching/feedback" },
];

const ONSITE_TASKS_RESIDENTS = [
  { key: "onsiteRoomsClean", label: "Checked that resident rooms are clean" },
  { key: "onsiteDietaryFollowed", label: "Verified dietary restrictions followed" },
  { key: "onsiteActivitiesObserved", label: "Observed resident activities" },
  { key: "onsiteResidentSpoken", label: "Spoke with each resident" },
];

const ONSITE_TASKS_DOCUMENTATION = [
  { key: "onsiteReceiptBinderReviewed", label: "Reviewed receipt binder" },
  { key: "onsiteResidentBindersReviewed", label: "Reviewed resident binders" },
  { key: "onsiteAfterVisitSummaries", label: "Checked after visit summaries" },
  { key: "onsiteOutcomeTracker", label: "Reviewed outcome tracker" },
  { key: "onsiteFireDrillBinder", label: "Checked fire drill binder" },
];

const ONSITE_TASKS_FACILITY = [
  { key: "onsiteCommonAreasCleaned", label: "Common areas cleaned and organized" },
  { key: "onsiteFoodLabeled", label: "Food properly labeled and stored" },
  { key: "onsiteSuppliesStocked", label: "Supplies adequately stocked" },
  { key: "onsiteBathroomsCleaned", label: "Bathrooms clean and stocked" },
  { key: "onsiteGarbageChecked", label: "Garbage emptied and managed" },
  { key: "onsiteIpadCharged", label: "iPad/devices charged" },
  { key: "onsiteDoorsSecure", label: "Doors and windows secure" },
  { key: "onsiteWaterSoftener", label: "Water softener checked" },
  { key: "onsiteFurnaceFilter", label: "Furnace filter status checked" },
  { key: "onsiteExteriorChecked", label: "Exterior of house checked" },
];

export function ChecklistForm({ checklist }: { checklist: Checklist }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(checklist);

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleTextChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dc-checklist/${checklist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        alert("Failed to save checklist");
        return;
      }

      router.refresh();
      alert("Checklist saved successfully");
    } catch {
      alert("Failed to save checklist");
    } finally {
      setLoading(false);
    }
  };

  const renderCheckboxGroup = (
    tasks: { key: string; label: string }[],
    title: string,
    icon: React.ReactNode
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {title}
      </div>
      <div className="grid gap-2 pl-6">
        {tasks.map((task) => (
          <div key={task.key} className="flex items-start space-x-2">
            <Checkbox
              id={task.key}
              checked={(formData as unknown as Record<string, boolean>)[task.key]}
              onCheckedChange={(checked) => handleCheckboxChange(task.key, checked as boolean)}
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dc-checklist">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">DC Daily Checklist</h1>
            <div className="flex items-center gap-3 text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                {checklist.house.name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(checklist.date), "MMMM d, yyyy")}
              </div>
              {checklist.visitType === "REMOTE" ? (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  <Eye className="h-3 w-3 mr-1" />
                  Remote Oversight
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <MapPin className="h-3 w-3 mr-1" />
                  Onsite Visit
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Checklist"}
        </Button>
      </div>

      {checklist.visitType === "REMOTE" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Remote Daily Oversight Tasks
            </CardTitle>
            <CardDescription>
              Complete these tasks during your remote oversight shift
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderCheckboxGroup(
              REMOTE_TASKS,
              "Daily Remote Oversight",
              <ClipboardCheck className="h-4 w-4 text-purple-600" />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Onsite Visit Tasks
              </CardTitle>
              <CardDescription>
                Complete these tasks during your onsite visit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {renderCheckboxGroup(
                ONSITE_TASKS_ARRIVAL,
                "Arrival & Handoff",
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
              )}

              {renderCheckboxGroup(
                ONSITE_TASKS_MEDS,
                "Medication Management",
                <Pill className="h-4 w-4 text-red-600" />
              )}

              {renderCheckboxGroup(
                ONSITE_TASKS_STAFF,
                "Staff Oversight",
                <Users className="h-4 w-4 text-amber-600" />
              )}

              {renderCheckboxGroup(
                ONSITE_TASKS_RESIDENTS,
                "Resident Care",
                <Users className="h-4 w-4 text-green-600" />
              )}

              {renderCheckboxGroup(
                ONSITE_TASKS_DOCUMENTATION,
                "Documentation Review",
                <FileText className="h-4 w-4 text-purple-600" />
              )}

              {renderCheckboxGroup(
                ONSITE_TASKS_FACILITY,
                "Facility Inspection",
                <Wrench className="h-4 w-4 text-slate-600" />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            Notes & Follow-Up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">General Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter any general notes about this visit..."
              value={formData.notes || ""}
              onChange={(e) => handleTextChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followUpItems" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Follow-Up Items
            </Label>
            <Textarea
              id="followUpItems"
              placeholder="List any items that need follow-up..."
              value={formData.followUpItems || ""}
              onChange={(e) => handleTextChange("followUpItems", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuesIdentified" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Issues Identified
            </Label>
            <Textarea
              id="issuesIdentified"
              placeholder="Document any issues or concerns identified..."
              value={formData.issuesIdentified || ""}
              onChange={(e) => handleTextChange("issuesIdentified", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Checklist"}
        </Button>
      </div>
    </div>
  );
}
