"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle2,
  FileText,
  Calendar,
  Trash2,
  Loader2,
  Download,
  Upload,
  File,
  X,
  GraduationCap,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import {
  getTrainingTemplate,
  getTrainingCompletionStats,
  LOG_TYPE_LABELS,
  PLATFORM_LABELS,
  PLATFORM_COLORS,
  type TrainingSection,
  type TrainingItem,
  type TrainingChecklistState,
} from "@/lib/training-log-templates";

interface TrainingDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy?: { id: string; name: string };
}

interface TrainingLog {
  id: string;
  employeeId: string;
  logType: string;
  year: number;
  checklistItems: string;
  hoursRequired: number | null;
  hoursCompleted: number;
  employeeSignature: string | null;
  employeeSignedAt: string | null;
  supervisorSignature: string | null;
  supervisorSignedAt: string | null;
  notes: string | null;
  createdBy: { id: string; name: string };
  supervisor: { id: string; name: string } | null;
  createdAt: string;
  documents: TrainingDocument[];
}

interface EmployeeTrainingLogProps {
  employeeId: string;
  employeeName: string;
  hireDate: Date | string;
  experienceYears: number;
  canEdit?: boolean;
}

const LOG_TYPES = [
  { value: "ORIENTATION", label: "New Hire Orientation" },
  { value: "ANNUAL", label: "Annual Training" },
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

function safeParseDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  if (date instanceof Date) return isNaN(date.getTime()) ? new Date() : date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function safeFormatDate(date: Date | string | null | undefined, formatStr: string): string {
  try {
    return format(safeParseDate(date), formatStr);
  } catch {
    return "Invalid date";
  }
}

export function EmployeeTrainingLog({
  employeeId,
  employeeName,
  hireDate: hireDateProp,
  experienceYears,
  canEdit = true,
}: EmployeeTrainingLogProps) {
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrainingLogs() {
      try {
        const res = await fetch(`/api/employees/${employeeId}/training-logs`);
        if (res.ok) {
          const data = await res.json();
          setTrainingLogs(data.trainingLogs || []);
        } else {
          setError("Failed to load training logs");
        }
      } catch (err) {
        console.error("Error fetching training logs:", err);
        setError("Failed to load training logs");
      } finally {
        setLoading(false);
      }
    }
    fetchTrainingLogs();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">Loading training logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">{error}</div>
    );
  }

  return (
    <EmployeeTrainingLogInner
      employeeId={employeeId}
      employeeName={employeeName}
      hireDate={hireDateProp}
      experienceYears={experienceYears}
      trainingLogs={trainingLogs || []}
      canEdit={canEdit}
    />
  );
}

