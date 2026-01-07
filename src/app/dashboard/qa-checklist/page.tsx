import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Home,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { NewChecklistDialog } from "./new-checklist-dialog";

async function getQAData(houseIds: string[]) {
  const checklists = await prisma.qAChecklist.findMany({
    where: {
      OR: [
        { houseId: { in: houseIds } },
        { houseId: null },
      ],
    },
    orderBy: { reviewDate: "desc" },
  });

  const houses = await prisma.house.findMany({
    where: {
      id: { in: houseIds },
    },
    orderBy: { name: "asc" },
  });

  const clients = await prisma.client.findMany({
    where: {
      houseId: { in: houseIds },
      status: "ACTIVE",
    },
    include: {
      house: true,
    },
    orderBy: { lastName: "asc" },
  });

  // Get house and client names for display
  const houseMap = new Map(houses.map((h) => [h.id, h.name]));
  const clientMap = new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));

  return { checklists, houses, clients, houseMap, clientMap };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>;
    case "NEEDS_ATTENTION":
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="mr-1 h-3 w-3" />Needs Attention</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case "MONTHLY_HOUSE":
      return <Badge variant="outline">Monthly House</Badge>;
    case "QUARTERLY_CLIENT":
      return <Badge variant="outline">Quarterly Client</Badge>;
    case "ANNUAL_REVIEW":
      return <Badge variant="outline">Annual Review</Badge>;
    case "INCIDENT_FOLLOWUP":
      return <Badge variant="outline" className="text-orange-600">Incident Follow-up</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default async function QAChecklistPage() {
  const session = await getSession();
  if (!session) return null;

  const houseIds = await getUserHouseIds(session.id);
  const { checklists, houses, clients, houseMap, clientMap } = await getQAData(houseIds);

  // Stats
  const completed = checklists.filter((c) => c.status === "COMPLETED").length;
  const needsAttention = checklists.filter((c) => c.status === "NEEDS_ATTENTION").length;
  const inProgress = checklists.filter((c) => c.status === "IN_PROGRESS").length;
  const withFollowUp = checklists.filter((c) => c.followUpRequired).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quality Assurance Checklists</h1>
          <p className="text-slate-500">
            Track and manage quality assurance reviews for 245D compliance
          </p>
        </div>
        <NewChecklistDialog houses={houses} clients={clients} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Reviews</p>
                <p className="text-2xl font-bold">{checklists.length}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Needs Attention</p>
                <p className="text-2xl font-bold text-red-600">{needsAttention}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Follow-ups Required</p>
                <p className="text-2xl font-bold text-orange-600">{withFollowUp}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklists Table */}
      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
          <CardDescription>
            All quality assurance reviews and inspections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checklists.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No QA checklists yet</p>
              <p className="text-sm">Create a new checklist to start tracking quality assurance</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklists.map((checklist) => (
                  <TableRow key={checklist.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(checklist.reviewDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(checklist.checklistType)}</TableCell>
                    <TableCell>
                      {checklist.houseId && (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-slate-400" />
                          {houseMap.get(checklist.houseId) || "Unknown House"}
                        </div>
                      )}
                      {checklist.clientId && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          {clientMap.get(checklist.clientId) || "Unknown Client"}
                        </div>
                      )}
                      {!checklist.houseId && !checklist.clientId && (
                        <span className="text-slate-400">General</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(checklist.status)}</TableCell>
                    <TableCell>
                      {checklist.followUpRequired ? (
                        <div className="text-sm">
                          <Badge variant="outline" className="text-orange-600">Required</Badge>
                          {checklist.followUpDate && (
                            <p className="text-xs text-slate-500 mt-1">
                              Due: {format(new Date(checklist.followUpDate), "MMM d")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/qa-checklist/${checklist.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
