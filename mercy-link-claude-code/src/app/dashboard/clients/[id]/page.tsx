import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Home,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { ComplianceChecklist } from "./compliance-checklist";
import { ClientDocuments } from "./client-documents";

async function getClient(id: string, houseIds: string[]) {
  const client = await prisma.client.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: true,
      complianceItems: {
        orderBy: { dueDate: "asc" },
        include: {
          documents: true,
        },
      },
      documents: true,
    },
  });

  return client;
}

function getStatusBadge(status: string, dueDate: Date) {
  if (status === "COMPLETED") {
    return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>;
  }
  if (status === "OVERDUE") {
    return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="mr-1 h-3 w-3" />Overdue</Badge>;
  }

  const daysUntil = differenceInDays(dueDate, new Date());
  if (daysUntil <= 7) {
    return <Badge className="bg-orange-100 text-orange-800"><Clock className="mr-1 h-3 w-3" />Due Soon</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);
  const client = await getClient(id, houseIds);

  if (!client) {
    notFound();
  }

  const overdueCount = client.complianceItems.filter((i) => i.status === "OVERDUE").length;
  const pendingCount = client.complianceItems.filter((i) => i.status === "PENDING").length;
  const completedCount = client.complianceItems.filter((i) => i.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
      </div>

      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {client.firstName} {client.lastName}
            </h1>
            <div className="flex items-center gap-2 text-slate-500">
              <Home className="h-4 w-4" />
              {client.house.name}
              <span className="mx-2">•</span>
              <Badge variant="outline">{client.waiverType || "N/A"}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline">Edit Client</Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Days Since Admission</p>
                <p className="text-2xl font-bold">
                  {differenceInDays(new Date(), client.admissionDate)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Date of Birth</p>
              <p className="font-medium">{format(client.dob, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Admission Date</p>
              <p className="font-medium">{format(client.admissionDate, "MMMM d, yyyy")}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Case Manager</p>
              {client.caseManagerName ? (
                <div className="space-y-1">
                  <p className="font-medium">{client.caseManagerName}</p>
                  {client.caseManagerEmail && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {client.caseManagerEmail}
                    </p>
                  )}
                  {client.caseManagerPhone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.caseManagerPhone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">Not assigned</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Legal Representative</p>
              {client.legalRepName ? (
                <div className="space-y-1">
                  <p className="font-medium">{client.legalRepName}</p>
                  {client.legalRepPhone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.legalRepPhone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">Not assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Checklist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compliance & Documents</CardTitle>
            <CardDescription>
              Track required documents and deadlines per Minnesota Statutes Chapter 245D
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="compliance">
              <TabsList>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents ({client.documents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="compliance" className="mt-4">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Items</TabsTrigger>
                    <TabsTrigger value="overdue" className="text-red-600">
                      Overdue ({overdueCount})
                    </TabsTrigger>
                    <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    <ComplianceChecklist
                      items={client.complianceItems}
                      clientId={client.id}
                    />
                  </TabsContent>

                  <TabsContent value="overdue" className="mt-4">
                    <ComplianceChecklist
                      items={client.complianceItems.filter((i) => i.status === "OVERDUE")}
                      clientId={client.id}
                    />
                  </TabsContent>

                  <TabsContent value="pending" className="mt-4">
                    <ComplianceChecklist
                      items={client.complianceItems.filter((i) => i.status === "PENDING")}
                      clientId={client.id}
                    />
                  </TabsContent>

                  <TabsContent value="completed" className="mt-4">
                    <ComplianceChecklist
                      items={client.complianceItems.filter((i) => i.status === "COMPLETED")}
                      clientId={client.id}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <ClientDocuments
                  clientId={client.id}
                  complianceItems={client.complianceItems.map((i) => ({
                    id: i.id,
                    itemName: i.itemName,
                    itemType: i.itemType,
                  }))}
                  canDelete={session.role !== "LEAD_STAFF"}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
