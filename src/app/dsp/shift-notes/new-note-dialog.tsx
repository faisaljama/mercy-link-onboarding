"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  StickyNote,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Mic,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NewNoteDialogProps {
  residents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    onePageProfile?: { preferredName: string | null } | null;
    notePrompt?: { promptText: string } | null;
  }>;
  houseId: string;
  shiftDate: string;
  shiftType: string;
  preselectedClientId?: string;
  staff: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
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
  staff,
  trigger,
}: NewNoteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [staffId, setStaffId] = useState("");
  const [noteType, setNoteType] = useState("progress_note");
  const [content, setContent] = useState("");
  const [step, setStep] = useState<"info" | "write" | "sign">("info");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setClientId(preselectedClientId || "");
      setStaffId("");
      setNoteType("progress_note");
      setContent("");
      setError("");
      setCopied(false);
      setStep("info");
    }
  }, [isOpen, preselectedClientId]);

  const selectedResident = residents.find((r) => r.id === clientId);
  const promptText = selectedResident?.notePrompt?.promptText;
  const displayName = selectedResident
    ? selectedResident.onePageProfile?.preferredName || selectedResident.firstName
    : "";

  const handleCopyPrompt = async () => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = async () => {
    if (!clientId) {
      setError("Please select a resident");
      return;
    }
    if (!staffId) {
      setError("Please select who is writing this note");
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
          submittedById: staffId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit note");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit note");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-blue-500" />
            Write Shift Note
            {selectedResident && (
              <span className="text-slate-500 font-normal">
                for {displayName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Use ChatGPT voice-to-text for faster documentation
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2 border-b">
          <button
            onClick={() => setStep("info")}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded ${
              step === "info" ? "bg-blue-100 text-blue-700 font-medium" : "text-slate-400"
            }`}
          >
            <Mic className="h-4 w-4" />
            1. Info
          </button>
          <div className="w-6 h-px bg-slate-200" />
          <button
            onClick={() => clientId && staffId && setStep("write")}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded ${
              step === "write" ? "bg-blue-100 text-blue-700 font-medium" : "text-slate-400"
            }`}
            disabled={!clientId || !staffId}
          >
            <StickyNote className="h-4 w-4" />
            2. Write
          </button>
          <div className="w-6 h-px bg-slate-200" />
          <button
            onClick={() => content.length >= 20 && setStep("sign")}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded ${
              step === "sign" ? "bg-blue-100 text-blue-700 font-medium" : "text-slate-400"
            }`}
            disabled={content.length < 20}
          >
            <CheckCircle2 className="h-4 w-4" />
            3. Confirm
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* Step 1: Info & Prompt */}
          {step === "info" && (
            <>
              {/* Resident Selection */}
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((resident) => (
                      <SelectItem key={resident.id} value={resident.id}>
                        {resident.onePageProfile?.preferredName || resident.firstName}{" "}
                        {resident.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Selection */}
              <div className="space-y-2">
                <Label>Who is writing this note?</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.length > 0 ? (
                      staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-slate-500 text-center">
                        No staff assigned to this house
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {staff.length === 0 && (
                  <p className="text-xs text-orange-600">
                    No staff are assigned to this house. Contact your supervisor.
                  </p>
                )}
              </div>

              {/* Note Type */}
              <div className="space-y-2">
                <Label>Note Type</Label>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ChatGPT Prompt Section */}
              {clientId && promptText && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        ChatGPT Prompt for {displayName}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 flex-shrink-0"
                      onClick={handleCopyPrompt}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-white p-3 rounded border text-sm text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {promptText}
                  </div>
                  <a
                    href="https://chat.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
                  >
                    Open ChatGPT
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {clientId && !promptText && (
                <div className="p-4 bg-slate-50 border rounded-lg">
                  <p className="text-sm text-slate-600">
                    No ChatGPT prompt set for {displayName}. You can still write a note manually.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep("write")}
                  disabled={!clientId || !staffId}
                >
                  Continue to Write Note
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Write Note */}
          {step === "write" && (
            <>
              {/* ChatGPT Prompt Section - TOP */}
              {promptText && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        ChatGPT Prompt for {displayName}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 flex-shrink-0"
                      onClick={handleCopyPrompt}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-white p-3 rounded border text-sm text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {promptText}
                  </div>

                  {/* Instructions for staff */}
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">How to use:</p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Copy the prompt above</li>
                      <li>Open ChatGPT and paste the prompt</li>
                      <li>Use voice-to-text to speak your observations</li>
                      <li>Copy ChatGPT&apos;s response and paste it below</li>
                    </ol>
                  </div>

                  <a
                    href="https://chat.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
                  >
                    Open ChatGPT
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {!promptText && (
                <div className="p-4 bg-slate-50 border rounded-lg">
                  <p className="text-sm text-slate-600">
                    No ChatGPT prompt has been set for {displayName}. Please write your note manually below.
                  </p>
                </div>
              )}

              {noteType === "incident_report" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Incident Reports</p>
                    <p>
                      For serious incidents, also notify your supervisor immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Note Content Section - BOTTOM */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  {promptText ? "Paste ChatGPT Response Here" : `Note Content for ${displayName}`}
                </Label>
                <Textarea
                  id="content"
                  placeholder={
                    promptText
                      ? `Paste ChatGPT's response here...`
                      : `Describe ${displayName}'s mood, activities, meals, interactions, and any notable observations during your shift...`
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

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep("info")}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep("sign")}
                  disabled={content.length < 20}
                >
                  Continue to Confirm
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Confirm */}
          {step === "sign" && (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Ready to Submit</h4>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Please review your note below before submitting.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Note Preview</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {content}
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> By submitting, you confirm that this is an accurate record of your observations for {displayName} during the {shiftType.replace("_", " ")} shift on {shiftDate}.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={() => setStep("write")}>
                  Back to Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm & Submit Note
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Show error in earlier steps */}
          {error && step !== "sign" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
