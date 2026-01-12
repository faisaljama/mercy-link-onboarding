import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Download,
  User,
  Users,
  Calendar,
  HardDrive,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DocumentFilters } from "./document-filters";
import { BulkUploadSection } from "./bulk-upload-section";

async function getDocuments(houseIds: string[], filters: { entityType?: string; search?: string }) {
  // Get accessible clients and employees
  const accessibleClients = await prisma.client.findMany({
    where: { houseId: { in: houseIds } },
    select: { id: true },
  });
  const accessibleEmployees = await prisma.employee.findMany({
    where: {
      assignedHouses: { some: { houseId: { in: houseIds } } },
    },
    select: { id: true },
  });

  const whereClause: Record<string, unknown> = {
    OR: [
      { clientId: { in: accessibleClients.map((c) => c.id) } },
      { employeeId: { in: accessibleEmployees.map((e) => e.id) } },
    ],
  };

  if (filters.entityType === "client") {
    whereClause.clientId = { not: null };
    delete whereClause.OR;
  } else if (filters.entityType === "employee") {
    whereClause.employeeId = { not: null };
    delete whereClause.OR;
  }

  if (filters.search) {
    whereClause.fileName = { contains: filters.search };
  }

  const documents = await prisma.document.findMany({
    where: whereClause,
    include: {
      uploadedBy: { select: { name: true } },
      client: { select: { id: true, firstName: true, lastName: true, house: { select: { name: true } } } },
      employee: { select: { id: true, firstName: true, lastName: true } },
      complianceItem: { select: { itemName: true, itemType: true } },
    },
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return documents;
}

function getFileIcon(fileType: string) {
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("image")) return FileImage;
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const houseIds = await getUserHouseIds(session.id);
  const documents = await getDocuments(houseIds, {
    entityType: params.entityType,
    search: params.search,
  });

  // Fetch clients and employees for bulk upload
  const [clients, employees] = await Promise.all([
    prisma.client.findMany({
      where: { houseId: { in: houseIds } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.employee.findMany({
      where: {
        assignedHouses: { some: { houseId: { in: houseIds } } },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Calculate stats
  const totalSize = documents.reduce((acc, d) => acc + d.fileSize, 0);
  const clientDocs = documents.filter((d) => d.clientId).length;
  const employeeDocs = documents.filter((d) => d.employeeId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500">
            View and manage uploaded compliance documents
          </p>
        </div>
        <BulkUploadSection clients={clients} employees={employees} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Client Documents</p>
                <p className="text-2xl font-bold">{clientDocs}</p>
              </div>
              <User className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Employee Documents</p>
                <p className="text-2xl font-bold">{employeeDocs}</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DocumentFilters />

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>
            Documents uploaded for clients and employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p>No documents found</p>
              <p className="text-sm mt-1">
                Upload documents from client or employee detail pages
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Associated With</TableHead>
                  <TableHead>Compliance Item</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.fileType);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            <FileIcon className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {doc.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.client ? (
                          <Link
                            href={`/dashboard/clients/${doc.client.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {doc.client.lastName}, {doc.client.firstName}
                            </div>
                            <p className="text-xs text-slate-500">
                              {doc.client.house.name}
                            </p>
                          </Link>
                        ) : doc.employee ? (
                          <Link
                            href={`/dashboard/employees/${doc.employee.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {doc.employee.lastName}, {doc.employee.firstName}
                            </div>
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.complianceItem ? (
                          <Badge variant="outline">
                            {doc.complianceItem.itemName}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{doc.uploadedBy.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar className="h-3 w-3" />
                          {format(doc.uploadedAt, "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/api/uploads/${doc.filePath.replace("/uploads/", "")}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
