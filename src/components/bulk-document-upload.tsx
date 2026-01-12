"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Files,
  Link as LinkIcon,
} from "lucide-react";

interface ComplianceItem {
  id: string;
  itemName: string;
  itemType: string;
}

interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  detectedType?: string;
  complianceItemId?: string;
}

interface BulkDocumentUploadProps {
  clientId?: string;
  employeeId?: string;
  complianceItems?: ComplianceItem[];
  onUploadComplete?: () => void;
}

// Document type detection patterns
const DOCUMENT_PATTERNS: { pattern: RegExp; type: string; label: string }[] = [
  { pattern: /background|netstudy|study/i, type: "BACKGROUND_STUDY", label: "Background Study" },
  { pattern: /cpr|first.?aid|aed/i, type: "FIRST_AID_CPR", label: "First Aid/CPR" },
  { pattern: /maltreatment|abuse|neglect/i, type: "MALTREATMENT_TRAINING", label: "Maltreatment Training" },
  { pattern: /orientation/i, type: "ORIENTATION_TRAINING", label: "Orientation Training" },
  { pattern: /annual.?training|training.?annual/i, type: "ANNUAL_TRAINING", label: "Annual Training" },
  { pattern: /medication|med.?admin|mar/i, type: "MEDICATION_ADMIN_TRAINING", label: "Medication Training" },
  { pattern: /driver|license|dl/i, type: "DRIVERS_LICENSE_CHECK", label: "Driver's License" },
  { pattern: /tb|tuberculosis/i, type: "TB_TEST", label: "TB Test" },
  { pattern: /cssp|service.?plan|support.?plan/i, type: "SERVICE_PLAN", label: "Service Plan" },
  { pattern: /functional|assessment/i, type: "FUNCTIONAL_ASSESSMENT", label: "Functional Assessment" },
  { pattern: /abuse.?prevention/i, type: "ABUSE_PREVENTION_PLAN", label: "Abuse Prevention Plan" },
  { pattern: /rights|recipient/i, type: "SERVICE_RECIPIENT_RIGHTS", label: "Service Recipient Rights" },
  { pattern: /progress.?review/i, type: "PROGRESS_REVIEW", label: "Progress Review" },
  { pattern: /certificate|cert/i, type: "CERTIFICATE", label: "Certificate" },
];

function detectDocumentType(filename: string): string | undefined {
  for (const { pattern, type } of DOCUMENT_PATTERNS) {
    if (pattern.test(filename)) {
      return type;
    }
  }
  return undefined;
}

function getTypeLabel(type: string): string {
  const found = DOCUMENT_PATTERNS.find((p) => p.type === type);
  return found?.label || type;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function BulkDocumentUpload({
  clientId,
  employeeId,
  complianceItems = [],
  onUploadComplete,
}: BulkDocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalComplianceItemId, setGlobalComplianceItemId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const uploadFiles: UploadFile[] = fileArray
      .filter((file) => {
        // Max 10MB per file
        if (file.size > 10 * 1024 * 1024) {
          return false;
        }
        // Check if already added
        return !files.some((f) => f.file.name === file.name && f.file.size === file.size);
      })
      .map((file) => ({
        id: generateId(),
        file,
        status: "pending" as const,
        progress: 0,
        detectedType: detectDocumentType(file.name),
      }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileComplianceItem = (id: string, complianceItemId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, complianceItemId } : f))
    );
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    const formData = new FormData();
    formData.append("file", uploadFile.file);
    if (clientId) formData.append("clientId", clientId);
    if (employeeId) formData.append("employeeId", employeeId);

    // Use file-specific or global compliance item
    const itemId = uploadFile.complianceItemId || globalComplianceItemId;
    if (itemId) formData.append("complianceItemId", itemId);

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 10 } : f
      )
    );

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id && f.status === "uploading" && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "success", progress: 100 } : f
        )
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error",
                progress: 0,
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setUploading(false);
    onUploadComplete?.();
  };

  const clearAll = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "success"));
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const totalProgress = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Files className="h-5 w-5" />
          Bulk Document Upload
        </CardTitle>
        <CardDescription>
          Upload multiple documents at once. File types are auto-detected from filenames.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            files.length > 0 ? "border-blue-300 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-sm text-slate-600 mb-2">
            Drag and drop multiple files here, or click to select
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
            multiple
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            PDF, DOC, XLS, PNG, JPG up to 10MB each
          </p>
        </div>

        {/* Global Compliance Item Selection */}
        {files.length > 0 && complianceItems.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
            <LinkIcon className="h-4 w-4 text-slate-500" />
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">
                Link all files to:
              </label>
              <Select value={globalComplianceItemId} onValueChange={setGlobalComplianceItemId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select compliance item (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No link</SelectItem>
                  {complianceItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                Files ({files.length})
              </p>
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted}>
                    Clear Completed
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            {/* Overall Progress */}
            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Overall Progress</span>
                  <span>{totalProgress}%</span>
                </div>
                <Progress value={totalProgress} className="h-2" />
              </div>
            )}

            {/* File Items */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    uploadFile.status === "success"
                      ? "bg-green-50 border-green-200"
                      : uploadFile.status === "error"
                      ? "bg-red-50 border-red-200"
                      : uploadFile.status === "uploading"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {uploadFile.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : uploadFile.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : uploadFile.status === "uploading" ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5 text-slate-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {(uploadFile.file.size / 1024).toFixed(1)} KB
                      </span>
                      {uploadFile.detectedType && (
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(uploadFile.detectedType)}
                        </Badge>
                      )}
                      {uploadFile.error && (
                        <span className="text-xs text-red-600">{uploadFile.error}</span>
                      )}
                    </div>
                    {uploadFile.status === "uploading" && (
                      <Progress value={uploadFile.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  {/* Individual Compliance Link */}
                  {uploadFile.status === "pending" && complianceItems.length > 0 && (
                    <Select
                      value={uploadFile.complianceItemId || ""}
                      onValueChange={(val) => updateFileComplianceItem(uploadFile.id, val)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Link to item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No link</SelectItem>
                        {complianceItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.itemName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Remove Button */}
                  {uploadFile.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary & Actions */}
        {files.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-4 text-sm">
              {pendingCount > 0 && (
                <span className="text-slate-600">{pendingCount} pending</span>
              )}
              {successCount > 0 && (
                <span className="text-green-600">{successCount} uploaded</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">{errorCount} failed</span>
              )}
            </div>
            <Button
              onClick={handleUploadAll}
              disabled={uploading || pendingCount === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload All ({pendingCount})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
