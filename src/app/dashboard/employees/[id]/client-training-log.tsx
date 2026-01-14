"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Users, Check, Minus } from "lucide-react";
import { ServiceRecipientLogPDFButton } from "@/components/service-recipient-log-pdf-button";

interface ClientTraining {
  clientId: string;
  clientName: string;
  houseId: string;
  houseName: string;
  trainings: {
    IAPP?: { acknowledgedAt: Date; trainerName: string };
    SPA?: { acknowledgedAt: Date; trainerName: string };
    SMA?: { acknowledgedAt: Date; trainerName: string };
  };
}

interface ClientTrainingLogProps {
  employeeId: string;
  employeeName: string;
  employeePosition: string;
}

export function ClientTrainingLog({
  employeeId,
  employeeName,
  employeePosition,
}: ClientTrainingLogProps) {
  const [trainings, setTrainings] = useState<ClientTraining[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}/client-training`);
        if (!response.ok) {
          throw new Error("Failed to fetch client training data");
        }
        const data = await response.json();
        setTrainings(data.trainings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium">No client trainings recorded</p>
        <p className="text-sm">This employee has not completed any client orientation trainings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with PDF download */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-700">Service Recipient Orientation Log</h3>
          <p className="text-xs text-slate-500">Per MN Statute §245D.09, subd. 4a</p>
        </div>
        <ServiceRecipientLogPDFButton
          employeeId={employeeId}
          employeeName={employeeName}
          employeePosition={employeePosition}
          trainings={trainings}
        />
      </div>

      {/* Training Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Client Name</th>
              <th className="text-center px-4 py-3 font-medium text-slate-700">IAPP</th>
              <th className="text-center px-4 py-3 font-medium text-slate-700">SPA</th>
              <th className="text-center px-4 py-3 font-medium text-slate-700">SMA</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Trainer</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trainings.map((training) => (
              <tr key={training.clientId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{training.clientName}</p>
                    <p className="text-xs text-slate-500">{training.houseName}</p>
                  </div>
                </td>
                <td className="text-center px-4 py-3">
                  {training.trainings.IAPP ? (
                    <div className="flex flex-col items-center">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-slate-500">
                        {format(new Date(training.trainings.IAPP.acknowledgedAt), "M/d/yy")}
                      </span>
                    </div>
                  ) : (
                    <Minus className="h-4 w-4 text-slate-300 mx-auto" />
                  )}
                </td>
                <td className="text-center px-4 py-3">
                  {training.trainings.SPA ? (
                    <div className="flex flex-col items-center">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-slate-500">
                        {format(new Date(training.trainings.SPA.acknowledgedAt), "M/d/yy")}
                      </span>
                    </div>
                  ) : (
                    <Minus className="h-4 w-4 text-slate-300 mx-auto" />
                  )}
                </td>
                <td className="text-center px-4 py-3">
                  {training.trainings.SMA ? (
                    <div className="flex flex-col items-center">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-slate-500">
                        {format(new Date(training.trainings.SMA.acknowledgedAt), "M/d/yy")}
                      </span>
                    </div>
                  ) : (
                    <Minus className="h-4 w-4 text-slate-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {/* Get trainer name from most recent training */}
                  {training.trainings.IAPP?.trainerName ||
                    training.trainings.SPA?.trainerName ||
                    training.trainings.SMA?.trainerName ||
                    "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>IAPP</strong> = Individual Abuse Prevention Plan</p>
        <p><strong>SPA</strong> = Support Plan Addendum (CSSP Addendum)</p>
        <p><strong>SMA</strong> = Self-Management Assessment / Medication Administration</p>
      </div>
    </div>
  );
}
