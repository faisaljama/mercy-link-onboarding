"use client";

import { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from "react";

// Error Boundary to catch and display errors
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MeetingComplianceErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MeetingCompliance Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">
            Error: {this.state.error?.message || "Unknown error"}
          </p>
          <pre className="text-xs mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Send,
  Loader2,
  Download,
  Upload,
  File,
  X,
} from "lucide-react";
import { format } from "date-fns";
import {
  getChecklistTemplate,
  getCompletionStats,
  formatSigners,
  calculateMeetingDueDates,
  MEETING_TYPE_LABELS,
  type ChecklistItem,
  type ChecklistState,
  type MeetingSchedule,
} from "@/lib/meeting-compliance-templates";
import { downloadPDF } from "@/lib/pdf-service";
import {
  MeetingCompliancePDF,
  getMeetingComplianceFilename,
} from "@/lib/pdf-templates/meeting-compliance-pdf";

interface MeetingDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface Meeting {
  id: string;
  clientId: string;
  meetingType: string;
  meetingDate: string;
  year: number;
  checklistItems: string;
  notes: string | null;
  caseManagerAbsent: boolean;
  docsSentDate: string | null;
  docsSentNotes: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  documents: MeetingDocument[];
}

interface MeetingComplianceProps {
  clientId: string;
  clientName: string;
  houseName: string;
  admissionDate: Date | string;
  meetings: Meeting[];
}

const MEETING_TYPES = [
  { value: "ADMISSION", label: "Admission Meeting" },
  { value: "INITIAL_45_60_DAY", label: "Initial Planning (45/60 Day)" },
  { value: "SEMI_ANNUAL", label: "Semi-Annual Review" },
  { value: "ANNUAL", label: "Annual Meeting" },
];

const YEARS = [1, 2, 3, 4, 5];

// Helper to safely parse date
function safeParseDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? new Date() : date;
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Helper to safely format date
function safeFormatDate(date: Date | string | null | undefined, formatStr: string): string {
  try {
    const parsed = safeParseDate(date);
    return format(parsed, formatStr);
  } catch {
    return "Invalid date";
  }
}

// Wrapper component with error boundary
export function MeetingCompliance(props: MeetingComplianceProps) {
  // Completely bypass props and fetch data client-side to avoid serialization issues
  return (
    <MeetingComplianceErrorBoundary>
      <MeetingComplianceLoader {...props} />
    </MeetingComplianceErrorBoundary>
  );
}

// Client-side data loader to avoid server/client serialization issues
function MeetingComplianceLoader({
  clientId,
  clientName,
  houseName,
  admissionDate: admissionDateProp,
}: MeetingComplianceProps) {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const res = await fetch(`/api/clients/${clientId}/meeting-compliance`);
        if (res.ok) {
          const data = await res.json();
          // Ensure all data is properly formatted
          const safeMeetings = (data.meetings || []).map((m: Meeting) => ({
            ...m,
            documents: Array.isArray(m?.documents) ? m.documents : [],
            checklistItems: m?.checklistItems || "{}",
            createdBy: m?.createdBy || { id: "", name: "Unknown" },
          }));
          setMeetings(safeMeetings);
        } else {
          setError("Failed to load meetings");
        }
      } catch (err) {
        console.error("Error fetching meetings:", err);
        setError("Failed to load meetings");
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">Loading meetings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <MeetingComplianceInner
      clientId={clientId}
      clientName={clientName}
      houseName={houseName}
      admissionDate={admissionDateProp}
      meetings={meetings || []}
    />
  );
}

