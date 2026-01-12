"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle2, Circle, Camera, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface ChoreItemProps {
  chore: {
    id: string;
    name: string;
    description: string | null;
    requiresPhoto: boolean;
    isRequired: boolean;
    completion: {
      completedAt: Date;
      completedBy: { firstName: string; lastName: string };
      photoUrls: string;
      notes: string | null;
    } | null;
  };
  houseId: string;
  shiftDate: string;
  shiftType: string;
}

export function ChoreItem({ chore, houseId, shiftDate, shiftType }: ChoreItemProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const isCompleted = !!chore.completion;

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // For now, we'll use a placeholder employee ID - in production, this would come from the session
      const response = await fetch("/api/chores/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreId: chore.id,
          houseId,
          shiftDate,
          shiftType,
          completedById: "placeholder", // This would come from session in production
          notes: notes || null,
          photoUrls: [], // Photo upload would be handled separately
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete chore");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete chore");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isCompleted ? "bg-green-50 border-green-200" : "bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        ) : (
          <Circle className="h-6 w-6 text-slate-300" />
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isCompleted ? "text-green-800" : "text-slate-900"}`}>
            {chore.name}
          </span>
          {chore.requiresPhoto && (
            <Badge variant="outline" className="text-xs gap-1">
              <Camera className="h-3 w-3" />
              Photo
            </Badge>
          )}
          {chore.isRequired && !isCompleted && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
        </div>
        {chore.description && (
          <p className="text-sm text-slate-500 truncate">{chore.description}</p>
        )}
        {isCompleted && chore.completion && (
          <div className="flex items-center gap-3 mt-1 text-xs text-green-600">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {chore.completion.completedBy.firstName} {chore.completion.completedBy.lastName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(chore.completion.completedAt), "h:mm a")}
            </span>
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        {isCompleted ? (
          <Button variant="ghost" size="sm" disabled>
            Done
          </Button>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                Complete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Chore</DialogTitle>
                <DialogDescription>
                  Mark "{chore.name}" as complete for this shift.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {chore.description && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    {chore.description}
                  </div>
                )}

                {chore.requiresPhoto && (
                  <div className="p-3 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 text-center">
                    <Camera className="h-8 w-8 mx-auto text-orange-400 mb-2" />
                    <p className="text-sm text-orange-600 font-medium">Photo required</p>
                    <p className="text-xs text-orange-500">Take a photo to complete this chore</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Take Photo
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this task..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

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
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting || (chore.requiresPhoto /* && !hasPhoto */)}
                >
                  {isSubmitting ? "Completing..." : "Mark Complete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
