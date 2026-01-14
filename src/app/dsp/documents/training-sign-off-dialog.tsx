"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileSignaturePad } from "@/components/signature-pad";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TrainingSignOffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  clientId: string;
  clientName: string;
  documentType: string;
  documentFullName: string;
}

const ATTESTATION_TEXTS: Record<string, string> = {
  IAPP: "I acknowledge that I have been trained on this client's Individual Abuse Prevention Plan (IAPP) and understand my responsibilities regarding abuse prevention for this individual.",
  SPA: "I acknowledge that I have been trained on this client's Support Plan Addendum (CSSP Addendum) and understand my responsibilities regarding the support and care of this individual.",
  SMA: "I acknowledge that I have been trained on this client's Self-Management Assessment and Medication Administration protocols and understand my responsibilities regarding medication administration for this individual.",
};

export function TrainingSignOffDialog({
  isOpen,
  onClose,
  onComplete,
  clientId,
  clientName,
  documentType,
  documentFullName,
}: TrainingSignOffDialogProps) {
  const [trainerName, setTrainerName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!trainerName.trim()) {
      setError("Please enter the trainer's name");
      return;
    }

    if (!acknowledged) {
      setError("Please acknowledge the attestation");
      return;
    }

    if (!signatureData) {
      setError("Please provide your signature");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/dsp/client-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          documentType,
          trainerName: trainerName.trim(),
          signatureData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit training acknowledgment");
      }

      // Reset form and close
      setTrainerName("");
      setAcknowledged(false);
      setSignatureData(null);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTrainerName("");
      setAcknowledged(false);
      setSignatureData(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign {documentType} Training</DialogTitle>
          <DialogDescription>
            {documentFullName} for <span className="font-medium">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Trainer Name */}
          <div className="space-y-2">
            <Label htmlFor="trainerName">Trainer Name</Label>
            <Input
              id="trainerName"
              placeholder="Who trained you on this document?"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">
              Enter the name of the supervisor or trainer who reviewed this document with you
            </p>
          </div>

          {/* Attestation */}
          <div className="space-y-3">
            <Label>Attestation</Label>
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
              {ATTESTATION_TEXTS[documentType]}
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                disabled={isSubmitting}
              />
              <label
                htmlFor="acknowledge"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have read and understand the above statement
              </label>
            </div>
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label>Your Signature</Label>
            <MobileSignaturePad
              onSignatureChange={setSignatureData}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Acknowledgment"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
