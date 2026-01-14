"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, GraduationCap } from "lucide-react";
import { ClientTrainingCard } from "./client-training-card";

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

interface ClientTrainingSectionProps {
  houseFilter?: string | null;
}

export function ClientTrainingSection({ houseFilter }: ClientTrainingSectionProps) {
  const [clients, setClients] = useState<ClientWithTraining[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const url = houseFilter
        ? `/api/dsp/client-training?houseId=${houseFilter}`
        : "/api/dsp/client-training";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch client training data");
      }
      const data = await response.json();
      setClients(data.clients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [houseFilter]);

  const handleTrainingComplete = () => {
    fetchData(); // Refresh data after a training is completed
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-red-500">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">No residents found</p>
          <p className="text-sm">No active residents are assigned to your houses.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const totalClients = clients.length;
  const completedClients = clients.filter((c) => c.completedCount === 3).length;
  const inProgressClients = clients.filter((c) => c.completedCount > 0 && c.completedCount < 3).length;

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            Client Training
          </CardTitle>
          <CardDescription>
            Complete orientation training for each resident per MN Statute §245D.09, subd. 4a
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>{completedClients} Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>{inProgressClients} In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>{totalClients - completedClients - inProgressClients} Not Started</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => (
          <ClientTrainingCard
            key={client.id}
            client={client}
            onTrainingComplete={handleTrainingComplete}
          />
        ))}
      </div>
    </div>
  );
}
