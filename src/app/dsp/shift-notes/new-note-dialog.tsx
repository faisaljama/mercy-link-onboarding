"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, StickyNote, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewNoteDialogProps {
  residents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    onePageProfile?: { preferredName: string | null } | null;
  }>;
  houseId: string;
  shiftDate: string;
  shiftType: string;
  preselectedClientId?: string;
  trigger?: React.ReactNode;
}

const NOTE_TYPES = [
  { value: "progress_note", label: "Progress Note", description: "Daily activities and observations" },
  { value: "incident_report", label: "Incident Report", description: "Unusual events or concerns" },
  { value: "medication_note", label: "Medication Note", description: "Medication-related observations" },
  { value: "activity_note", label: "Activity Note", description: "Outings, recreation, or special activities" },
  { value: "communication_log", label: "Communication Log", description: "Communications with family, providers, etc." },
];

export function NewNoteDialog({
  residents,
  houseId,
  shiftDate,
  shiftType,
  preselectedClientId,
  trigger,
}: NewNoteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [noteType, setNoteType] = useState("progress_note");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!clientId) {
      setError("Please select a resident");
      return;
    }
    if (!content.trim()) {
      setError("Please enter note content");
      return;
    }
    if (content.trim().length < 20) {
      setError("Note content must be at least 20 characters");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/shift-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          houseId,
          noteType,
          shiftDate,
          shiftType,
          content: content.trim(),
          submittedById: "placeholder", // This would come from session in production
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit note");
      }

      // Reset form and close
      setContent("");
      setClientId(preselectedClientId || "");
      setNoteType("progress_note");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedResident = residents.find(r => r.id === clientId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Write Note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-blue-500" />
            Write Shift Note
          </DialogTitle>
          <DialogDescription>
            Document observations and activities for a resident during your shift.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resident Selection */}
          <div className="space-y-2">
            <Label htmlFor="resident">Resident</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resident" />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.onePageProfile?.preferredName || resident.firstName} {resident.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note Type */}
          <div className="space-y-2">
            <Label htmlFor="noteType">Note Type</Label>
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-slate-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Note Content
              {selectedResident && (
                <span className="text-slate-400 font-normal ml-2">
                  for {selectedResident.onePageProfile?.preferredName || selectedResident.firstName}
                </span>
              )}
            </Label>
            <Textarea
              id="content"
              placeholder={
                noteType === "progress_note"
                  ? "Describe the resident's mood, activities, meals, interactions, and any notable observations during your shift..."
                  : noteType === "incident_report"
                  ? "Describe the incident in detail: what happened, when, who was involved, and what actions were taken..."
                  : noteType === "medication_note"
                  ? "Document any medication-related observations, refusals, or concerns..."
                  : noteType === "activity_note"
                  ? "Describe the activity, who participated, how the resident engaged, and any notable moments..."
                  : "Document the communication: who was contacted, purpose, and outcome..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-slate-500 text-right">
              {content.length} characters {content.length < 20 && "(minimum 20)"}
            </p>
          </div>

          {noteType === "incident_report" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Incident Reports</p>
                <p>For serious incidents, please also notify your supervisor immediately and complete any required incident reporting forms.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
