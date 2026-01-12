"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Calendar,
  Home,
  Clock,
  Send,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Star,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Report {
  id: string;
  houseId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  status: string;
  overallWeekRating: number | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  submittedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  reviewedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  house: {
    id: string;
    name: string;
  };
}

interface House {
  id: string;
  name: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700">
          <Clock className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Send className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Reviewed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getRatingStars(rating: number | null) {
  if (!rating) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ReportsTable({
  reports,
  houses,
  currentMonth,
  currentYear,
}: {
  reports: Report[];
  houses: House[];
  currentMonth: number;
  currentYear: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedHouse, setSelectedHouse] = useState(searchParams.get("houseId") || "all");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "all");

  const handleMonthChange = (direction: "prev" | "next") => {
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === "prev") {
      newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    } else {
      newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth.toString());
    params.set("year", newYear.toString());
    router.push(`/dashboard/weekly-reports?${params.toString()}`);
  };

  const handleHouseChange = (houseId: string) => {
    setSelectedHouse(houseId);
    const params = new URLSearchParams(searchParams.toString());
    if (houseId === "all") {
      params.delete("houseId");
    } else {
      params.set("houseId", houseId);
    }
    router.push(`/dashboard/weekly-reports?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/dashboard/weekly-reports?${params.toString()}`);
  };

  if (reports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleMonthChange("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(new Date(currentYear, currentMonth - 1), "MMMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => handleMonthChange("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedHouse} onValueChange={handleHouseChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All houses" />
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
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-center py-8 text-slate-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p>No reports found for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMonthChange("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(new Date(currentYear, currentMonth - 1), "MMMM yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={() => handleMonthChange("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedHouse} onValueChange={handleHouseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All houses" />
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
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Week</TableHead>
            <TableHead>House</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    {format(new Date(report.weekStartDate), "MMM d")} -{" "}
                    {format(new Date(report.weekEndDate), "MMM d")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-slate-400" />
                  {report.house.name}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(report.status)}</TableCell>
              <TableCell>{getRatingStars(report.overallWeekRating)}</TableCell>
              <TableCell>
                <span className="text-sm text-slate-600">{report.createdBy.name}</span>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/weekly-reports/${report.id}`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
