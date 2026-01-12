import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Home,
  FileText,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  IAPP: "Individual Abuse Prevention Plan",
  SUPPORT_PLAN_ADDENDUM: "Support Plan Addendum",
  SELF_MANAGEMENT_ASSESSMENT: "Self-Management Assessment",
  POSITIVE_SUPPORT_PLAN: "Positive Support Plan",
  HEALTH_CARE_DIRECTIVE: "Health Care Directive",
  BEHAVIOR_SUPPORT_PLAN: "Behavior Support Plan",
  SEIZURE_PROTOCOL: "Seizure Protocol",
  HOME_POLICIES: "Home Policies",
  ORGANIZATION_POLICIES: "Organization Policies",
};

async function getDocumentsData(houseIds: string[], houseFilter: string | null) {
  // Get houses user has access to
  const houses = await prisma.house.findMany({
    where: { id: { in: houseIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const selectedHouseId = houseFilter && houseIds.includes(houseFilter) ? houseFilter : null;

  // Build query for documents
  const whereClause: Record<string, unknown> = {
    isActive: true,
    OR: [
      { houseId: { in: houseIds } },
      { houseId: null }, // Organization-wide documents
    ],
  };

  if (selectedHouseId) {
    whereClause.OR = [
      { houseId: selectedHouseId },
      { houseId: null },
    ];
  }

  const documents = await prisma.dSPDocument.findMany({
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
      uploadedBy: {
        select: { name: true },
      },
      acknowledgments: {
        select: {
          id: true,
          staffId: true,
          acknowledgedAt: true,
        },
      },
    },
    orderBy: [{ uploadedAt: "desc" }],
  });

  return { houses, documents };
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);

  const { houses, documents } = await getDocumentsData(houseIds, params.house || null);

  if (houses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Home className="h-12 w-12 mb-4 text-slate-300" />
        <p className="text-lg font-medium">No houses assigned</p>
        <p className="text-sm">Contact your supervisor to get assigned to a house.</p>
      </div>
    );
  }

  // For now, we don't have staff ID from session, so we'll show all documents
  // In production, we'd filter by the current staff's acknowledgments
  const pendingDocuments = documents.filter(d => d.requiresAcknowledgment);
  const acknowledgedDocuments: typeof documents = [];
  const allDocuments = documents;

  // Group by type for organization
  const clientDocuments = documents.filter(d => d.clientId);
  const houseDocuments = documents.filter(d => d.houseId && !d.clientId);
  const orgDocuments = documents.filter(d => !d.houseId && !d.clientId);

  const defaultTab = params.tab || "pending";

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
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 mt-1">
            Review and acknowledge required documents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={pendingDocuments.length > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{pendingDocuments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Acknowledged</p>
                <p className="text-2xl font-bold text-green-600">{acknowledgedDocuments.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Documents</p>
                <p className="text-2xl font-bold">{allDocuments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="pending" className={pendingDocuments.length > 0 ? "text-orange-600" : ""}>
            Pending Review ({pendingDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged ({acknowledgedDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Documents ({allDocuments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingDocuments.length > 0 ? (
            <DocumentList documents={pendingDocuments} showAcknowledgeButton />
          ) : (
            <EmptyState message="No documents pending review" />
          )}
        </TabsContent>

        <TabsContent value="acknowledged" className="mt-4">
          {acknowledgedDocuments.length > 0 ? (
            <DocumentList documents={acknowledgedDocuments} />
          ) : (
            <EmptyState message="No acknowledged documents yet" />
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-6">
          {/* Client-specific documents */}
          {clientDocuments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  Resident Documents
                </CardTitle>
                <CardDescription>Documents specific to individual residents</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList documents={clientDocuments} showAcknowledgeButton />
              </CardContent>
            </Card>
          )}

          {/* House documents */}
          {houseDocuments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  House Policies
                </CardTitle>
                <CardDescription>Documents specific to the house</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList documents={houseDocuments} showAcknowledgeButton />
              </CardContent>
            </Card>
          )}

          {/* Organization documents */}
          {orgDocuments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-green-500" />
                  Organization Policies
                </CardTitle>
                <CardDescription>Company-wide policies and procedures</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList documents={orgDocuments} showAcknowledgeButton />
              </CardContent>
            </Card>
          )}

          {allDocuments.length === 0 && (
            <EmptyState message="No documents available" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentList({
  documents,
  showAcknowledgeButton = false,
}: {
  documents: Array<{
    id: string;
    documentType: string;
    title: string;
    fileUrl: string;
    version: number;
    uploadedAt: Date;
    requiresAcknowledgment: boolean;
    client?: {
      id: string;
      firstName: string;
      lastName: string;
      onePageProfile?: { preferredName: string | null } | null;
    } | null;
    house?: { id: string; name: string } | null;
    uploadedBy: { name: string };
  }>;
  showAcknowledgeButton?: boolean;
}) {
  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">{doc.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <Badge variant="outline" className="text-xs">
                  {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                </Badge>
                {doc.client && (
                  <Badge variant="secondary" className="text-xs">
                    {doc.client.onePageProfile?.preferredName || doc.client.firstName} {doc.client.lastName}
                  </Badge>
                )}
                {doc.house && !doc.client && (
                  <Badge variant="secondary" className="text-xs">
                    {doc.house.name}
                  </Badge>
                )}
                <span>v{doc.version}</span>
                <span>•</span>
                <span>Updated {format(new Date(doc.uploadedAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1">
                <ExternalLink className="h-4 w-4" />
                View
              </Button>
            </a>
            {showAcknowledgeButton && doc.requiresAcknowledgment && (
              <Button size="sm">Acknowledge</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-slate-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}
