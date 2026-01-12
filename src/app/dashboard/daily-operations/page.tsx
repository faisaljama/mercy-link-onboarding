"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  FileDown,
  Building2,
  Send,
  Eye,
  Edit,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { DailyOperationsPDFButton } from "@/components/daily-operations-pdf-button";

interface House {
  id: string;
  name: string;
}

interface DailyReport {
  id: string;
  houseId: string;
  date: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  censusCount: number | null;
  censusNotes: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  staffOnDuty: string | null;
  medicationNotes: string | null;
  mealNotes: string | null;
  activitiesNotes: string | null;
  incidentNotes: string | null;
  maintenanceNotes: string | null;
  generalNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  house: { id: string; name: string };
  createdBy: { id: string; name: string };
  submittedBy: { id: string; name: string } | null;
  reviewedBy: { id: string; name: string } | null;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  location: string | null;
  client: { id: string; firstName: string; lastName: string } | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const STATUS_COLORS = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  REVIEWED: "bg-green-100 text-green-800",
};

export default function DailyOperationsPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHouse, setSelectedHouse] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [reportDetails, setReportDetails] = useState<{
    calendarEvents: CalendarEvent[];
    clients: Client[];
    employees: Employee[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  // Form state for new report
  const [newReportData, setNewReportData] = useState({
    houseId: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Form state for editing report
  const [editFormData, setEditFormData] = useState({
    censusCount: 0,
    censusNotes: "",
    shiftStart: "",
    shiftEnd: "",
    staffOnDuty: "",
    medicationNotes: "",
    mealNotes: "",
    activitiesNotes: "",
    incidentNotes: "",
    maintenanceNotes: "",
    generalNotes: "",
  });

  useEffect(() => {
    fetchHouses();
    fetchUserRole();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedHouse, selectedMonth, selectedYear, selectedStatus]);

  const fetchUserRole = async () => {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUserRole(data.role || "");
    }
  };

  const fetchHouses = async () => {
    const res = await fetch("/api/houses");
    const data = await res.json();
    setHouses(data.houses || []);
  };

  const fetchReports = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      month: selectedMonth.toString(),
      year: selectedYear.toString(),
    });
    if (selectedHouse !== "all") {
      params.append("house", selectedHouse);
    }
    if (selectedStatus !== "all") {
      params.append("status", selectedStatus);
    }
    const res = await fetch(`/api/daily-operations?${params}`);
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  };

  const fetchReportDetails = async (reportId: string) => {
    const res = await fetch(`/api/daily-operations/${reportId}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedReport(data.report);
      setReportDetails({
        calendarEvents: data.calendarEvents || [],
        clients: data.clients || [],
        employees: data.employees || [],
      });
      // Initialize edit form with current values
      setEditFormData({
        censusCount: data.report.censusCount || 0,
        censusNotes: data.report.censusNotes || "",
        shiftStart: data.report.shiftStart ? format(new Date(data.report.shiftStart), "HH:mm") : "",
        shiftEnd: data.report.shiftEnd ? format(new Date(data.report.shiftEnd), "HH:mm") : "",
        staffOnDuty: data.report.staffOnDuty || "",
        medicationNotes: data.report.medicationNotes || "",
        mealNotes: data.report.mealNotes || "",
        activitiesNotes: data.report.activitiesNotes || "",
        incidentNotes: data.report.incidentNotes || "",
        maintenanceNotes: data.report.maintenanceNotes || "",
        generalNotes: data.report.generalNotes || "",
      });
      setIsViewDialogOpen(true);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/daily-operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        houseId: newReportData.houseId,
        date: newReportData.date,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setIsNewDialogOpen(false);
      setNewReportData({
        houseId: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
      fetchReports();
      // Open the new report for editing
      fetchReportDetails(data.report.id);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to create report");
    }
    setSubmitting(false);
  };

  const handleSaveReport = async () => {
    if (!selectedReport) return;
    setSubmitting(true);

    // Build datetime from date and time
    const reportDate = new Date(selectedReport.date);
    const shiftStart = editFormData.shiftStart
      ? new Date(reportDate.setHours(
          parseInt(editFormData.shiftStart.split(":")[0]),
          parseInt(editFormData.shiftStart.split(":")[1])
        ))
      : null;
    const shiftEnd = editFormData.shiftEnd
      ? new Date(reportDate.setHours(
          parseInt(editFormData.shiftEnd.split(":")[0]),
          parseInt(editFormData.shiftEnd.split(":")[1])
        ))
      : null;

    const res = await fetch(`/api/daily-operations/${selectedReport.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editFormData,
        shiftStart: shiftStart?.toISOString(),
        shiftEnd: shiftEnd?.toISOString(),
      }),
    });

    if (res.ok) {
      fetchReports();
      fetchReportDetails(selectedReport.id);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to save report");
    }
    setSubmitting(false);
  };

  const handleSubmitReport = async () => {
    if (!selectedReport) return;
    if (!confirm("Are you sure you want to submit this report? It cannot be edited after submission.")) return;

    setSubmitting(true);
    const res = await fetch(`/api/daily-operations/${selectedReport.id}/submit`, {
      method: "POST",
    });

    if (res.ok) {
      fetchReports();
      fetchReportDetails(selectedReport.id);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to submit report");
    }
    setSubmitting(false);
  };

  const handleReviewReport = async () => {
    if (!selectedReport) return;
    if (!confirm("Are you sure you want to mark this report as reviewed?")) return;

    setSubmitting(true);
    const res = await fetch(`/api/daily-operations/${selectedReport.id}/review`, {
      method: "POST",
    });

    if (res.ok) {
      fetchReports();
      fetchReportDetails(selectedReport.id);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to review report");
    }
    setSubmitting(false);
  };

  // Calculate stats
  const stats = reports.reduce(
    (acc, r) => ({
      total: acc.total + 1,
      draft: acc.draft + (r.status === "DRAFT" ? 1 : 0),
      submitted: acc.submitted + (r.status === "SUBMITTED" ? 1 : 0),
      reviewed: acc.reviewed + (r.status === "REVIEWED" ? 1 : 0),
      withIncidents: acc.withIncidents + (r.incidentNotes ? 1 : 0),
    }),
    { total: 0, draft: 0, submitted: 0, reviewed: 0, withIncidents: 0 }
  );

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  const canReview = userRole === "ADMIN" || userRole === "DESIGNATED_COORDINATOR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Operations Reports</h1>
          <p className="text-slate-600">Track daily activities, census, and observations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Daily Operations Report</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReport} className="space-y-4">
                <div>
                  <Label>House</Label>
                  <Select
                    value={newReportData.houseId}
                    onValueChange={(v) => setNewReportData({ ...newReportData, houseId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select house" />
                    </SelectTrigger>
                    <SelectContent>
                      {houses.map((house) => (
                        <SelectItem key={house.id} value={house.id}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newReportData.date}
                    onChange={(e) => setNewReportData({ ...newReportData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !newReportData.houseId}>
                    {submitting ? "Creating..." : "Create Report"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Label>House</Label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Houses</SelectItem>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">With Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.withIncidents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {MONTHS[selectedMonth - 1]} {selectedYear} Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-500">Loading...</p>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-slate-500">No reports found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Census</TableHead>
                    <TableHead>Incidents</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {format(new Date(report.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {report.house.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[report.status]}>
                          {report.status === "DRAFT" && <Clock className="mr-1 h-3 w-3" />}
                          {report.status === "SUBMITTED" && <Send className="mr-1 h-3 w-3" />}
                          {report.status === "REVIEWED" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-slate-400" />
                          {report.censusCount ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.incidentNotes ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {report.createdBy.name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {report.submittedAt
                          ? format(new Date(report.submittedAt), "MM/dd HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchReportDetails(report.id)}
                        >
                          {report.status === "DRAFT" ? (
                            <>
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </>
                          ) : (
                            <>
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Daily Operations Report - {selectedReport?.house.name}
              <Badge className={STATUS_COLORS[selectedReport?.status || "DRAFT"]}>
                {selectedReport?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-slate-500">Date</Label>
                  <p className="font-medium">{format(new Date(selectedReport.date), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-slate-500">House</Label>
                  <p className="font-medium">{selectedReport.house.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Created By</Label>
                  <p className="font-medium">{selectedReport.createdBy.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Census</Label>
                  <p className="font-medium">{selectedReport.censusCount ?? "Not set"}</p>
                </div>
              </div>

              <Separator />

              {/* Shift Info */}
              <div>
                <h3 className="font-semibold mb-3">Shift Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Shift Start</Label>
                    <Input
                      type="time"
                      value={editFormData.shiftStart}
                      onChange={(e) => setEditFormData({ ...editFormData, shiftStart: e.target.value })}
                      disabled={selectedReport.status !== "DRAFT"}
                    />
                  </div>
                  <div>
                    <Label>Shift End</Label>
                    <Input
                      type="time"
                      value={editFormData.shiftEnd}
                      onChange={(e) => setEditFormData({ ...editFormData, shiftEnd: e.target.value })}
                      disabled={selectedReport.status !== "DRAFT"}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Label>Staff On Duty</Label>
                    <Input
                      value={editFormData.staffOnDuty}
                      onChange={(e) => setEditFormData({ ...editFormData, staffOnDuty: e.target.value })}
                      placeholder="Enter staff names"
                      disabled={selectedReport.status !== "DRAFT"}
                    />
                  </div>
                </div>
              </div>

              {/* Census Notes */}
              <div>
                <Label>Census Notes</Label>
                <Textarea
                  value={editFormData.censusNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, censusNotes: e.target.value })}
                  placeholder="Note any absences, returns, or census changes..."
                  disabled={selectedReport.status !== "DRAFT"}
                  rows={2}
                />
              </div>

              {/* Calendar Events Reference */}
              {reportDetails && reportDetails.calendarEvents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Scheduled Events</h3>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    {reportDetails.calendarEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{event.title}</span>
                          {event.client && (
                            <span className="text-slate-500 ml-2">
                              ({event.client.firstName} {event.client.lastName})
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500">
                          {format(new Date(event.startDate), "h:mm a")}
                          {event.location && ` - ${event.location}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Notes Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Medication Notes</Label>
                  <Textarea
                    value={editFormData.medicationNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, medicationNotes: e.target.value })}
                    placeholder="Medication administration, PRNs given, refusals..."
                    disabled={selectedReport.status !== "DRAFT"}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Meal Notes</Label>
                  <Textarea
                    value={editFormData.mealNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, mealNotes: e.target.value })}
                    placeholder="Meals served, dietary accommodations..."
                    disabled={selectedReport.status !== "DRAFT"}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Activities Notes</Label>
                  <Textarea
                    value={editFormData.activitiesNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, activitiesNotes: e.target.value })}
                    placeholder="Activities completed, outings, client participation..."
                    disabled={selectedReport.status !== "DRAFT"}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-red-600">Incidents / Concerns</Label>
                  <Textarea
                    value={editFormData.incidentNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, incidentNotes: e.target.value })}
                    placeholder="Any incidents, behavioral concerns, or issues..."
                    disabled={selectedReport.status !== "DRAFT"}
                    rows={3}
                    className={editFormData.incidentNotes ? "border-red-300" : ""}
                  />
                </div>
                <div>
                  <Label>Maintenance / Housekeeping</Label>
                  <Textarea
                    value={editFormData.maintenanceNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, maintenanceNotes: e.target.value })}
                    placeholder="Chores completed, repairs needed, cleaning..."
                    disabled={selectedReport.status !== "DRAFT"}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>General Notes</Label>
                  <Textarea
                    value={editFormData.generalNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, generalNotes: e.target.value })}
                    placeholder="Any other observations or notes..."
                    disabled={selectedReport.status !== "DRAFT"}
                    rows={3}
                  />
                </div>
              </div>

              {/* Submission Info */}
              {selectedReport.submittedBy && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Submitted by <span className="font-medium">{selectedReport.submittedBy.name}</span>
                    {selectedReport.submittedAt && ` on ${format(new Date(selectedReport.submittedAt), "MMM d, yyyy 'at' h:mm a")}`}
                  </p>
                </div>
              )}

              {selectedReport.reviewedBy && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    Reviewed by <span className="font-medium">{selectedReport.reviewedBy.name}</span>
                    {selectedReport.reviewedAt && ` on ${format(new Date(selectedReport.reviewedAt), "MMM d, yyyy 'at' h:mm a")}`}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <DailyOperationsPDFButton
                  report={selectedReport}
                  calendarEvents={reportDetails?.calendarEvents || []}
                />
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedReport.status === "DRAFT" && (
                  <>
                    <Button variant="outline" onClick={handleSaveReport} disabled={submitting}>
                      {submitting ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button onClick={handleSubmitReport} disabled={submitting}>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Report
                    </Button>
                  </>
                )}
                {selectedReport.status === "SUBMITTED" && canReview && (
                  <Button onClick={handleReviewReport} disabled={submitting}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Reviewed
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
  );
}
