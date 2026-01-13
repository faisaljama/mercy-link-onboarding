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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Loader2, Info, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditPromptDialogProps {
  clientId: string;
  clientName: string;
  currentPrompt: string | null;
  canDelete?: boolean;
}

const DEFAULT_PROMPT_TEMPLATE = `You are helping a Direct Support Professional (DSP) write a shift progress note for [RESIDENT_NAME].

**About [RESIDENT_NAME]:**
[Add relevant information about the resident's preferences, communication style, daily routine, goals, etc.]

**Instructions:**
When the DSP speaks about their shift observations, convert their spoken words into a professional progress note that:
1. Uses person-first language (e.g., "[RESIDENT_NAME] chose to..." not "The client...")
2. Is written in third person narrative style
3. Focuses on the individual's choices, accomplishments, and experiences
4. Documents mood, activities, meals, interactions, and any notable observations
5. Notes any progress toward goals or areas of concern
6. Is professional and suitable for official documentation
7. Is organized with clear sections for different parts of the day if applicable

Please format the note clearly and ask clarifying questions if needed.`;

export function EditPromptDialog({
  clientId,
  clientName,
  currentPrompt,
  canDelete = false,
}: EditPromptDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [promptText, setPromptText] = useState(
    currentPrompt || DEFAULT_PROMPT_TEMPLATE.replace(/\[RESIDENT_NAME\]/g, clientName.split(" ")[0])
  );

  const handleSave = async () => {
    if (!promptText.trim()) {
      setError("Prompt text is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/clients/${clientId}/note-prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: promptText.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save prompt");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/clients/${clientId}/note-prompt`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete prompt");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete prompt");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = () => {
    setPromptText(
      DEFAULT_PROMPT_TEMPLATE.replace(/\[RESIDENT_NAME\]/g, clientName.split(" ")[0])
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Edit className="h-4 w-4" />
          {currentPrompt ? "Edit" : "Add"} Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentPrompt ? "Edit" : "Create"} ChatGPT Prompt for {clientName}
          </DialogTitle>
          <DialogDescription>
            This prompt will be copied by DSPs into ChatGPT to help them write progress notes using voice-to-text.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Writing a good prompt</p>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>- Include the resident&apos;s preferred name and pronouns</li>
                  <li>- Describe their communication style and preferences</li>
                  <li>- Note any current goals staff should document progress on</li>
                  <li>- Include any specific documentation requirements</li>
                  <li>- Remind staff to use person-first language</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptText">Prompt Text</Label>
            <Textarea
              id="promptText"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={16}
              className="font-mono text-sm"
              placeholder="Enter the ChatGPT prompt..."
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{promptText.length} characters</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-xs h-auto p-0"
                onClick={handleReset}
              >
                Reset to template
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1">
            {canDelete && currentPrompt && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1">
                    <Trash2 className="h-4 w-4" />
                    Delete Prompt
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Prompt?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the ChatGPT prompt for {clientName}. DSPs will no longer see a prompt when writing notes for this resident.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Prompt"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
