"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

interface ChecklistItem {
  label: string;
  category: string;
  value: string;
  notes: string;
}

interface QAChecklist {
  id: string;
  checklistType: string;
  houseId: string | null;
  clientId: string | null;
  reviewDate: Date;
  reviewedBy: string;
  status: string;
  items: string;
  overallNotes: string | null;
  followUpRequired: boolean;
  followUpDate: Date | null;
  followUpNotes: string | null;
}

export function UpdateChecklistForm({
  checklist,
  items: initialItems,
}: {
  checklist: QAChecklist;
  items: ChecklistItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [overallNotes, setOverallNotes] = useState(checklist.overallNotes || "");
  const [followUpRequired, setFollowUpRequired] = useState(checklist.followUpRequired);
  const [followUpDate, setFollowUpDate] = useState(
    checklist.followUpDate
      ? new Date(checklist.followUpDate).toISOString().split("T")[0]
      : ""
  );
  const [followUpNotes, setFollowUpNotes] = useState(checklist.followUpNotes || "");

  const updateItem = (index: number, field: string, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/qa-checklist/${checklist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          overallNotes,
          followUpRequired,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
          followUpNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update checklist");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update checklist");
    } finally {
      setLoading(false);
    }
  };

  // Group items by category for display
  const itemsByCategory = items.reduce((acc, item, index) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, (ChecklistItem & { originalIndex: number })[]>);

  const categories = Object.keys(itemsByCategory);

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Update Checklist</CardTitle>
          <CardDescription>Complete any remaining items and add notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Checklist Items */}
          {categories.map((category) => (
            <div key={category}>
              <h4 className="font-medium text-slate-700 mb-3">{category}</h4>
              <div className="space-y-3">
                {itemsByCategory[category].map((item) => (
                  <div key={item.originalIndex} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium flex-1">{item.label}</p>
                      <Select
                        value={item.value}
                        onValueChange={(value) => updateItem(item.originalIndex, "value", value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">Yes</SelectItem>
                          <SelectItem value="NO">No</SelectItem>
                          <SelectItem value="NA">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {item.value === "NO" && (
                      <Input
                        placeholder="Notes (required for 'No' items)"
                        value={item.notes}
                        onChange={(e) => updateItem(item.originalIndex, "notes", e.target.value)}
                        className="mt-2 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Overall Notes */}
          <div className="space-y-2">
            <Label htmlFor="overallNotes">Overall Notes</Label>
            <Textarea
              id="overallNotes"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="Additional observations or comments..."
              rows={3}
            />
          </div>

          {/* Follow-up */}
          <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followUpRequired"
                checked={followUpRequired}
                onCheckedChange={(checked) => setFollowUpRequired(checked === true)}
              />
              <Label htmlFor="followUpRequired">Follow-up Required</Label>
            </div>

            {followUpRequired && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                  <Textarea
                    id="followUpNotes"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="What needs to be addressed..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
