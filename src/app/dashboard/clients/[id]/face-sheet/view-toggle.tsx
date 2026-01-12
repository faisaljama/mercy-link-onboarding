"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInternal = searchParams.get("view") === "internal";

  const toggleView = () => {
    const newView = isInternal ? "external" : "internal";
    router.push(`?view=${newView}`);
  };

  return (
    <Button
      variant={isInternal ? "default" : "outline"}
      size="sm"
      onClick={toggleView}
      className={isInternal ? "bg-purple-600 hover:bg-purple-700" : ""}
    >
      {isInternal ? (
        <>
          <Eye className="mr-2 h-4 w-4" />
          Internal View
        </>
      ) : (
        <>
          <EyeOff className="mr-2 h-4 w-4" />
          External View
        </>
      )}
    </Button>
  );
}