function EmployeeTrainingLogInner({
  employeeId,
  employeeName,
  hireDate: hireDateProp,
  experienceYears,
  trainingLogs: initialLogs,
  canEdit,
}: EmployeeTrainingLogProps & { trainingLogs: TrainingLog[] }) {
  const hireDate = safeParseDate(hireDateProp);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>(initialLogs);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [showNewLogDialog, setShowNewLogDialog] = useState(false);
  const [newLogType, setNewLogType] = useState("");
  const [newLogYear, setNewLogYear] = useState<number>(new Date().getFullYear());
  const [selectedLogType, setSelectedLogType] = useState<"all" | string>("all");

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const handleCreateLog = async () => {
    if (!newLogType) return;

    setLoading("create");
    try {
      const res = await fetch(`/api/employees/${employeeId}/training-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logType: newLogType,
          year: newLogType === "ORIENTATION" ? 0 : newLogYear,
        }),
      });

      if (res.ok) {
        const { trainingLog } = await res.json();
        setTrainingLogs([...trainingLogs, trainingLog]);
        setShowNewLogDialog(false);
        setNewLogType("");
        setNewLogYear(new Date().getFullYear());
        setExpandedLogs(new Set([...expandedLogs, trainingLog.id]));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create training log");
      }
    } catch (error) {
      console.error("Error creating training log:", error);
      alert("Failed to create training log");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this training log?")) return;

    setLoading(logId);
    try {
      const res = await fetch(`/api/employees/${employeeId}/training-logs/${logId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTrainingLogs(trainingLogs.filter((l) => l.id !== logId));
      }
    } catch (error) {
      console.error("Error deleting training log:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleChecklistChange = async (
    log: TrainingLog,
    itemKey: string,
    updates: {
      completed?: boolean;
      completedDate?: string;
      score?: string;
      trainerInitials?: string;
      hours?: number;
    }
  ) => {
    const checklistState: TrainingChecklistState = JSON.parse(log.checklistItems || "{}");
    checklistState[itemKey] = {
      ...checklistState[itemKey],
      ...updates,
      completed: updates.completed ?? checklistState[itemKey]?.completed ?? false,
      completedDate: updates.completed
        ? updates.completedDate || checklistState[itemKey]?.completedDate || format(new Date(), "yyyy-MM-dd")
        : updates.completedDate,
    };

    // Optimistically update UI
    setTrainingLogs(
      trainingLogs.map((l) =>
        l.id === log.id
          ? { ...l, checklistItems: JSON.stringify(checklistState) }
          : l
      )
    );

    try {
      await fetch(`/api/employees/${employeeId}/training-logs/${log.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistItems: checklistState }),
      });
    } catch (error) {
      console.error("Error updating checklist:", error);
      setTrainingLogs(trainingLogs);
    }
  };

  const handleUploadDocument = async (logId: string, file: File) => {
    setLoading(`upload-${logId}`);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/employees/${employeeId}/training-logs/${logId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.document) {
        setTrainingLogs(
          trainingLogs.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  documents: [
                    {
                      id: data.document.id,
                      fileName: data.document.fileName,
                      filePath: data.document.filePath,
                      fileType: data.document.fileType,
                      fileSize: data.document.fileSize,
                      uploadedAt: data.document.uploadedAt || new Date().toISOString(),
                      uploadedBy: data.document.uploadedBy,
                    },
                    ...l.documents,
                  ],
                }
              : l
          )
        );
      } else {
        alert(data.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteDocument = async (logId: string, documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setLoading(`delete-doc-${documentId}`);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTrainingLogs(
          trainingLogs.map((l) =>
            l.id === logId
              ? { ...l, documents: l.documents.filter((d) => d.id !== documentId) }
              : l
          )
        );
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setLoading(null);
    }
  };

  // Filter logs
  const filteredLogs = selectedLogType === "all"
    ? trainingLogs
    : trainingLogs.filter((l) => l.logType === selectedLogType);

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (a.logType !== b.logType) {
      return a.logType === "ORIENTATION" ? -1 : 1;
    }
    return b.year - a.year;
  });

  const orientationCount = trainingLogs.filter((l) => l.logType === "ORIENTATION").length;
  const annualCount = trainingLogs.filter((l) => l.logType === "ANNUAL").length;

  return (
    <div className="space-y-4">
      {/* Header with tabs and new log button */}
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={selectedLogType}
          onValueChange={(v) => setSelectedLogType(v)}
          className="flex-1"
        >
          <TabsList>
            <TabsTrigger value="all">All ({trainingLogs.length})</TabsTrigger>
            <TabsTrigger value="ORIENTATION">
              Orientation {orientationCount > 0 && `(${orientationCount})`}
            </TabsTrigger>
            <TabsTrigger value="ANNUAL">
              Annual {annualCount > 0 && `(${annualCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {canEdit && (
          <Dialog open={showNewLogDialog} onOpenChange={setShowNewLogDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Training Log
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Training Log</DialogTitle>
                <DialogDescription>
                  Start tracking training completion for {employeeName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Training Type</Label>
                  <Select value={newLogType} onValueChange={setNewLogType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select training type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOG_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newLogType === "ANNUAL" && (
                  <div className="space-y-2">
                    <Label>Training Year</Label>
                    <Select
                      value={String(newLogYear)}
                      onValueChange={(v) => setNewLogYear(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newLogType === "ANNUAL" && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <p>
                      <strong>Required Hours:</strong>{" "}
                      {experienceYears >= 5 ? "12 hours" : "24 hours"} (
                      {experienceYears >= 5 ? "5+ years" : "<5 years"} experience)
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewLogDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLog}
                  disabled={!newLogType || loading === "create"}
                >
                  {loading === "create" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Training Log
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Training Logs List */}
      {sortedLogs.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p>No training logs {selectedLogType !== "all" ? `for ${LOG_TYPE_LABELS[selectedLogType]}` : "yet"}.</p>
          <p className="text-sm">
            Click "New Training Log" to start tracking training completion.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLogs.map((log) => (
            <TrainingLogCard
              key={log.id}
              log={log}
              employeeId={employeeId}
              expanded={expandedLogs.has(log.id)}
              onToggle={() => toggleExpanded(log.id)}
              onChecklistChange={(key, updates) => handleChecklistChange(log, key, updates)}
              onUploadDocument={(file) => handleUploadDocument(log.id, file)}
              onDeleteDocument={(docId) => handleDeleteDocument(log.id, docId)}
              onDelete={() => handleDeleteLog(log.id)}
              loading={loading === log.id}
              uploadLoading={loading === `upload-${log.id}`}
              deleteDocLoading={loading?.startsWith("delete-doc-") ? loading : null}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TrainingLogCardProps {
  log: TrainingLog;
  employeeId: string;
  expanded: boolean;
  onToggle: () => void;
  onChecklistChange: (
    itemKey: string,
    updates: {
      completed?: boolean;
      completedDate?: string;
      score?: string;
      trainerInitials?: string;
      hours?: number;
    }
  ) => void;
  onUploadDocument: (file: File) => void;
  onDeleteDocument: (documentId: string) => void;
  onDelete: () => void;
  loading: boolean;
  uploadLoading: boolean;
  deleteDocLoading: string | null;
  canEdit?: boolean;
}

function TrainingLogCard({
  log,
  expanded,
  onToggle,
  onChecklistChange,
  onUploadDocument,
  onDeleteDocument,
  onDelete,
  loading,
  uploadLoading,
  deleteDocLoading,
  canEdit,
}: TrainingLogCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checklistState: TrainingChecklistState = JSON.parse(log.checklistItems || "{}");
  const template = getTrainingTemplate(log.logType);
  const stats = getTrainingCompletionStats(log.logType, checklistState);
  const allComplete = stats.requiredComplete === stats.requiredTotal;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadDocument(file);
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className={`border ${allComplete ? "border-green-200 bg-green-50/30" : ""}`}>
      <CardHeader
        className="cursor-pointer hover:bg-slate-50/50 transition-colors py-4"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {LOG_TYPE_LABELS[log.logType] || log.logType}
                {log.year > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {log.year}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3" />
                {stats.hoursCompleted.toFixed(1)} / {stats.hoursRequired.toFixed(1)} hours
                <span className="mx-1">|</span>
                {stats.completed} / {stats.total} items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {allComplete ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-700">
                {stats.requiredComplete}/{stats.requiredTotal} required
              </Badge>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={loading}
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4">
          <div className="border-t pt-4 space-y-6">
            {/* Checklist Sections */}
            {template.map((section) => (
              <div key={section.title} className="space-y-2">
                <h4 className="font-medium text-slate-700 text-sm">{section.title}</h4>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <TrainingItemRow
                      key={item.key}
                      item={item}
                      state={checklistState[item.key]}
                      onChange={(updates) => onChecklistChange(item.key, updates)}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Documents Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="font-medium text-slate-700">
                    Certificates & Documents ({log.documents.length})
                  </span>
                </div>
                {canEdit && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Certificate
                    </Button>
                  </div>
                )}
              </div>

              {log.documents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No certificates uploaded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {log.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatFileSize(doc.fileSize)} • {safeFormatDate(doc.uploadedAt, "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {canEdit && (
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            disabled={deleteDocLoading === `delete-doc-${doc.id}`}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            {deleteDocLoading === `delete-doc-${doc.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface TrainingItemRowProps {
  item: TrainingItem;
  state?: {
    completed: boolean;
    completedDate?: string;
    score?: string;
    trainerInitials?: string;
    hours?: number;
    notes?: string;
  };
  onChange: (updates: {
    completed?: boolean;
    completedDate?: string;
    score?: string;
    trainerInitials?: string;
    hours?: number;
  }) => void;
  canEdit?: boolean;
}

function TrainingItemRow({ item, state, onChange, canEdit }: TrainingItemRowProps) {
  const completed = state?.completed || false;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        completed
          ? "bg-green-50 border border-green-100"
          : item.optional
          ? "bg-slate-50/50 border border-slate-100"
          : "bg-white border border-slate-200"
      }`}
    >
      <Checkbox
        id={`item-${item.key}`}
        checked={completed}
        onCheckedChange={(checked) => onChange({ completed: checked === true })}
        disabled={!canEdit}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <Label
              htmlFor={`item-${item.key}`}
              className={`font-medium ${
                item.optional ? "text-slate-600" : "text-slate-900"
              } ${completed ? "line-through opacity-70" : ""}`}
            >
              {item.label}
              {item.optional && (
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  (if applicable)
                </span>
              )}
            </Label>
            <Badge className={`text-xs ${PLATFORM_COLORS[item.platform]} flex-shrink-0`}>
              {PLATFORM_LABELS[item.platform]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.hours} hrs
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {item.deadline}
            </span>
          </div>
        </div>

        {/* Completion fields */}
        {completed && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-slate-500">Date:</Label>
              <Input
                type="date"
                value={state?.completedDate || ""}
                onChange={(e) => onChange({ completedDate: e.target.value })}
                className="h-7 text-xs w-32"
                disabled={!canEdit}
              />
            </div>
            {item.platform === "STAR" && (
              <div className="flex items-center gap-1">
                <Label className="text-xs text-slate-500">Score:</Label>
                <Input
                  value={state?.score || ""}
                  onChange={(e) => onChange({ score: e.target.value })}
                  placeholder="e.g., 95%"
                  className="h-7 text-xs w-20"
                  disabled={!canEdit}
                />
              </div>
            )}
            <div className="flex items-center gap-1">
              <Label className="text-xs text-slate-500">Trainer:</Label>
              <Input
                value={state?.trainerInitials || ""}
                onChange={(e) => onChange({ trainerInitials: e.target.value })}
                placeholder="Initials"
                className="h-7 text-xs w-16"
                disabled={!canEdit}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
