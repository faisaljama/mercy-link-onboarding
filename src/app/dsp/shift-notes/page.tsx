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
  Plus,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { ShiftSelector } from "../shift-selector";
import { NewNoteDialog } from "./new-note-dialog";

async function getShiftNotesData(houseIds: string[], houseId: string | null, shiftDate: Date, shiftType: string) {
  const selectedDate = startOfDay(shiftDate);

  // Get houses user has access to
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true, eveningEndsMidnight: true },
    orderBy: { name: "asc" },
  });

  const selectedHouseId = houseId && houseIds.includes(houseId) ? houseId : houses[0]?.id;

  if (!selectedHouseId) {
    return { houses: [], selectedHouse: null, residents: [], notes: [] };
  }

  const selectedHouse = houses.find(h => h.id === selectedHouseId);

  // Get residents at selected house
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
    },
    orderBy: { firstName: "asc" },
  });

  // Get notes for today's shift
  const notes = await prisma.shiftNote.findMany({
    where: {
      houseId: selectedHouseId,
      shiftDate: selectedDate,
      shiftType: shiftType,
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
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return { houses, selectedHouse, residents, notes };
}

const NOTE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  progress_note: { label: "Progress Note", color: "bg-blue-100 text-blue-700" },
  incident_report: { label: "Incident Report", color: "bg-red-100 text-red-700" },
  medication_note: { label: "Medication Note", color: "bg-purple-100 text-purple-700" },
  activity_note: { label: "Activity Note", color: "bg-green-100 text-green-700" },
  communication_log: { label: "Communication Log", color: "bg-orange-100 text-orange-700" },
};

export default async function ShiftNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; date?: string; shift?: string; clientId?: string }>;
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

  const { houses, selectedHouse, residents, notes } = await getShiftNotesData(
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

  // Group notes by resident
  type NoteItem = typeof notes[number];
  const notesByResident: Record<string, NoteItem[]> = {};
  for (const note of notes) {
    const clientId = note.clientId;
    if (!notesByResident[clientId]) {
      notesByResident[clientId] = [];
    }
    notesByResident[clientId].push(note);
  }

  // Pre-selected client if provided
  const preselectedClient = params.clientId ? residents.find(r => r.id === params.clientId) : null;

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
          <h1 className="text-3xl font-bold text-slate-900">Shift Notes</h1>
          <p className="text-slate-500 mt-1">
            {format(shiftDate, "EEEE, MMMM d, yyyy")} • {shiftType.charAt(0).toUpperCase() + shiftType.slice(1)} Shift ({shiftTimes[shiftType as keyof typeof shiftTimes]})
          </p>
        </div>
        <NewNoteDialog
          residents={residents}
          houseId={selectedHouse?.id || ""}
          shiftDate={format(shiftDate, "yyyy-MM-dd")}
          shiftType={shiftType}
          preselectedClientId={preselectedClient?.id}
        />
      </div>

      {/* Shift Selector */}
      <ShiftSelector
        houses={houses}
        selectedHouseId={selectedHouse?.id || ""}
        selectedDate={format(shiftDate, "yyyy-MM-dd")}
        selectedShift={shiftType}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Notes</p>
                <p className="text-2xl font-bold">{notes.length}</p>
              </div>
              <StickyNote className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Residents Documented</p>
                <p className="text-2xl font-bold">{Object.keys(notesByResident).length}/{residents.length}</p>
              </div>
              <User className="h-8 w-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>
        <Card className={Object.keys(notesByResident).length < residents.length ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Awaiting Notes</p>
                <p className="text-2xl font-bold">{residents.length - Object.keys(notesByResident).length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Residents needing notes */}
      {residents.filter(r => !notesByResident[r.id]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-700">Residents Needing Documentation</CardTitle>
            <CardDescription>Write a progress note for each resident during your shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {residents.filter(r => !notesByResident[r.id]).map((resident) => (
                <NewNoteDialog
                  key={resident.id}
                  residents={residents}
                  houseId={selectedHouse?.id || ""}
                  shiftDate={format(shiftDate, "yyyy-MM-dd")}
                  shiftType={shiftType}
                  preselectedClientId={resident.id}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      {resident.onePageProfile?.preferredName || resident.firstName}
                    </Button>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Notes</CardTitle>
          <CardDescription>
            {notes.length} {notes.length === 1 ? "note" : "notes"} written for this shift
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-sm">
                          {note.client.firstName[0]}{note.client.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {note.client.onePageProfile?.preferredName || note.client.firstName} {note.client.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{note.submittedBy.firstName} {note.submittedBy.lastName}</span>
                          <span>•</span>
                          <span>{format(new Date(note.submittedAt), "h:mm a")}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={NOTE_TYPE_LABELS[note.noteType]?.color || "bg-slate-100"}>
                      {NOTE_TYPE_LABELS[note.noteType]?.label || note.noteType}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <StickyNote className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No notes written yet</p>
              <p className="text-sm mt-2">Start documenting your shift by writing a progress note.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
