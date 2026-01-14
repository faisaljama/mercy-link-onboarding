import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  Clock,
  Home,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { UpdateChecklistForm } from "./update-form";
import { QAChecklistPDFButton } from "@/components/qa-checklist-pdf-button";

interface ChecklistItem {
  label: string;
  category: string;
  value: string;
  notes: string;
}

async function getChecklist(id: string, houseIds: string[]) {
  const checklist = await prisma.qAChecklist.findFirst({
    where: {
      id,
      OR: [
        { houseId: { in: houseIds } },
        { houseId: null },
      ],
    },
  });

  if (!checklist) return null;

  // Get related entities
  let house = null;
  let client = null;
  let reviewer = null;

  if (checklist.houseId) {
    house = await prisma.house.findUnique({
      where: { id: checklist.houseId },
    });
  }

  if (checklist.clientId) {
    client = await prisma.client.findUnique({
      where: { id: checklist.clientId },
      include: { house: true },
    });
  }

  reviewer = await prisma.user.findUnique({
    where: { id: checklist.reviewedBy },
    select: { name: true, email: true },
  });

  return { checklist, house, client, reviewer };
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

function getValueIcon(value: string) {
  switch (value) {
    case "YES":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "NO":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "NA":
      return <MinusCircle className="h-5 w-5 text-slate-400" />;
    default:
      return <Clock className="h-5 w-5 text-slate-300" />;
  }
}

export default async function QAChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const data = await getChecklist(id, houseIds);

  if (!data) {
    notFound();
  }

  const { checklist, house, client, reviewer } = data;
  const items: ChecklistItem[] = JSON.parse(checklist.items || "[]");

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const categories = Object.keys(itemsByCategory);

  // Stats
  const yesCount = items.filter((i) => i.value === "YES").length;
  const noCount = items.filter((i) => i.value === "NO").length;
  const naCount = items.filter((i) => i.value === "NA").length;
  const incompleteCount = items.filter((i) => !i.value).length;

  const canEdit = session.role !== "DSP";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/qa-checklist">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Checklists
          </Button>
        </Link>
        <QAChecklistPDFButton
          checklist={checklist}
          items={items}
          house={house}
          client={client}
          reviewer={reviewer}
        />
      </div>

      {/* Header */}
      <div className="print:pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {checklist.checklistType.replace(/_/g, " ")} Checklist
            </h1>
            <div className="flex items-center gap-4 mt-2 text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(checklist.reviewDate), "MMMM d, yyyy")}
              </div>
              {house && (
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  {house.name}
                </div>
              )}
              {client && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {client.firstName} {client.lastName}
                </div>
              )}
            </div>
          </div>
          {getStatusBadge(checklist.status)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{yesCount}</p>
              <p className="text-sm text-slate-500">Compliant</p>
            </div>
          </CardContent>
        </Card>
        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{noCount}</p>
              <p className="text-sm text-slate-500">Non-Compliant</p>
            </div>
          </CardContent>
        </Card>
        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-400">{naCount}</p>
              <p className="text-sm text-slate-500">N/A</p>
            </div>
          </CardContent>
        </Card>
        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{incompleteCount}</p>
              <p className="text-sm text-slate-500">Incomplete</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Alert */}
      {checklist.followUpRequired && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg print:bg-slate-50">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">Follow-up Required</p>
            {checklist.followUpDate && (
              <p className="text-sm text-orange-700">
                Due by: {format(new Date(checklist.followUpDate), "MMMM d, yyyy")}
              </p>
            )}
            {checklist.followUpNotes && (
              <p className="text-sm text-orange-700 mt-1">{checklist.followUpNotes}</p>
            )}
          </div>
        </div>
      )}

      {/* Checklist Items by Category */}
      <div className="space-y-6">
        {categories.map((category) => (
          <Card key={category} className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {itemsByCategory[category].map((item, index) => (
                  <div key={index} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {getValueIcon(item.value)}
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.notes && (
                          <p className="text-sm text-slate-500 mt-1">Note: {item.notes}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      item.value === "YES" ? "text-green-600" :
                      item.value === "NO" ? "text-red-600" :
                      item.value === "NA" ? "text-slate-400" : "text-slate-300"
                    }>
                      {item.value || "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Notes */}
      {checklist.overallNotes && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Overall Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{checklist.overallNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Review Info */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Review Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Reviewed By</p>
              <p className="font-medium">{reviewer?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Review Date</p>
              <p className="font-medium">{format(new Date(checklist.reviewDate), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created</p>
              <p className="font-medium">{format(new Date(checklist.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Last Updated</p>
              <p className="font-medium">{format(new Date(checklist.updatedAt), "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form (only for authorized users) */}
      {canEdit && checklist.status !== "COMPLETED" && (
        <UpdateChecklistForm checklist={checklist} items={items} />
      )}
    </div>
  );
}
