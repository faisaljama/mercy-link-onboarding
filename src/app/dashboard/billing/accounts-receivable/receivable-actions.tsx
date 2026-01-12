"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";

export function ReceivableActions({
  receivableId,
  currentStatus,
  isAdmin,
}: {
  receivableId: string;
  currentStatus: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCollectDialog, setShowCollectDialog] = useState(false);
  const [showWriteOffDialog, setShowWriteOffDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [collectAmount, setCollectAmount] = useState("");
  const [notes, setNotes] = useState("");

  const updateStatus = async (status: string, data?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts-receivable/${receivableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...data }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setLoading(false);
      setShowCollectDialog(false);
      setShowWriteOffDialog(false);
      setCollectAmount("");
      setNotes("");
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts-receivable/${receivableId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (currentStatus !== "PENDING") {
    return <span className="text-slate-400 text-sm">-</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowCollectDialog(true)}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
            Mark Collected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("RESOLVED", { resolvedNotes: "Issue resolved" })}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
            Mark Resolved
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowWriteOffDialog(true)}>
            <XCircle className="mr-2 h-4 w-4 text-slate-600" />
            Write Off
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Collect Dialog */}
      <Dialog open={showCollectDialog} onOpenChange={setShowCollectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Collected</DialogTitle>
            <DialogDescription>
              Record the amount collected for this receivable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount Collected</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Collection notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateStatus("COLLECTED", {
                  amountCollected: parseFloat(collectAmount) || 0,
                  resolvedNotes: notes,
                })
              }
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write Off Dialog */}
      <Dialog open={showWriteOffDialog} onOpenChange={setShowWriteOffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write Off Receivable</DialogTitle>
            <DialogDescription>
              Mark this receivable as uncollectable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Write-Off</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for writing off this amount..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWriteOffDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateStatus("WRITTEN_OFF", { resolvedNotes: notes })}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Write Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this accounts receivable entry?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
