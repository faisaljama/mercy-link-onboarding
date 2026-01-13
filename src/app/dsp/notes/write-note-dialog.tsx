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
  StickyNote,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Mic,
  FileText,
  PenTool,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileSignaturePad } from "@/components/signature-pad";
import Link from "next/link";

interface WriteNoteDialogProps {
  resident: {
    id: string;
    firstName: string;
    lastName: string;
    preferredName: string | null;
    photoUrl: string | null;
    promptText: string | null;
    promptUpdatedAt: Date | null;
  };
  houseId: string;
  shiftDate: string;
  shiftType: string;
  staff: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  trigger?: React.ReactNode;
}

export function WriteNoteDialog({
  resident,
  houseId,
  shiftDate,
  shiftType,
  staff,
  trigger,
}: WriteNoteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [content, setContent] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [step, setStep] = useState<"prompt" | "write" | "sign">("prompt");

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep(resident.promptText ? "prompt" : "write");
      setContent("");
      setSignatureData(null);
      setStaffId("");
      setError("");
      setCopied(false);
    }
  }, [isOpen, resident.promptText]);

  const displayName = resident.preferredName || resident.firstName;

  const handleCopyPrompt = async () => {
    if (!resident.promptText) return;

    try {
      await navigator.clipboard.writeText(resident.promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = async () => {
    if (!staffId) {
      setError("Please select who is writing this note");
      return;
    }
    if (!content.trim()) {
      setError("Please enter the note content");
      return;
    }
    if (content.trim().length < 50) {
      setError("Note must be at least 50 characters for adequate documentation");
      return;
    }
    if (!signatureData) {
      setError("Please sign the note");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/shift-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: resident.id,
          houseId,
          noteType: "progress_note",
          shiftDate,
          shiftType,
          content: content.trim(),
          submittedById: staffId,
          signatureData,
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
            <StickyNote className="h-4 w-4" />
            Write Note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              {resident.photoUrl ? (
                <img
                  src={resident.photoUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-purple-600 font-medium text-sm">
                  {resident.firstName[0]}{resident.lastName[0]}
                </span>
              )}
            </div>
            <div>
              <span>Progress Note for {displayName}</span>
              <p className="text-sm font-normal text-slate-500">{resident.firstName} {resident.lastName}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Use ChatGPT voice-to-text to document {displayName}&apos;s day
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className={`flex items-center gap-1 text-sm ${step === "prompt" ? "text-blue-600 font-medium" : "text-slate-400"}`}>
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">1. Get Prompt</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className={`flex items-center gap-1 text-sm ${step === "write" ? "text-blue-600 font-medium" : "text-slate-400"}`}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">2. Write Note</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className={`flex items-center gap-1 text-sm ${step === "sign" ? "text-blue-600 font-medium" : "text-slate-400"}`}>
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">3. Sign</span>
          </div>
        </div>

        <div className="space-y-4 py-4">
          {/* Step 1: Prompt */}
          {step === "prompt" && (
            <>
              {resident.promptText ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">ChatGPT Prompt for {displayName}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
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
                    <div className="bg-white p-3 rounded border text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {resident.promptText}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <h4 className="font-medium text-slate-900">How to use:</h4>
                    <ol className="text-sm text-slate-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                        <span>Copy the prompt above</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                        <span>Open ChatGPT and paste the prompt</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                        <span>Tap the microphone and speak your observations about {displayName}&apos;s day</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">4</span>
                        <span>Copy ChatGPT&apos;s response and paste it in the next step</span>
                      </li>
                    </ol>
                    <a
                      href="https://chat.openai.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Open ChatGPT
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">No Prompt Set</p>
                      <p className="text-sm text-orange-700 mt-1">
                        A ChatGPT prompt hasn&apos;t been set up for {displayName} yet. You can still write a note manually, or ask your supervisor to set up a prompt.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep("write")}>
                  {resident.promptText ? "I've Used ChatGPT" : "Write Note Manually"}
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Write Note */}
          {step === "write" && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff">Who is writing this note?</Label>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    Progress Note Content
                    <span className="text-slate-400 font-normal ml-2">
                      Paste ChatGPT response or type manually
                    </span>
                  </Label>
                  <Textarea
                    id="content"
                    placeholder={`Paste the ChatGPT response here, or type your observations about ${displayName}'s day...

Include:
- Mood and demeanor
- Activities and participation
- Meals and appetite
- Interactions with others
- Any notable observations`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-500 text-right">
                    {content.length} characters {content.length < 50 && "(minimum 50)"}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <strong>Reminder:</strong> Use person-first language and focus on {displayName}&apos;s strengths, preferences, and daily experiences.
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep("prompt")}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (!staffId) {
                      setError("Please select who is writing this note");
                      return;
                    }
                    if (!content.trim() || content.trim().length < 50) {
                      setError("Please enter at least 50 characters");
                      return;
                    }
                    setError("");
                    setStep("sign");
                  }}
                  disabled={!staffId || content.length < 50}
                >
                  Continue to Sign
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Sign */}
          {step === "sign" && (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Note Preview</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">{content}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <PenTool className="h-4 w-4" />
                    Your Signature
                  </Label>
                  <p className="text-sm text-slate-500">
                    By signing, you attest that this is an accurate record of your observations.
                  </p>
                  <MobileSignaturePad
                    onSignatureChange={setSignatureData}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={() => setStep("write")}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !signatureData}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Submit Note
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Error display for earlier steps */}
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
