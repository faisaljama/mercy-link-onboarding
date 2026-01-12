"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Printer } from "lucide-react";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function BillingReportsPrintSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePrint = (month?: string, year?: string) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    const queryString = params.toString();
    const url = queryString
      ? `/dashboard/billing/reports/print?${queryString}`
      : "/dashboard/billing/reports/print";
    router.push(url);
  };

  const currentYear = new Date().getFullYear();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handlePrint()}>
          All Reports
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
          {currentYear} by Month
        </div>
        {MONTHS.map((month) => (
          <DropdownMenuItem
            key={month.value}
            onClick={() => handlePrint(month.value, String(currentYear))}
          >
            {month.label} {currentYear}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
