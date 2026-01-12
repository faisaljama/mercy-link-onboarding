"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

export function PrintActions() {
  const router = useRouter();

  return (
    <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
      <Button
        variant="outline"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Button onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Print / Save as PDF
      </Button>
    </div>
  );
}
