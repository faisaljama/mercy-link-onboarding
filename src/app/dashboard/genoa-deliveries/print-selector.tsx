"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, Home } from "lucide-react";

interface House {
  id: string;
  name: string;
}

export function PrintSelector({ houses }: { houses: House[] }) {
  const handlePrint = (houseId: string) => {
    window.open(`/dashboard/genoa-deliveries/print?houseId=${houseId}`, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Log
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select House to Print</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {houses.map((house) => (
          <DropdownMenuItem
            key={house.id}
            onClick={() => handlePrint(house.id)}
            className="cursor-pointer"
          >
            <Home className="mr-2 h-4 w-4" />
            {house.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
