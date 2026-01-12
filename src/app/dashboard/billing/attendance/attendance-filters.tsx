"use client";

import { useRouter, useSearchParams } from "next/navigation";
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

interface AttendanceFiltersProps {
  houses: House[];
  currentHouseId?: string;
}

export function AttendanceFilters({
  houses,
  currentHouseId,
}: AttendanceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/billing/attendance?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/billing/attendance");
  };

  const hasFilters = currentHouseId;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        value={currentHouseId || "all"}
        onValueChange={(value) => updateFilter("houseId", value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by house" />
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

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
