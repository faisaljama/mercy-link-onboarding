"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { CheckCircle2, Circle, Camera, Clock, User, X, Loader2, Image } from "lucide-react";
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
  staffId: string;
}

export function ChoreItem({ chore, houseId, shiftDate, shiftType, staffId }: ChoreItemProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string; url?: string }[]>([]);

  const isCompleted = !!chore.completion;
  const completionPhotos = chore.completion?.photoUrls
    ? JSON.parse(chore.completion.photoUrls) as string[]
    : [];

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError("");

    try {
      const newPhotos: { file: File; preview: string; url?: string }[] = [];

      for (const file of Array.from(files)) {
        // Create preview
        const preview = URL.createObjectURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "chore");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to upload photo");
        }

        const { url } = await response.json();
        newPhotos.push({ file, preview, url });
      }

      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleComplete = async () => {
    setError("");

    // Validate photo requirement
    if (chore.requiresPhoto && photos.length === 0) {
      setError("Please upload at least one photo to complete this chore");
      return;
    }

    setIsSubmitting(true);

    try {
      const photoUrls = photos.map((p) => p.url).filter(Boolean) as string[];

      const response = await fetch("/api/chores/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreId: chore.id,
          houseId,
          shiftDate,
          shiftType,
          completedById: staffId,
          notes: notes || null,
          photoUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete chore");
      }

      // Cleanup previews
      photos.forEach((p) => URL.revokeObjectURL(p.preview));

      setIsOpen(false);
      setNotes("");
      setPhotos([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete chore");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Cleanup previews when closing
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      setNotes("");
      setError("");
    }
    setIsOpen(open);
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
            <Badge variant="outline" className="text-xs gap-1 bg-purple-50 border-purple-200 text-purple-700">
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
            {completionPhotos.length > 0 && (
              <span className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                {completionPhotos.length} photo{completionPhotos.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        {isCompleted ? (
          <Button variant="ghost" size="sm" disabled>
            Done
          </Button>
        ) : (
          <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                Complete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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

                {/* Photo Upload Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Photos {chore.requiresPhoto && <span className="text-red-500">*</span>}
                  </Label>

                  {/* Photo previews */}
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo.preview}
                            alt={`Photo ${index + 1}`}
                            className="h-20 w-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {photo.url && (
                            <div className="absolute bottom-1 right-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      chore.requiresPhoto && photos.length === 0
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Camera className={`h-8 w-8 ${chore.requiresPhoto && photos.length === 0 ? "text-orange-400" : ""}`} />
                        <span className="text-sm">
                          {photos.length > 0 ? "Add more photos" : "Tap to take photo or upload"}
                        </span>
                        {chore.requiresPhoto && photos.length === 0 && (
                          <span className="text-xs text-orange-600 font-medium">Photo required</span>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </div>
                </div>

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
                <Button variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting || isUploading || (chore.requiresPhoto && photos.length === 0)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    "Mark Complete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
