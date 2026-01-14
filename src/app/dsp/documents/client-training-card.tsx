"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, FileSignature, Home } from "lucide-react";
import { TrainingSignOffDialog } from "./training-sign-off-dialog";

interface ClientTraining {
  acknowledgedAt: Date;
  trainerName: string;
}

interface ClientWithTraining {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  house: {
    id: string;
    name: string;
  };
  trainings: Record<string, ClientTraining>;
  completedCount: number;
}

interface ClientTrainingCardProps {
  client: ClientWithTraining;
  onTrainingComplete: () => void;
}

const DOCUMENT_TYPES = [
  { key: "IAPP", label: "IAPP", fullName: "Individual Abuse Prevention Plan" },
  { key: "SPA", label: "SPA", fullName: "Support Plan Addendum" },
  { key: "SMA", label: "SMA", fullName: "Self-Management Assessment" },
] as const;

export function ClientTrainingCard({ client, onTrainingComplete }: ClientTrainingCardProps) {
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSignClick = (docType: string) => {
    setSelectedDocType(docType);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedDocType(null);
  };

  const handleSignComplete = () => {
    setIsDialogOpen(false);
    setSelectedDocType(null);
    onTrainingComplete();
  };

  const getCompletionBadge = () => {
    const total = DOCUMENT_TYPES.length;
    const completed = client.completedCount;

    if (completed === total) {
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
    } else if (completed > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">{completed}/{total}</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Not Started</Badge>;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Client Photo */}
            <div className="flex-shrink-0">
              {client.photoUrl && client.photoUrl.startsWith("http") ? (
                <img
                  src={client.photoUrl}
                  alt={`${client.firstName} ${client.lastName}`}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    // Hide broken image and show initials instead
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center ${client.photoUrl && client.photoUrl.startsWith("http") ? "hidden" : ""}`}>
                <span className="text-lg font-semibold text-blue-600">
                  {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                </span>
              </div>
            </div>

            {/* Client Info & Training Buttons */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {client.firstName} {client.lastName}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {client.house.name}
                  </p>
                </div>
                {getCompletionBadge()}
              </div>

              {/* Training Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {DOCUMENT_TYPES.map((docType) => {
                  const isCompleted = !!client.trainings[docType.key];
                  const training = client.trainings[docType.key];

                  return (
                    <div key={docType.key} className="flex flex-col items-center">
                      {isCompleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 cursor-default"
                          disabled
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {docType.label}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSignClick(docType.key)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <FileSignature className="h-4 w-4 mr-1" />
                          {docType.label}
                        </Button>
                      )}
                      {isCompleted && training && (
                        <span className="text-xs text-slate-400 mt-1">
                          {new Date(training.acknowledgedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign-Off Dialog */}
      {selectedDocType && (
        <TrainingSignOffDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          onComplete={handleSignComplete}
          clientId={client.id}
          clientName={`${client.firstName} ${client.lastName}`}
          documentType={selectedDocType}
          documentFullName={DOCUMENT_TYPES.find((d) => d.key === selectedDocType)?.fullName || ""}
        />
      )}
    </>
  );
}
