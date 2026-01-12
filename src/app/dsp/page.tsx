import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckSquare,
  StickyNote,
  FileSignature,
  Users,
  Clock,
  AlertTriangle,
  Home,
} from "lucide-react";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { ShiftSelector } from "./shift-selector";

async function getDSPData(houseIds: string[], houseId: string | null, shiftDate: Date, shiftType: string) {
  const today = startOfDay(new Date());
  const selectedDate = startOfDay(shiftDate);

  // Get houses user has access to
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true, eveningEndsMidnight: true },
    orderBy: { name: "asc" },
  });

  const selectedHouseId = houseId && houseIds.includes(houseId) ? houseId : houses[0]?.id;

  if (!selectedHouseId) {
    return { houses: [], selectedHouse: null, stats: null, residents: [], pendingDocs: [] };
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

  // Get chores for this house and shift
  const chores = await prisma.chore.findMany({
    where: {
      houseId: selectedHouseId,
      isActive: true,
    },
  });

  // Filter chores for the selected shift
  const shiftChores = chores.filter((chore) => {
    try {
      const shifts = JSON.parse(chore.shifts);
      return shifts.includes(shiftType);
    } catch {
      return false;
    }
  });

  // Get completed chores for today's shift
  const completedChores = await prisma.choreCompletion.findMany({
    where: {
      houseId: selectedHouseId,
      shiftDate: selectedDate,
      shiftType: shiftType,
    },
    select: { choreId: true },
  });

  const completedChoreIds = new Set(completedChores.map(c => c.choreId));
  const pendingChoresCount = shiftChores.filter(c => !completedChoreIds.has(c.id)).length;
  const completedChoresCount = shiftChores.filter(c => completedChoreIds.has(c.id)).length;

  // Get shift notes for today
  const todaysNotes = await prisma.shiftNote.count({
    where: {
      houseId: selectedHouseId,
      shiftDate: selectedDate,
      shiftType: shiftType,
    },
  });

  // Get pending documents that need acknowledgment (simplified - would need employee ID in real implementation)
  const pendingDocs = await prisma.dSPDocument.findMany({
    where: {
      OR: [
        { houseId: selectedHouseId },
        { houseId: null }, // Organization-wide documents
      ],
      isActive: true,
      requiresAcknowledgment: true,
    },
    select: {
      id: true,
      title: true,
      documentType: true,
      client: {
        select: { firstName: true, lastName: true },
      },
    },
    take: 5,
  });

  const stats = {
    totalChores: shiftChores.length,
    completedChores: completedChoresCount,
    pendingChores: pendingChoresCount,
    notesWritten: todaysNotes,
    residentsCount: residents.length,
    pendingDocsCount: pendingDocs.length,
  };

  return { houses, selectedHouse, stats, residents, pendingDocs };
}

export default async function DSPDashboardPage({
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

  const { houses, selectedHouse, stats, residents, pendingDocs } = await getDSPData(
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">DSP Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {format(shiftDate, "EEEE, MMMM d, yyyy")} • {shiftType.charAt(0).toUpperCase() + shiftType.slice(1)} Shift ({shiftTimes[shiftType as keyof typeof shiftTimes]})
          </p>
        </div>
      </div>

      {/* Shift Selector */}
      <ShiftSelector
        houses={houses}
        selectedHouseId={selectedHouse?.id || ""}
        selectedDate={format(shiftDate, "yyyy-MM-dd")}
        selectedShift={shiftType}
      />

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={stats.pendingChores > 0 ? "border-orange-200 bg-orange-50" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Chores</p>
                    <p className="text-2xl font-bold">
                      {stats.completedChores}/{stats.totalChores}
                    </p>
                    {stats.pendingChores > 0 && (
                      <p className="text-xs text-orange-600 font-medium">{stats.pendingChores} remaining</p>
                    )}
                  </div>
                  <CheckSquare className={`h-8 w-8 ${stats.pendingChores > 0 ? "text-orange-300" : "text-green-300"}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Shift Notes</p>
                    <p className="text-2xl font-bold">{stats.notesWritten}</p>
                    <p className="text-xs text-slate-400">written today</p>
                  </div>
                  <StickyNote className="h-8 w-8 text-blue-300" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Residents</p>
                    <p className="text-2xl font-bold">{stats.residentsCount}</p>
                    <p className="text-xs text-slate-400">at {selectedHouse?.name}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-300" />
                </div>
              </CardContent>
            </Card>

            <Card className={stats.pendingDocsCount > 0 ? "border-red-200 bg-red-50" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Pending Docs</p>
                    <p className="text-2xl font-bold">{stats.pendingDocsCount}</p>
                    {stats.pendingDocsCount > 0 && (
                      <p className="text-xs text-red-600 font-medium">Need review</p>
                    )}
                  </div>
                  <FileSignature className={`h-8 w-8 ${stats.pendingDocsCount > 0 ? "text-red-300" : "text-slate-300"}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Chores Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-orange-500" />
                  Shift Chores
                </CardTitle>
                <CardDescription>
                  Complete your shift checklist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">
                      {stats.completedChores} of {stats.totalChores} complete
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.totalChores > 0 ? (stats.completedChores / stats.totalChores) * 100 : 0}%` }}
                    />
                  </div>
                  <Link href={`/dsp/chores?house=${selectedHouse?.id}&date=${format(shiftDate, "yyyy-MM-dd")}&shift=${shiftType}`}>
                    <Button className="w-full mt-2" variant={stats.pendingChores > 0 ? "default" : "outline"}>
                      {stats.pendingChores > 0 ? "Complete Chores" : "View Checklist"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Shift Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-blue-500" />
                  Shift Notes
                </CardTitle>
                <CardDescription>
                  Document resident activities and observations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Write progress notes for each resident during your shift.
                </p>
                <Link href={`/dsp/shift-notes?house=${selectedHouse?.id}&date=${format(shiftDate, "yyyy-MM-dd")}&shift=${shiftType}`}>
                  <Button className="w-full">Write Shift Notes</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card className={stats.pendingDocsCount > 0 ? "border-red-200" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-red-500" />
                  Documents
                  {stats.pendingDocsCount > 0 && (
                    <Badge variant="destructive" className="ml-2">{stats.pendingDocsCount}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Review and acknowledge required documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDocs.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {pendingDocs.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                    ))}
                    {pendingDocs.length > 3 && (
                      <p className="text-xs text-slate-500">+{pendingDocs.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 mb-4">
                    No documents pending review.
                  </p>
                )}
                <Link href={`/dsp/documents?house=${selectedHouse?.id}`}>
                  <Button className="w-full" variant={stats.pendingDocsCount > 0 ? "default" : "outline"}>
                    {stats.pendingDocsCount > 0 ? "Review Documents" : "View All Documents"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Residents Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Residents at {selectedHouse?.name}</CardTitle>
              <CardDescription>
                Quick access to resident information and profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {residents.map((resident) => (
                  <Link
                    key={resident.id}
                    href={`/dsp/residents/${resident.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    {resident.photoUrl ? (
                      <img
                        src={resident.photoUrl}
                        alt={`${resident.firstName} ${resident.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-sm">
                          {resident.firstName[0]}{resident.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {resident.onePageProfile?.preferredName || resident.firstName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {resident.firstName} {resident.lastName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
