"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface ReconciliationFiltersProps {
  houses: House[];
  currentHouseId?: string;
  currentYear: string;
}

export function ReconciliationFilters({
  houses,
  currentHouseId,
  currentYear,
}: ReconciliationFiltersProps) {
  const router = useRouter();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams();

    // Preserve existing filters
    if (currentHouseId && key !== "houseId") {
      params.set("houseId", currentHouseId);
    }
    if (currentYear && key !== "year") {
      params.set("year", currentYear);
    }

    // Set new value
    if (value) {
      params.set(key, value);
    }

    const queryString = params.toString();
    router.push(`/dashboard/billing/reconciliation${queryString ? `?${queryString}` : ""}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/billing/reconciliation");
  };

  const hasFilters = currentHouseId || currentYear !== new Date().getFullYear().toString();

  // Generate year options (current year and 2 years back)
  const currentYearNum = new Date().getFullYear();
  const years = [currentYearNum, currentYearNum - 1, currentYearNum - 2];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Filter by:</span>
        <Select
          value={currentHouseId || "all"}
          onValueChange={(value) =>
            updateFilter("houseId", value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Houses" />
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

        <Select
          value={currentYear}
          onValueChange={(value) => updateFilter("year", value)}
        >
          <SelectTrigger className="w-[120px]">
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

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
