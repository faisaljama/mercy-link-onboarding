"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Home,
  User,
  Image,
  Loader2,
  Camera,
} from "lucide-react";
import { format } from "date-fns";

interface Verification {
  id: string;
  visitDate: Date;
  medPackDate: Date;
  photoUrl: string;
  notes: string | null;
  client: { id: string; firstName: string; lastName: string };
  house: { id: string; name: string };
  verifiedBy: { id: string; name: string };
  createdAt: Date;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  houseId: string;
  house: { name: string };
}

interface ScheduledMedSectionProps {
  verifications: Verification[];
  residents: Resident[];
}

export function ScheduledMedSection({
  verifications,
  residents,
}: ScheduledMedSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string>("");
  const [visitDate, setVisitDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [medPackDate, setMedPackDate] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedResidentData = residents.find((r) => r.id === selectedResident);
  const datesMatch = visitDate && medPackDate && visitDate === medPackDate;
  const datesMismatch = visitDate && medPackDate && visitDate !== medPackDate;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setSelectedResident("");
    setVisitDate(format(new Date(), "yyyy-MM-dd"));
    setMedPackDate("");
    setNotes("");
    setPhoto(null);
    setPhotoPreview(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedResident) {
      setError("Please select a resident");
      return;
    }

    if (!visitDate || !medPackDate) {
      setError("Please enter both visit date and med pack date");
      return;
    }

    if (!photo) {
      setError("Please upload a photo of the med pack");
      return;
    }

    if (datesMismatch && !notes.trim()) {
      setError("Notes are required when dates do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("clientId", selectedResident);
      formData.append("visitDate", visitDate);
      formData.append("medPackDate", medPackDate);
      formData.append("notes", notes);
      formData.append("photo", photo);

      const response = await fetch("/api/medications/scheduled", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create verification");
      }

      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDayDiff = (visitDate: Date, medPackDate: Date) => {
    const visit = new Date(visitDate);
    const medPack = new Date(medPackDate);
    return Math.round((visit.getTime() - medPack.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Scheduled Medication Verification
            </CardTitle>
            <CardDescription>
              Verify Genoa blister pack dates match visit dates
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Verification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Scheduled Med Verification</DialogTitle>
                <DialogDescription>
                  Upload a photo of the med pack and verify the date matches today's visit.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Resident Selection */}
                <div className="space-y-2">
                  <Label htmlFor="resident">Resident *</Label>
                  <Select value={selectedResident} onValueChange={setSelectedResident}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resident" />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.firstName} {r.lastName} ({r.house.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-populated House */}
                {selectedResidentData && (
                  <div className="space-y-2">
                    <Label>House</Label>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border text-sm">
                      <Home className="h-4 w-4 text-slate-400" />
                      {selectedResidentData.house.name}
                    </div>
                  </div>
                )}

                {/* Visit Date */}
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Visit Date *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label>Photo of Med Pack *</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {photoPreview ? (
                      <div className="space-y-2">
                        <img
                          src={photoPreview}
                          alt="Med pack preview"
                          className="max-h-40 mx-auto rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <Camera className="h-8 w-8" />
                          <span className="text-sm">Click to upload or take photo</span>
                          <span className="text-xs text-slate-400">JPG, PNG, HEIC (max 10MB)</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Med Pack Date */}
                <div className="space-y-2">
                  <Label htmlFor="medPackDate">Date on Med Pack *</Label>
                  <Input
                    id="medPackDate"
                    type="date"
                    value={medPackDate}
                    onChange={(e) => setMedPackDate(e.target.value)}
                  />
                </div>

                {/* Dates Match Badge */}
                {visitDate && medPackDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Dates Match?</span>
                    {datesMatch ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Match
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Mismatch
                      </Badge>
                    )}
                  </div>
                )}

                {/* Mismatch Warning */}
                {datesMismatch && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Date Mismatch Detected</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Med pack shows {format(new Date(medPackDate), "MMMM d, yyyy")} but visit is {format(new Date(visitDate), "MMMM d, yyyy")}.
                          Medications may be {new Date(visitDate) > new Date(medPackDate) ? "behind" : "ahead of"} schedule.
                        </p>
                        <p className="text-sm text-yellow-700 mt-2 font-medium">
                          Please add a note explaining this discrepancy.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Notes {datesMismatch && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={datesMismatch ? "Explain why dates don't match..." : "Optional notes..."}
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Verification
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {verifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No verifications yet</p>
            <p className="text-sm">Add a verification to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {verifications.slice(0, 10).map((v) => {
              const visitDate = new Date(v.visitDate);
              const medPackDate = new Date(v.medPackDate);
              const datesMatch = visitDate.toDateString() === medPackDate.toDateString();
              const dayDiff = getDayDiff(visitDate, medPackDate);

              return (
                <div
                  key={v.id}
                  className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium text-sm">
                          {v.client.firstName[0]}{v.client.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {v.client.firstName} {v.client.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Home className="h-3 w-3" />
                          {v.house.name}
                          <span>-</span>
                          <Calendar className="h-3 w-3" />
                          {format(visitDate, "MMM d, yyyy")}
                        </div>
                        {v.notes && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {v.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {datesMatch ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Match
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {dayDiff > 0 ? "+" : ""}{dayDiff} day{Math.abs(dayDiff) !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        by {v.verifiedBy.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
