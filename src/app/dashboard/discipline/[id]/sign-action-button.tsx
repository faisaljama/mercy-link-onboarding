"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SignaturePadComponent } from "@/components/signature-pad";
import { PenTool, Loader2, AlertTriangle } from "lucide-react";

interface SignActionButtonProps {
  actionId: string;
  existingSignerTypes: string[];
  userRole: string;
}

const SIGNER_TYPES = [
  { value: "SUPERVISOR", label: "Supervisor", roles: ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"] },
  { value: "WITNESS", label: "Witness", roles: ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR", "DSP"] },
  { value: "HR", label: "HR Representative", roles: ["ADMIN", "HR"] },
];

export function SignActionButton({ actionId, existingSignerTypes, userRole }: SignActionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signerType, setSignerType] = useState<string>("");
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Filter available signer types based on role and existing signatures
  const availableTypes = SIGNER_TYPES.filter(
    (type) =>
      type.roles.includes(userRole) &&
      !existingSignerTypes.includes(type.value)
  );

  if (availableTypes.length === 0) {
    return null;
  }

  const handleSubmit = async () => {
    if (!signerType || !signatureData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/corrective-actions/${actionId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerType,
          signatureData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sign");
      }

      setOpen(false);
      setSignerType("");
      setSignatureData(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PenTool className="h-4 w-4 mr-2" />
          Add Signature
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sign Corrective Action</DialogTitle>
          <DialogDescription>
            Add your signature to this corrective action document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label>Signing As</Label>
            <Select value={signerType} onValueChange={setSignerType}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {signerType && (
            <div>
              <Label className="mb-2 block">Your Signature</Label>
              <SignaturePadComponent
                onSignatureChange={setSignatureData}
                width={400}
                height={150}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !signerType || !signatureData}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                "Sign Document"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
