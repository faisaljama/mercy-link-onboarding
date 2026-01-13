"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sun, Moon, Sunrise } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ShiftSelectorProps {
  houses: { id: string; name: string }[];
  selectedHouseId: string;
  selectedDate: string;
  selectedShift: string;
  basePath?: string;
}

export function ShiftSelector({
  houses,
  selectedHouseId,
  selectedDate,
  selectedShift,
  basePath = "/dsp",
}: ShiftSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${basePath}?${params.toString()}`);
  };

  const shifts = [
    { value: "day", label: "Day", icon: Sun, time: "8AM - 4PM" },
    { value: "evening", label: "Evening", icon: Sunrise, time: "4PM - 11PM/12AM" },
    { value: "overnight", label: "Overnight", icon: Moon, time: "11PM/12AM - 8AM" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg border">
      {/* House Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600">House:</span>
        <Select value={selectedHouseId} onValueChange={(value) => updateParams("house", value)}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Select house" />
          </SelectTrigger>
          <SelectContent>
            {houses.map((house) => (
              <SelectItem key={house.id} value={house.id}>
                {house.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Date:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal bg-white",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(parseISO(selectedDate), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? parseISO(selectedDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  updateParams("date", format(date, "yyyy-MM-dd"));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Shift Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Shift:</span>
        <div className="flex rounded-lg border bg-white p-1">
          {shifts.map((shift) => (
            <Button
              key={shift.value}
              variant={selectedShift === shift.value ? "default" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => updateParams("shift", shift.value)}
            >
              <shift.icon className="h-4 w-4" />
              {shift.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
