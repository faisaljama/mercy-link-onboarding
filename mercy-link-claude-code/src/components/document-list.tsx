"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Download,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: { name: string };
  complianceItem?: { itemName: string; itemType: string } | null;
}

interface DocumentListProps {
  clientId?: string;
  employeeId?: string;
  refreshTrigger?: number;
  canDelete?: boolean;
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

export function DocumentList({
  clientId,
  employeeId,
  refreshTrigger = 0,
  canDelete = false,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [clientId, employeeId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (clientId) params.set("clientId", clientId);
      if (employeeId) params.set("employeeId", employeeId);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500">
        <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Compliance Item</TableHead>
          <TableHead>Uploaded</TableHead>
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                    <FileIcon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[180px]">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {doc.complianceItem ? (
                  <Badge variant="outline" className="text-xs">
                    {doc.complianceItem.itemName}
                  </Badge>
                ) : (
                  <span className="text-slate-400 text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                  </div>
                  <p className="text-xs text-slate-400">{doc.uploadedBy.name}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-600">
                  {formatFileSize(doc.fileSize)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <a
                    href={`/api/uploads/${doc.filePath.replace("/uploads/", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deleting === doc.id}
                        >
                          {deleting === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{doc.fileName}&quot;? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(doc.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
