import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  Clock,
  User,
  Home,
  Calendar,
  AlertCircle,
  Filter,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ReviewNoteButton } from "./review-note-button";
import { NotesFilters } from "./notes-filters";

interface SearchParams {
  house?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  staff?: string;
  resident?: string;
}

async function getNotesForReview(
  houseIds: string[],
  filters: SearchParams
) {
  const { house, startDate, endDate, status, staff } = filters;

  // Default to last 7 days if no date range specified
  const start = startDate ? new Date(startDate) : subDays(new Date(), 7);
  const end = endDate ? new Date(endDate) : new Date();

  const whereClause: Record<string, unknown> = {
    houseId: house && houseIds.includes(house) ? house : { in: houseIds },
    shiftDate: {
      gte: startOfDay(start),
      lte: endOfDay(end),
    },
  };

  // Filter by review status
  if (status === "pending") {
    whereClause.reviewedById = null;
  } else if (status === "reviewed") {
    whereClause.reviewedById = { not: null };
  }

  if (staff) {
    whereClause.submittedById = staff;
  }

  const notes = await prisma.shiftNote.findMany({
    where: whereClause,
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
      house: {
        select: { id: true, name: true },
      },
      submittedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reviewedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ reviewedById: "asc" }, { shiftDate: "desc" }, { submittedAt: "desc" }],
  });

  // Get houses for filter
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Get staff for filter
  const staffList = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      assignedHouses: { some: { houseId: { in: houseIds } } },
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });

  // Get residents for filter (for PDF export)
  const residents = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      onePageProfile: {
        select: { preferredName: true },
      },
    },
    orderBy: { firstName: "asc" },
  });

  return { notes, houses, staffList, residents };
}

const NOTE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  progress_note: { label: "Progress Note", color: "bg-blue-100 text-blue-700" },
  incident_report: { label: "Incident Report", color: "bg-red-100 text-red-700" },
  medication_note: { label: "Medication Note", color: "bg-purple-100 text-purple-700" },
  activity_note: { label: "Activity Note", color: "bg-green-100 text-green-700" },
  communication_log: { label: "Communication Log", color: "bg-orange-100 text-orange-700" },
};

export default async function NotesReviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Only DC, DM, Admin, HR can review notes
  const allowedRoles = ["ADMIN", "HR", "DESIGNATED_MANAGER", "DESIGNATED_COORDINATOR"];
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);

  const { notes, houses, staffList, residents } = await getNotesForReview(houseIds, params);

  const pendingNotes = notes.filter((n) => !n.reviewedById);
  const reviewedNotes = notes.filter((n) => n.reviewedById);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Notes Review
          </h1>
          <p className="text-slate-500 mt-1">
            Review and approve shift notes submitted by staff
          </p>
        </div>
      </div>

      {/* Filters */}
      <NotesFilters
        houses={houses}
        staffList={staffList}
        residents={residents}
        currentFilters={params}
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
              <FileText className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingNotes.length > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{pendingNotes.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Reviewed</p>
                <p className="text-2xl font-bold text-green-600">{reviewedNotes.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Notes */}
      {pendingNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Pending Review ({pendingNotes.length})
            </CardTitle>
            <CardDescription>
              Notes awaiting your review and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingNotes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-medium text-sm">
                          {note.client.firstName[0]}{note.client.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {note.client.onePageProfile?.preferredName || note.client.firstName} {note.client.lastName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {note.house.name}
                          </span>
                          <span>-</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(note.shiftDate), "MMM d, yyyy")} - {note.shiftType}
                          </span>
                          <span>-</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {note.submittedBy.firstName} {note.submittedBy.lastName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={NOTE_TYPE_LABELS[note.noteType]?.color || "bg-slate-100"}>
                        {NOTE_TYPE_LABELS[note.noteType]?.label || note.noteType}
                      </Badge>
                      <ReviewNoteButton noteId={note.id} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Submitted {format(new Date(note.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviewed Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Reviewed Notes ({reviewedNotes.length})
          </CardTitle>
          <CardDescription>
            Notes that have been reviewed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewedNotes.length > 0 ? (
            <div className="space-y-4">
              {reviewedNotes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg bg-green-50/30">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {note.client.onePageProfile?.preferredName || note.client.firstName} {note.client.lastName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {note.house.name}
                          </span>
                          <span>-</span>
                          <span>{format(new Date(note.shiftDate), "MMM d")} - {note.shiftType}</span>
                          <span>-</span>
                          <span>by {note.submittedBy.firstName} {note.submittedBy.lastName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={NOTE_TYPE_LABELS[note.noteType]?.color || "bg-slate-100"}>
                        {NOTE_TYPE_LABELS[note.noteType]?.label || note.noteType}
                      </Badge>
                      <Badge className="bg-green-100 text-green-700">
                        Reviewed by {note.reviewedBy?.name}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No reviewed notes in this period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
