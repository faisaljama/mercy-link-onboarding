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

interface DisciplineFiltersProps {
  houses: House[];
}

export function DisciplineFilters({ houses }: DisciplineFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentHouse = searchParams.get("houseId") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentSeverity = searchParams.get("severity") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/discipline?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/discipline");
  };

  const hasFilters = currentHouse || currentStatus || currentSeverity;

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <Select value={currentHouse || "all"} onValueChange={(v) => updateFilter("houseId", v === "all" ? "" : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Sites" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sites</SelectItem>
          {houses.map((house) => (
            <SelectItem key={house.id} value={house.id}>
              {house.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentStatus || "all"} onValueChange={(v) => updateFilter("status", v === "all" ? "" : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="PENDING_SIGNATURE">Pending Signature</SelectItem>
          <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
          <SelectItem value="DISPUTED">Disputed</SelectItem>
          <SelectItem value="VOIDED">Voided</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentSeverity || "all"} onValueChange={(v) => updateFilter("severity", v === "all" ? "" : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="MINOR">Minor (1-2 pts)</SelectItem>
          <SelectItem value="MODERATE">Moderate (3-4 pts)</SelectItem>
          <SelectItem value="SERIOUS">Serious (5-6 pts)</SelectItem>
          <SelectItem value="CRITICAL">Critical (8-10 pts)</SelectItem>
          <SelectItem value="IMMEDIATE_TERMINATION">Immediate Review</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
