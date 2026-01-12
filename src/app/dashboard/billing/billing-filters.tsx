"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, AlertTriangle, X } from "lucide-react";

interface House {
  id: string;
  name: string;
}

export function BillingFilters({
  houses,
  currentHouseId,
  showExpiring,
}: {
  houses: House[];
  currentHouseId?: string;
  showExpiring: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/billing?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/billing");
  };

  const hasFilters = currentHouseId || showExpiring;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-slate-500" />
        <Select
          value={currentHouseId || "all"}
          onValueChange={(value) =>
            updateFilter("houseId", value === "all" ? null : value)
          }
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
      </div>

      <Button
        variant={showExpiring ? "default" : "outline"}
        size="sm"
        onClick={() => updateFilter("expiring", showExpiring ? null : "true")}
        className={showExpiring ? "bg-orange-600 hover:bg-orange-700" : ""}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Expiring Soon (45 days)
      </Button>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
