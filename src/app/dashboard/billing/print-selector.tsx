"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Printer } from "lucide-react";

interface House {
  id: string;
  name: string;
}

export function PrintSelector({ houses }: { houses: House[] }) {
  const router = useRouter();

  const handlePrint = (houseId?: string) => {
    const url = houseId
      ? `/dashboard/billing/print?houseId=${houseId}`
      : "/dashboard/billing/print";
    router.push(url);
  };

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
          All Houses
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {houses.map((house) => (
          <DropdownMenuItem key={house.id} onClick={() => handlePrint(house.id)}>
            {house.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
