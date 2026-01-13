"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface TaskFiltersProps {
  houses: House[];
  categories: Category[];
  users: User[];
  currentMonth: number;
  currentYear: number;
  currentFilters: {
    status?: string;
    categoryId?: string;
    houseId?: string;
    priority?: string;
    assignedTo?: string;
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function TaskFilters({
  houses,
  categories,
  users,
  currentMonth,
  currentYear,
  currentFilters,
}: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/tasks?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set("month", currentMonth.toString());
    params.set("year", currentYear.toString());
    router.push(`/dashboard/tasks?${params.toString()}`);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const params = new URLSearchParams(searchParams.toString());
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === "prev") {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    params.set("month", newMonth.toString());
    params.set("year", newYear.toString());
    router.push(`/dashboard/tasks?${params.toString()}`);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", (now.getMonth() + 1).toString());
    params.set("year", now.getFullYear().toString());
    router.push(`/dashboard/tasks?${params.toString()}`);
  };

  const hasActiveFilters = currentFilters.status || currentFilters.categoryId || currentFilters.houseId || currentFilters.priority || currentFilters.assignedTo;

  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[140px] text-center">
              {MONTHS[currentMonth - 1]} {currentYear}
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrentMonth && (
              <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
                Today
              </Button>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Status Filter */}
          <Select
            value={currentFilters.status || "all"}
            onValueChange={(value) => updateFilter("status", value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={currentFilters.categoryId || "all"}
            onValueChange={(value) => updateFilter("categoryId", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={currentFilters.priority || "all"}
            onValueChange={(value) => updateFilter("priority", value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* House Filter */}
          <Select
            value={currentFilters.houseId || "all"}
            onValueChange={(value) => updateFilter("houseId", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="House" />
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

          {/* Staff Filter */}
          <Select
            value={currentFilters.assignedTo || "all"}
            onValueChange={(value) => updateFilter("assignedTo", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
