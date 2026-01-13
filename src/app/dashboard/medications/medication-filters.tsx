"use client";

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
import { CalendarIcon, Filter, X } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";

interface MedicationFiltersProps {
  houses: { id: string; name: string }[];
  residents: {
    id: string;
    firstName: string;
    lastName: string;
    houseId: string;
    house: { name: string };
  }[];
  currentFilters: {
    house?: string;
    resident?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function MedicationFilters({
  houses,
  residents,
  currentFilters,
}: MedicationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/dashboard/medications?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/medications");
  };

  const hasFilters = Object.values(currentFilters).some((v) => v);

  const defaultStartDate = subDays(new Date(), 30);
  const startDate = currentFilters.startDate
    ? parseISO(currentFilters.startDate)
    : defaultStartDate;
  const endDate = currentFilters.endDate
    ? parseISO(currentFilters.endDate)
    : new Date();

  // Filter residents by selected house
  const filteredResidents = currentFilters.house
    ? residents.filter((r) => r.houseId === currentFilters.house)
    : residents;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg border">
      <Filter className="h-4 w-4 text-slate-500" />

      {/* House Filter */}
      <Select
        value={currentFilters.house || "all"}
        onValueChange={(value) => {
          updateParams({
            house: value === "all" ? null : value,
            resident: null, // Clear resident when house changes
          });
        }}
      >
        <SelectTrigger className="w-[160px] bg-white">
          <SelectValue placeholder="All houses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All houses</SelectItem>
          {houses.map((house) => (
            <SelectItem key={house.id} value={house.id}>
              {house.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Resident Filter */}
      <Select
        value={currentFilters.resident || "all"}
        onValueChange={(value) => updateParams({ resident: value === "all" ? null : value })}
      >
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder="All residents" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All residents</SelectItem>
          {filteredResidents.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.firstName} {r.lastName}
              {!currentFilters.house && (
                <span className="text-slate-400 text-xs ml-1">({r.house.name})</span>
              )}
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
