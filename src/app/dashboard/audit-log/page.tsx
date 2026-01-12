"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  FileText,
  Home,
  Users,
  ClipboardCheck,
  LogIn,
  LogOut,
  Upload,
  RefreshCw,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_TYPES = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "UPLOAD", label: "Upload" },
  { value: "STATUS_CHANGE", label: "Status Change" },
];

const ENTITY_TYPES = [
  { value: "USER", label: "User" },
  { value: "HOUSE", label: "House" },
  { value: "CLIENT", label: "Client" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "COMPLIANCE_ITEM", label: "Compliance Item" },
  { value: "DOCUMENT", label: "Document" },
];

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [action, setAction] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (action) params.set("action", action);
      if (entityType) params.set("entityType", entityType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (search) params.set("search", search);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleFilter = () => {
    fetchAuditLogs(1);
  };

  const handleClearFilters = () => {
    setAction("");
    setEntityType("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    fetchAuditLogs(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("format", "csv");
      if (action) params.set("action", action);
      if (entityType) params.set("entityType", entityType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (search) params.set("search", search);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    } finally {
      setExporting(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "UPDATE":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "LOGIN":
        return <LogIn className="h-4 w-4 text-purple-500" />;
      case "LOGOUT":
        return <LogOut className="h-4 w-4 text-gray-500" />;
      case "UPLOAD":
        return <Upload className="h-4 w-4 text-cyan-500" />;
      case "STATUS_CHANGE":
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default:
        return <History className="h-4 w-4 text-slate-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      LOGIN: "bg-purple-100 text-purple-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      UPLOAD: "bg-cyan-100 text-cyan-800",
      STATUS_CHANGE: "bg-orange-100 text-orange-800",
    };
    return <Badge className={variants[action] || "bg-slate-100 text-slate-800"}>{action}</Badge>;
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "USER":
        return <User className="h-4 w-4" />;
      case "CLIENT":
        return <Users className="h-4 w-4" />;
      case "EMPLOYEE":
        return <Users className="h-4 w-4" />;
      case "HOUSE":
        return <Home className="h-4 w-4" />;
      case "COMPLIANCE_ITEM":
        return <ClipboardCheck className="h-4 w-4" />;
      case "DOCUMENT":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const parseDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500">Track all system activity for DHS compliance</p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          <Download className={`mr-2 h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleFilter}>Apply Filters</Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Entries</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <History className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Status Changes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {auditLogs.filter((l) => l.action === "STATUS_CHANGE").length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Uploads</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {auditLogs.filter((l) => l.action === "UPLOAD").length}
                </p>
              </div>
              <Upload className="h-8 w-8 text-cyan-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Current Page</p>
                <p className="text-2xl font-bold">
                  {pagination.page} / {pagination.totalPages || 1}
                </p>
              </div>
              <FileText className="h-8 w-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {auditLogs.length} of {pagination.total} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No audit logs found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[80px]">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => {
                    const details = parseDetails(log.details);
                    const detailSummary =
                      typeof details === "object"
                        ? details.itemName || details.name || details.email || log.entityId
                        : log.entityId;

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(log.createdAt), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(log.createdAt), "h:mm:ss a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.user.name}</div>
                          <div className="text-xs text-slate-500">{log.user.role}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            {getActionBadge(log.action)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entityType)}
                            <span className="text-sm">{log.entityType.replace("_", " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <span className="text-sm text-slate-600">{detailSummary}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAuditLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAuditLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getActionIcon(selectedLog.action)}
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              {selectedLog &&
                formatDistanceToNow(new Date(selectedLog.createdAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">User</Label>
                  <p className="font-medium">{selectedLog.user.name}</p>
                  <p className="text-sm text-slate-500">{selectedLog.user.email}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Role</Label>
                  <p className="font-medium">{selectedLog.user.role}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Action</Label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <Label className="text-slate-500">Entity Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getEntityIcon(selectedLog.entityType)}
                    <span>{selectedLog.entityType.replace("_", " ")}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-500">Entity ID</Label>
                  <p className="font-mono text-sm">{selectedLog.entityId}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Timestamp</Label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.createdAt), "MMMM d, yyyy 'at' h:mm:ss a")}
                  </p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <Label className="text-slate-500">IP Address</Label>
                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-slate-500">Details</Label>
                <pre className="mt-2 rounded-lg bg-slate-100 p-4 text-sm overflow-auto max-h-[300px]">
                  {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
