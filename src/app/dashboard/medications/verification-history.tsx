"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface HistoryItem {
  id: string;
  type: "scheduled" | "prn";
  date: string;
  clientName: string;
  houseName: string;
  details: string;
  status: string;
  verifiedBy: string;
}

interface VerificationHistoryProps {
  houseIds: string[];
  filters: {
    house?: string;
    resident?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function VerificationHistory({ houseIds, filters }: VerificationHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const pageSize = 20;

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      if (filters.house) params.set("house", filters.house);
      if (filters.resident) params.set("resident", filters.resident);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/medications/history?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();
      setHistory(data.history);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, typeFilter, filters.house, filters.resident, filters.startDate, filters.endDate]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("format", "csv");

      if (filters.house) params.set("house", filters.house);
      if (filters.resident) params.set("resident", filters.resident);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/medications/history?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medication-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-600" />
              Verification History
            </CardTitle>
            <CardDescription>
              Complete history of all medication verifications and inventory updates
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="prn">PRN</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || history.length === 0}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <History className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No history found</p>
            <p className="text-sm">Verification records will appear here</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.type === "scheduled" ? (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                            <Package className="h-3 w-3" />
                            PRN
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(item.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.clientName}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {item.houseName}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {item.details}
                      </TableCell>
                      <TableCell>
                        {item.status === "match" ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Match
                          </Badge>
                        ) : item.status === "mismatch" ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Mismatch
                          </Badge>
                        ) : item.status === "low_stock" ? (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline">{item.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {item.verifiedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
  );
}
