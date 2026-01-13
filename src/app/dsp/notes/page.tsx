import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Home,
  StickyNote,
  User,
  FileText,
  HelpCircle,
  CheckCircle2,
  Clock,
  Mic,
} from "lucide-react";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { ShiftSelector } from "../shift-selector";
import { WriteNoteDialog } from "./write-note-dialog";

async function getNotesData(houseIds: string[], houseId: string | null, shiftDate: Date, shiftType: string) {
  const selectedDate = startOfDay(shiftDate);

  // Get houses user has access to
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true, eveningEndsMidnight: true },
    orderBy: { name: "asc" },
  });

  const selectedHouseId = houseId && houseIds.includes(houseId) ? houseId : houses[0]?.id;

  if (!selectedHouseId) {
    return { houses: [], selectedHouse: null, residents: [], notes: [], staff: [] };
  }

  const selectedHouse = houses.find(h => h.id === selectedHouseId);

  // Get residents at selected house with their note prompts
  const residents = await prisma.client.findMany({
    where: {
      houseId: selectedHouseId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      onePageProfile: {
        select: { preferredName: true },
      },
      notePrompt: {
        select: {
          id: true,
          promptText: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  // Get notes for today's shift
  const notes = await prisma.shiftNote.findMany({
    where: {
      houseId: selectedHouseId,
      shiftDate: selectedDate,
      shiftType: shiftType,
      noteType: "progress_note",
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          onePageProfile: {
            select: { preferredName: true },
          },
        },
      },
      submittedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reviewedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Get active staff at this house
  const staff = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      assignedHouses: {
        some: { houseId: selectedHouseId },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { firstName: "asc" },
  });

  return { houses, selectedHouse, residents, notes, staff };
}

export default async function DSPNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; date?: string; shift?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);

  // Determine current shift based on time
  const now = new Date();
  const hour = now.getHours();
  let defaultShift = "day";
  if (hour >= 16 || hour < 8) {
    defaultShift = hour >= 23 || hour < 8 ? "overnight" : "evening";
  }

  const shiftDate = params.date ? new Date(params.date) : new Date();
  const shiftType = params.shift || defaultShift;

  const { houses, selectedHouse, residents, notes, staff } = await getNotesData(
    houseIds,
    params.house || null,
    shiftDate,
    shiftType
  );

  if (houses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Home className="h-12 w-12 mb-4 text-slate-300" />
        <p className="text-lg font-medium">No houses assigned</p>
        <p className="text-sm">Contact your supervisor to get assigned to a house.</p>
      </div>
    );
  }

  const shiftTimes = {
    day: "8:00 AM - 4:00 PM",
    evening: selectedHouse?.eveningEndsMidnight ? "4:00 PM - 12:00 AM" : "4:00 PM - 11:00 PM",
    overnight: selectedHouse?.eveningEndsMidnight ? "12:00 AM - 8:00 AM" : "11:00 PM - 8:00 AM",
  };

  // Track which residents have notes
  const residentsWithNotes = new Set(notes.map(n => n.clientId));
  const residentsNeedingNotes = residents.filter(r => !residentsWithNotes.has(r.id));
  const residentsCompleted = residents.filter(r => residentsWithNotes.has(r.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dsp">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Mic className="h-8 w-8 text-blue-600" />
            Shift Notes
          </h1>
          <p className="text-slate-500 mt-1">
            {format(shiftDate, "EEEE, MMMM d, yyyy")} - {shiftType.charAt(0).toUpperCase() + shiftType.slice(1)} Shift ({shiftTimes[shiftType as keyof typeof shiftTimes]})
          </p>
        </div>
        <Link href="/dsp/notes/chatgpt-guide">
          <Button variant="outline" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            ChatGPT Setup Guide
          </Button>
        </Link>
      </div>

      {/* Shift Selector */}
      <ShiftSelector
        houses={houses}
        selectedHouseId={selectedHouse?.id || ""}
        selectedDate={format(shiftDate, "yyyy-MM-dd")}
        selectedShift={shiftType}
        basePath="/dsp/notes"
      />

      {/* How it works banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mic className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Voice-to-Text with ChatGPT</h3>
              <p className="text-sm text-blue-700 mt-1">
                Click on a resident below to get their personalized ChatGPT prompt. Copy it into ChatGPT, use voice to dictate your observations, then paste the response here and sign.
              </p>
              <Link href="/dsp/notes/chatgpt-guide" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                First time? See the setup guide
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <p className="text-sm text-slate-500">Notes Completed</p>
                <p className="text-2xl font-bold text-green-600">{residentsCompleted.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card className={residentsNeedingNotes.length > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Awaiting Notes</p>
                <p className="text-2xl font-bold text-orange-600">{residentsNeedingNotes.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Residents needing notes */}
      {residentsNeedingNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Write Progress Notes
            </CardTitle>
            <CardDescription>Click on a resident to write their progress note using ChatGPT voice-to-text</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {residentsNeedingNotes.map((resident) => (
                <WriteNoteDialog
                  key={resident.id}
                  resident={{
                    id: resident.id,
                    firstName: resident.firstName,
                    lastName: resident.lastName,
                    preferredName: resident.onePageProfile?.preferredName || null,
                    photoUrl: resident.photoUrl,
                    promptText: resident.notePrompt?.promptText || null,
                    promptUpdatedAt: resident.notePrompt?.updatedAt || null,
                  }}
                  houseId={selectedHouse?.id || ""}
                  shiftDate={format(shiftDate, "yyyy-MM-dd")}
                  shiftType={shiftType}
                  staff={staff}
                  trigger={
                    <button className="w-full p-4 border rounded-lg hover:bg-slate-50 transition-colors text-left flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        {resident.photoUrl ? (
                          <img
                            src={resident.photoUrl}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-purple-600 font-medium">
                            {resident.firstName[0]}{resident.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {resident.onePageProfile?.preferredName || resident.firstName} {resident.lastName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {resident.notePrompt ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Prompt ready
                            </span>
                          ) : (
                            <span className="text-orange-500">No prompt set</span>
                          )}
                        </p>
                      </div>
                      <StickyNote className="h-5 w-5 text-slate-400" />
                    </button>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Completed Notes
          </CardTitle>
          <CardDescription>
            {notes.length} {notes.length === 1 ? "note" : "notes"} submitted this shift
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg bg-green-50/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {note.client.onePageProfile?.preferredName || note.client.firstName} {note.client.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>by {note.submittedBy.firstName} {note.submittedBy.lastName}</span>
                          <span>-</span>
                          <span>{format(new Date(note.submittedAt), "h:mm a")}</span>
                        </div>
                      </div>
                    </div>
                    {note.reviewedBy ? (
                      <Badge className="bg-blue-100 text-blue-700">Reviewed</Badge>
                    ) : (
                      <Badge variant="outline">Pending Review</Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <StickyNote className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No notes yet this shift</p>
              <p className="text-sm mt-1">Click on a resident above to write their progress note.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
