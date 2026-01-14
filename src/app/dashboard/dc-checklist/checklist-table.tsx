"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Home,
  Eye,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
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
import Link from "next/link";
import { format } from "date-fns";

interface Checklist {
  id: string;
  houseId: string;
  date: Date;
  visitType: string;
  notes: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  house: {
    id: string;
    name: string;
  };
  // Remote task counts
  remoteLogNotesReviewed: boolean;
  remoteGmailChecked: boolean;
  remoteAppointmentsReviewed: boolean;
  remoteCalendarUpdated: boolean;
  remoteScheduleVerified: boolean;
  remoteClockInReviewed: boolean;
  remoteControlledSubstances: boolean;
  remoteMedsAdministered: boolean;
  remoteProgressNotesReviewed: boolean;
  remotePrnDocumented: boolean;
  remoteIncidentReportsReviewed: boolean;
  remoteAppointmentsFollowUp: boolean;
  remoteStaffTrainingChecked: boolean;
  remoteEveningMedsReviewed: boolean;
  remoteNarcoticCountsVerified: boolean;
  // Onsite tasks
  onsiteClockedIn: boolean;
  onsiteHandoffReviewed: boolean;
  onsiteVerbalHandoff: boolean;
  onsiteNarcoticCount: boolean;
  onsitePettyCashCount: boolean;
  onsiteMedQuantitiesReviewed: boolean;
  onsitePrnMedsChecked: boolean;
  onsiteOverflowBinsChecked: boolean;
  onsitePharmacyDeliveryReviewed: boolean;
  onsiteMedStorageChecked: boolean;
  onsiteGlucometerSupplies: boolean;
  onsiteStaffInteractions: boolean;
  onsiteRoomsClean: boolean;
  onsiteDietaryFollowed: boolean;
  onsiteActivitiesObserved: boolean;
  onsiteResidentSpoken: boolean;
  onsiteReceiptBinderReviewed: boolean;
  onsiteResidentBindersReviewed: boolean;
  onsiteAfterVisitSummaries: boolean;
  onsiteOutcomeTracker: boolean;
  onsiteFireDrillBinder: boolean;
  onsiteCommonAreasCleaned: boolean;
  onsiteFoodLabeled: boolean;
  onsiteSuppliesStocked: boolean;
  onsiteBathroomsCleaned: boolean;
  onsiteGarbageChecked: boolean;
  onsiteIpadCharged: boolean;
  onsiteDoorsSecure: boolean;
  onsiteWaterSoftener: boolean;
  onsiteFurnaceFilter: boolean;
  onsiteExteriorChecked: boolean;
  onsiteStaffCoaching: boolean;
}

interface House {
  id: string;
  name: string;
}

export function ChecklistTable({
  checklists,
  houses,
  currentMonth,
  currentYear,
  currentUserId,
  currentUserRole,
}: {
  checklists: Checklist[];
  houses: House[];
  currentMonth: number;
  currentYear: number;
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedHouse, setSelectedHouse] = useState(searchParams.get("houseId") || "all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = currentUserRole === "ADMIN";

  const canDelete = (checklist: Checklist) => {
    // Admin can delete any checklist
    if (isAdmin) return true;
    // Creator can delete their own checklist
    return checklist.createdBy.id === currentUserId;
  };

  const handleDeleteClick = (checklist: Checklist) => {
    setChecklistToDelete(checklist);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!checklistToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dc-checklist/${checklistToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete checklist");
        return;
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      console.error("Error deleting checklist:", error);
      alert("Failed to delete checklist");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChecklistToDelete(null);
    }
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === "prev") {
      newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    } else {
      newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth.toString());
    params.set("year", newYear.toString());
    router.push(`/dashboard/dc-checklist?${params.toString()}`);
  };

  const handleHouseChange = (houseId: string) => {
    setSelectedHouse(houseId);
    const params = new URLSearchParams(searchParams.toString());
    if (houseId === "all") {
      params.delete("houseId");
    } else {
      params.set("houseId", houseId);
    }
    router.push(`/dashboard/dc-checklist?${params.toString()}`);
  };

  if (checklists.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleMonthChange("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(new Date(currentYear, currentMonth - 1), "MMMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => handleMonthChange("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select value={selectedHouse} onValueChange={handleHouseChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All houses" />
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
        </div>
        <div className="text-center py-8 text-slate-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p>No checklists found for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMonthChange("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(new Date(currentYear, currentMonth - 1), "MMMM yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={() => handleMonthChange("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Select value={selectedHouse} onValueChange={handleHouseChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All houses" />
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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>House</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checklists.map((checklist) => (
              <TableRow key={checklist.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {format(new Date(checklist.date), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  {checklist.visitType === "REMOTE" ? (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      <Eye className="h-3 w-3 mr-1" />
                      Remote
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <MapPin className="h-3 w-3 mr-1" />
                      Onsite
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-slate-400" />
                    {checklist.house.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{checklist.createdBy.name}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/dc-checklist/${checklist.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    {canDelete(checklist) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(checklist)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this checklist from{" "}
              <span className="font-medium">{checklistToDelete?.house.name}</span> on{" "}
              <span className="font-medium">
                {checklistToDelete && format(new Date(checklistToDelete.date), "MMM d, yyyy")}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
