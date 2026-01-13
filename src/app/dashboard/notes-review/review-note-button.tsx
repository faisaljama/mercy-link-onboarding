"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReviewNoteButtonProps {
  noteId: string;
}

export function ReviewNoteButton({ noteId }: ReviewNoteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleReview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shift-notes/${noteId}/review`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to review note");
      }

      router.refresh();
    } catch (error) {
      console.error("Error reviewing note:", error);
      alert("Failed to mark note as reviewed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1"
      onClick={handleReview}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      {isLoading ? "Reviewing..." : "Mark Reviewed"}
    </Button>
  );
}
