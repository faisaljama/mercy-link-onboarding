import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  User,
  Home,
  CheckCircle2,
  AlertCircle,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { EditPromptDialog } from "./edit-prompt-dialog";

async function getResidentsWithPrompts(houseIds: string[]) {
  const residents = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    include: {
      house: {
        select: { id: true, name: true },
      },
      onePageProfile: {
        select: { preferredName: true },
      },
      notePrompt: {
        select: {
          id: true,
          promptText: true,
          updatedAt: true,
          updatedBy: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: [{ house: { name: "asc" } }, { firstName: "asc" }],
  });

  // Group by house
  const byHouse: Record<string, typeof residents> = {};
  for (const resident of residents) {
    const houseId = resident.house.id;
    if (!byHouse[houseId]) {
      byHouse[houseId] = [];
    }
    byHouse[houseId].push(resident);
  }

  return { residents, byHouse };
}

export default async function ResidentPromptsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Only DC, DM, Admin, HR can manage prompts
  const allowedRoles = ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }

  const houseIds = await getUserHouseIds(session.id);
  const { residents, byHouse } = await getResidentsWithPrompts(houseIds);

  // Only Admin, DM, DC can delete prompts (not HR)
  const canDeletePrompts = ["ADMIN", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"].includes(session.role);

  const residentsWithPrompts = residents.filter((r) => r.notePrompt);
  const residentsWithoutPrompts = residents.filter((r) => !r.notePrompt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          ChatGPT Prompts
        </h1>
        <p className="text-slate-500 mt-1">
          Manage personalized ChatGPT prompts for each resident&apos;s progress notes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Residents</p>
                <p className="text-2xl font-bold">{residents.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Prompts Set</p>
                <p className="text-2xl font-bold text-green-600">{residentsWithPrompts.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card className={residentsWithoutPrompts.length > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Missing Prompts</p>
                <p className="text-2xl font-bold text-orange-600">{residentsWithoutPrompts.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">About ChatGPT Prompts</h3>
              <p className="text-sm text-blue-700 mt-1">
                Each resident can have a personalized ChatGPT prompt that helps DSPs write consistent, person-centered progress notes using voice-to-text. The prompt includes the resident&apos;s preferences, communication style, and documentation requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Residents by House */}
      {Object.entries(byHouse).map(([houseId, houseResidents]) => (
        <Card key={houseId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-slate-500" />
              {houseResidents[0]?.house.name}
            </CardTitle>
            <CardDescription>
              {houseResidents.filter((r) => r.notePrompt).length} of {houseResidents.length} residents have prompts set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {houseResidents.map((resident) => (
                <div
                  key={resident.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
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
                      <p className="font-medium text-slate-900">
                        {resident.onePageProfile?.preferredName || resident.firstName} {resident.lastName}
                      </p>
                      {resident.notePrompt ? (
                        <p className="text-xs text-slate-500">
                          Updated {format(new Date(resident.notePrompt.updatedAt), "MMM d, yyyy")} by {resident.notePrompt.updatedBy.name}
                        </p>
                      ) : (
                        <p className="text-xs text-orange-500">No prompt set</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resident.notePrompt ? (
                      <Badge className="bg-green-100 text-green-700">Prompt Set</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-500 border-orange-300">Missing</Badge>
                    )}
                    <EditPromptDialog
                      clientId={resident.id}
                      clientName={`${resident.onePageProfile?.preferredName || resident.firstName} ${resident.lastName}`}
                      currentPrompt={resident.notePrompt?.promptText || null}
                      canDelete={canDeletePrompts}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
