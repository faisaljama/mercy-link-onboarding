"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Filter, X, FileDown, Loader2 } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface NotesFiltersProps {
  houses: { id: string; name: string }[];
  staffList: { id: string; firstName: string; lastName: string }[];
  residents?: { id: string; firstName: string; lastName: string; onePageProfile?: { preferredName: string | null } | null }[];
  currentFilters: {
    house?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    staff?: string;
    resident?: string;
  };
}

export function NotesFilters({
  houses,
  staffList,
  residents = [],
  currentFilters,
}: NotesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/dashboard/notes-review?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/notes-review");
  };

  const hasFilters = Object.values(currentFilters).some((v) => v);

  const defaultStartDate = subDays(new Date(), 7);
  const startDate = currentFilters.startDate
    ? parseISO(currentFilters.startDate)
    : defaultStartDate;
  const endDate = currentFilters.endDate
    ? parseISO(currentFilters.endDate)
    : new Date();

  const handleDownloadPDF = async () => {
    if (!currentFilters.resident) {
      alert("Please select a resident to download their notes as PDF");
      return;
    }

    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      params.set("clientId", currentFilters.resident);
      params.set("startDate", format(startDate, "yyyy-MM-dd"));
      params.set("endDate", format(endDate, "yyyy-MM-dd"));

      const response = await fetch(`/api/reports/shift-notes?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "progress-notes.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(error instanceof Error ? error.message : "Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg border">
      <Filter className="h-4 w-4 text-slate-500" />

      {/* House Filter */}
      <Select
        value={currentFilters.house || ""}
        onValueChange={(value) => updateParams({ house: value || null })}
      >
        <SelectTrigger className="w-[160px] bg-white">
          <SelectValue placeholder="All houses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All houses</SelectItem>
          {houses.map((house) => (
            <SelectItem key={house.id} value={house.id}>
              {house.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 bg-white">
            <CalendarIcon className="h-4 w-4" />
            {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: startDate, to: endDate }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                updateParams({
                  startDate: format(range.from, "yyyy-MM-dd"),
                  endDate: format(range.to, "yyyy-MM-dd"),
                });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Status Filter */}
      <Select
        value={currentFilters.status || ""}
        onValueChange={(value) => updateParams({ status: value || null })}
      >
        <SelectTrigger className="w-[140px] bg-white">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          <SelectItem value="pending">Pending Review</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
        </SelectContent>
      </Select>

      {/* Staff Filter */}
      <Select
        value={currentFilters.staff || ""}
        onValueChange={(value) => updateParams({ staff: value || null })}
      >
        <SelectTrigger className="w-[160px] bg-white">
          <SelectValue placeholder="All staff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All staff</SelectItem>
          {staffList.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Resident Filter (for PDF export) */}
      {residents.length > 0 && (
        <Select
          value={currentFilters.resident || ""}
          onValueChange={(value) => updateParams({ resident: value || null })}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Select resident" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All residents</SelectItem>
            {residents.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.onePageProfile?.preferredName || r.firstName} {r.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* PDF Download Button */}
      {currentFilters.resident && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="gap-2 bg-white"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      )}

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-1 text-slate-500"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