function MeetingComplianceInner({
  clientId,
  clientName,
  houseName,
  admissionDate: admissionDateProp,
  meetings: initialMeetings,
}: MeetingComplianceProps) {
  // Ensure meetings is always an array and documents are always defined
  const safeMeetings = Array.isArray(initialMeetings)
    ? initialMeetings.map(m => ({
        ...m,
        documents: Array.isArray(m?.documents) ? m.documents : [],
        checklistItems: m?.checklistItems || "{}",
        createdBy: m?.createdBy || { id: "", name: "Unknown" },
      }))
    : [];
  const [meetings, setMeetings] = useState<Meeting[]>(safeMeetings);

  // Normalize admission date - it may come as string from server component serialization
  const admissionDate = safeParseDate(admissionDateProp);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(false);
  const [newMeetingType, setNewMeetingType] = useState("");
  const [newMeetingDate, setNewMeetingDate] = useState(() => {
    try {
      return format(new Date(), "yyyy-MM-dd");
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });
  const [newMeetingNotes, setNewMeetingNotes] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  const toggleExpanded = (meetingId: string) => {
    const newExpanded = new Set(expandedMeetings);
    if (newExpanded.has(meetingId)) {
      newExpanded.delete(meetingId);
    } else {
      newExpanded.add(meetingId);
    }
    setExpandedMeetings(newExpanded);
  };

  const handleCreateMeeting = async () => {
    if (!newMeetingType || !newMeetingDate) return;

    setLoading("create");
    try {
      const res = await fetch(`/api/clients/${clientId}/meeting-compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingType: newMeetingType,
          meetingDate: newMeetingDate,
          notes: newMeetingNotes || null,
        }),
      });

      if (res.ok) {
        const { meeting } = await res.json();
        setMeetings([...meetings, meeting]);
        setShowNewMeetingDialog(false);
        setNewMeetingType("");
        setNewMeetingDate(format(new Date(), "yyyy-MM-dd"));
        setNewMeetingNotes("");
        // Auto-expand the new meeting
        setExpandedMeetings(new Set([...expandedMeetings, meeting.id]));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create meeting");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting record?")) return;

    setLoading(meetingId);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/meeting-compliance/${meetingId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setMeetings(meetings.filter((m) => m.id !== meetingId));
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleChecklistChange = async (
    meeting: Meeting,
    itemKey: string,
    checked: boolean
  ) => {
    const checklistState: ChecklistState = JSON.parse(meeting.checklistItems);
    checklistState[itemKey] = {
      ...checklistState[itemKey],
      completed: checked,
      completedDate: checked ? format(new Date(), "yyyy-MM-dd") : undefined,
    };

    // Optimistically update UI
    setMeetings(
      meetings.map((m) =>
        m.id === meeting.id
          ? { ...m, checklistItems: JSON.stringify(checklistState) }
          : m
      )
    );

    try {
      await fetch(
        `/api/clients/${clientId}/meeting-compliance/${meeting.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklistItems: checklistState }),
        }
      );
    } catch (error) {
      console.error("Error updating checklist:", error);
      // Revert on error
      setMeetings(meetings);
    }
  };

  const handleCaseManagerAbsentChange = async (
    meeting: Meeting,
    absent: boolean
  ) => {
    setMeetings(
      meetings.map((m) =>
        m.id === meeting.id ? { ...m, caseManagerAbsent: absent } : m
      )
    );

    try {
      await fetch(
        `/api/clients/${clientId}/meeting-compliance/${meeting.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseManagerAbsent: absent }),
        }
      );
    } catch (error) {
      console.error("Error updating case manager status:", error);
    }
  };

  const handleDocsSentUpdate = async (
    meeting: Meeting,
    docsSentDate: string,
    docsSentNotes: string
  ) => {
    setMeetings(
      meetings.map((m) =>
        m.id === meeting.id ? { ...m, docsSentDate, docsSentNotes } : m
      )
    );

    try {
      await fetch(
        `/api/clients/${clientId}/meeting-compliance/${meeting.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docsSentDate: docsSentDate || null,
            docsSentNotes: docsSentNotes || null,
          }),
        }
      );
    } catch (error) {
      console.error("Error updating docs sent info:", error);
    }
  };

  const handleUploadDocument = async (meetingId: string, file: File) => {
    setLoading(`upload-${meetingId}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "document");
      formData.append("meetingComplianceId", meetingId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.document) {
        setMeetings(
          meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  documents: [
                    {
                      id: data.document.id,
                      fileName: data.document.fileName,
                      filePath: data.document.filePath || data.document.url,
                      fileType: data.document.fileType,
                      fileSize: data.document.fileSize,
                      uploadedAt: data.document.uploadedAt,
                    },
                    ...m.documents,
                  ],
                }
              : m
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

  const handleDeleteDocument = async (meetingId: string, documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setLoading(`delete-doc-${documentId}`);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMeetings(
          meetings.map((m) =>
            m.id === meetingId
              ? { ...m, documents: (m.documents || []).filter((d) => d?.id !== documentId) }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setLoading(null);
    }
  };

  // Get counts per year - with safety checks
  const yearCounts = YEARS.reduce((acc, year) => {
    try {
      acc[year] = Array.isArray(meetings) ? meetings.filter((m) => m?.year === year).length : 0;
    } catch {
      acc[year] = 0;
    }
    return acc;
  }, {} as Record<number, number>);

  // Filter and sort meetings by year and type - with safety checks
  const safeMeetingsArray = Array.isArray(meetings) ? meetings : [];
  const filteredMeetings = selectedYear === "all"
    ? safeMeetingsArray
    : safeMeetingsArray.filter((m) => m?.year === selectedYear);

  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    if (!a || !b) return 0;
    if (a.year !== b.year) return (a.year || 0) - (b.year || 0);
    const typeOrder = ["ADMISSION", "INITIAL_45_60_DAY", "SEMI_ANNUAL", "ANNUAL"];
    return typeOrder.indexOf(a.meetingType || "") - typeOrder.indexOf(b.meetingType || "");
  });

  // Calculate upcoming meeting due dates
  let upcomingMeetings: MeetingSchedule[] = [];
  try {
    const meetingsForCalc = safeMeetingsArray
      .filter(m => m?.meetingType && m?.year)
      .map((m) => ({ meetingType: m.meetingType, year: m.year }));
    upcomingMeetings = calculateMeetingDueDates(admissionDate, meetingsForCalc)
      .filter((m) => m && typeof m.daysUntilDue === 'number' && m.daysUntilDue <= 45);
  } catch (error) {
    console.error("Error calculating meeting due dates:", error);
  }

  return (
    <div className="space-y-4">
      {/* Upcoming Meetings Alert */}
      {upcomingMeetings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-900">Upcoming Meetings</h3>
              <p className="text-sm text-amber-700 mb-3">
                The following meetings are due based on the admission date:
              </p>
              <div className="space-y-2">
                {upcomingMeetings.map((meeting, idx) => (
                  <div
                    key={`${meeting.type}-${meeting.year}-${idx}`}
                    className={`flex items-center justify-between p-2 rounded ${
                      meeting.isOverdue
                        ? "bg-red-100 text-red-800"
                        : meeting.daysUntilDue <= 7
                        ? "bg-orange-100 text-orange-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{meeting.label}</span>
                      <Badge variant="outline" className="text-xs">
                        Year {meeting.year}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      {meeting.isOverdue ? (
                        <span className="font-medium text-red-700">
                          Overdue by {Math.abs(meeting.daysUntilDue)} days
                        </span>
                      ) : (
                        <span>
                          Due {safeFormatDate(meeting.dueDate, "MMM d, yyyy")} ({meeting.daysUntilDue} days)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Year Tabs and New Meeting Button */}
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={selectedYear === "all" ? "all" : String(selectedYear)}
          onValueChange={(v) => setSelectedYear(v === "all" ? "all" : Number(v))}
          className="flex-1"
        >
          <TabsList>
            <TabsTrigger value="all">
              All ({meetings.length})
            </TabsTrigger>
            {YEARS.map((year) => (
              <TabsTrigger key={year} value={String(year)}>
                Year {year} {yearCounts[year] > 0 && `(${yearCounts[year]})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Dialog open={showNewMeetingDialog} onOpenChange={setShowNewMeetingDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Meeting Record</DialogTitle>
              <DialogDescription>
                Add a new meeting to track required compliance documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select value={newMeetingType} onValueChange={setNewMeetingType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meeting Date</Label>
                <Input
                  type="date"
                  value={newMeetingDate}
                  onChange={(e) => setNewMeetingDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={newMeetingNotes}
                  onChange={(e) => setNewMeetingNotes(e.target.value)}
                  placeholder="Add any notes about this meeting..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewMeetingDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMeeting}
                disabled={!newMeetingType || !newMeetingDate || loading === "create"}
              >
                {loading === "create" && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meetings List */}
      {sortedMeetings.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p>No meeting records {selectedYear !== "all" ? `for Year ${selectedYear}` : "yet"}.</p>
          <p className="text-sm">
            Click "New Meeting" to start tracking compliance documents.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              clientId={clientId}
              clientName={clientName}
              houseName={houseName}
              admissionDate={admissionDate}
              expanded={expandedMeetings.has(meeting.id)}
              onToggle={() => toggleExpanded(meeting.id)}
              onChecklistChange={(key, checked) =>
                handleChecklistChange(meeting, key, checked)
              }
              onCaseManagerAbsentChange={(absent) =>
                handleCaseManagerAbsentChange(meeting, absent)
              }
              onDocsSentUpdate={(date, notes) =>
                handleDocsSentUpdate(meeting, date, notes)
              }
              onUploadDocument={(file) => handleUploadDocument(meeting.id, file)}
              onDeleteDocument={(docId) => handleDeleteDocument(meeting.id, docId)}
              onDelete={() => handleDeleteMeeting(meeting.id)}
              loading={loading === meeting.id}
              uploadLoading={loading === `upload-${meeting.id}`}
              deleteDocLoading={loading?.startsWith("delete-doc-") ? loading : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  clientId: string;
  clientName: string;
  houseName: string;
  admissionDate: Date | string;
  expanded: boolean;
  onToggle: () => void;
  onChecklistChange: (itemKey: string, checked: boolean) => void;
  onCaseManagerAbsentChange: (absent: boolean) => void;
  onDocsSentUpdate: (date: string, notes: string) => void;
  onUploadDocument: (file: File) => void;
  onDeleteDocument: (documentId: string) => void;
  onDelete: () => void;
  loading: boolean;
  uploadLoading: boolean;
  deleteDocLoading: string | null;
}

function MeetingCard({
  meeting,
  clientId,
  clientName,
  houseName,
  admissionDate: admissionDateProp,
  expanded,
  onToggle,
  onChecklistChange,
  onCaseManagerAbsentChange,
  onDocsSentUpdate,
  onUploadDocument,
  onDeleteDocument,
  onDelete,
  loading,
  uploadLoading,
  deleteDocLoading,
}: MeetingCardProps) {
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize admission date - it may come as string from server component serialization
  const admissionDate = safeParseDate(admissionDateProp);

  const checklistState: ChecklistState = JSON.parse(meeting.checklistItems || "{}");
  const template = getChecklistTemplate(meeting.meetingType);
  const stats = getCompletionStats(meeting.meetingType, checklistState);
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

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const filename = getMeetingComplianceFilename(
        clientName,
        meeting.meetingType,
        meeting.year
      );
      await downloadPDF(
        <MeetingCompliancePDF
          clientName={clientName}
          houseName={houseName}
          admissionDate={admissionDate.toISOString()}
          meeting={{
            meetingType: meeting.meetingType,
            meetingDate: meeting.meetingDate,
            year: meeting.year,
            checklistItems: meeting.checklistItems,
            notes: meeting.notes,
            caseManagerAbsent: meeting.caseManagerAbsent,
            docsSentDate: meeting.docsSentDate,
            docsSentNotes: meeting.docsSentNotes,
          }}
        />,
        filename
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
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
                {MEETING_TYPE_LABELS[meeting.meetingType] || meeting.meetingType}
                <Badge variant="outline" className="text-xs">
                  Year {meeting.year}
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {safeFormatDate(meeting.meetingDate, "MMMM d, yyyy")}
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
                {stats.completed}/{stats.total}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="text-slate-400 hover:text-blue-600"
              title="Download PDF"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={loading}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4">
          <div className="border-t pt-4 space-y-4">
            {/* Checklist Items */}
            <div className="space-y-2">
              {template.map((item) => (
                <ChecklistItemRow
                  key={item.key}
                  item={item}
                  state={checklistState[item.key]}
                  onChange={(checked) => onChecklistChange(item.key, checked)}
                />
              ))}
            </div>

            {/* Case Manager Absent Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id={`cm-absent-${meeting.id}`}
                  checked={meeting.caseManagerAbsent}
                  onCheckedChange={(checked) =>
                    onCaseManagerAbsentChange(checked === true)
                  }
                />
                <Label
                  htmlFor={`cm-absent-${meeting.id}`}
                  className="font-medium text-slate-700"
                >
                  Case Manager was not present at meeting
                </Label>
              </div>

              {meeting.caseManagerAbsent && (
                <div className="ml-6 p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                  <p className="text-sm text-amber-800 flex items-center gap-1">
                    <Send className="h-4 w-4" />
                    Send copies to case manager and request dated signatures
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">
                        Date Documents Sent
                      </Label>
                      <Input
                        type="date"
                        value={meeting.docsSentDate || ""}
                        onChange={(e) =>
                          onDocsSentUpdate(e.target.value, meeting.docsSentNotes || "")
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Notes</Label>
                      <Input
                        value={meeting.docsSentNotes || ""}
                        onChange={(e) =>
                          onDocsSentUpdate(meeting.docsSentDate || "", e.target.value)
                        }
                        placeholder="What was sent..."
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Notes */}
            {meeting.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Notes:</span> {meeting.notes}
                </p>
              </div>
            )}

            {/* Documents Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="font-medium text-slate-700">
                    Documents ({meeting.documents.length})
                  </span>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
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
                    Upload Document
                  </Button>
                </div>
              </div>

              {meeting.documents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {meeting.documents.map((doc) => (
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

interface ChecklistItemRowProps {
  item: ChecklistItem;
  state?: { completed: boolean; completedDate?: string; notes?: string };
  onChange: (checked: boolean) => void;
}

function ChecklistItemRow({ item, state, onChange }: ChecklistItemRowProps) {
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
        onCheckedChange={(checked) => onChange(checked === true)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
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
          {completed && state?.completedDate && (
            <span className="text-xs text-green-600 whitespace-nowrap flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {safeFormatDate(state.completedDate, "M/d/yy")}
            </span>
          )}
        </div>
        {item.sublabel && (
          <p className="text-xs text-slate-500 mt-0.5">{item.sublabel}</p>
        )}
        {item.signers && item.signers.length > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            Signed by: {formatSigners(item.signers)}
          </p>
        )}
      </div>
    </div>
  );
}
