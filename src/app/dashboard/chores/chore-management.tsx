"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Plus,
  Pencil,
  Trash2,
  Camera,
  Filter,
  Home,
  Loader2,
  RotateCcw,
  Users,
  User,
} from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  assignedHouses: { houseId: string }[];
}

interface Chore {
  id: string;
  name: string;
  description: string | null;
  category: string;
  shifts: string;
  requiresPhoto: boolean;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  assignedToIds: string;
  house: { id: string; name: string };
  createdBy: { id: string; name: string } | null;
}

interface ChoreManagementProps {
  houses: House[];
  staff: Staff[];
  chores: Chore[];
  categoryLabels: Record<string, string>;
  currentHouseFilter?: string;
}

const SHIFT_OPTIONS = [
  { value: "day", label: "Day (8am-4pm)" },
  { value: "evening", label: "Evening (4pm-12am)" },
  { value: "overnight", label: "Overnight (12am-8am)" },
];

const CATEGORIES = [
  "room_checks",
  "common_areas",
  "kitchen_meals",
  "medication_area",
  "safety",
  "laundry",
  "other",
];

export function ChoreManagement({
  houses,
  staff,
  chores,
  categoryLabels,
  currentHouseFilter,
}: ChoreManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [deleteChore, setDeleteChore] = useState<Chore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    houseId: "",
    name: "",
    description: "",
    category: "other",
    shifts: ["day", "evening", "overnight"],
    requiresPhoto: false,
    isRequired: true,
    sortOrder: 0,
    assignedToIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      houseId: "",
      name: "",
      description: "",
      category: "other",
      shifts: ["day", "evening", "overnight"],
      requiresPhoto: false,
      isRequired: true,
      sortOrder: 0,
      assignedToIds: [],
    });
    setError(null);
  };

  const openEditDialog = (chore: Chore) => {
    setFormData({
      houseId: chore.house.id,
      name: chore.name,
      description: chore.description || "",
      category: chore.category,
      shifts: JSON.parse(chore.shifts),
      requiresPhoto: chore.requiresPhoto,
      isRequired: chore.isRequired,
      sortOrder: chore.sortOrder,
      assignedToIds: JSON.parse(chore.assignedToIds || "[]"),
    });
    setEditingChore(chore);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!formData.houseId) {
      setError("Please select a house");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter a chore name");
      return;
    }

    if (formData.shifts.length === 0) {
      setError("Please select at least one shift");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingChore
        ? `/api/chores/${editingChore.id}`
        : "/api/chores";
      const method = editingChore ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save chore");
      }

      resetForm();
      setIsCreateOpen(false);
      setEditingChore(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save chore");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteChore) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/chores/${deleteChore.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete chore");
      }

      setDeleteChore(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chore");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (chore: Chore) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/chores/${chore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore chore");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateHouseFilter = (houseId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (houseId === "all") {
      params.delete("house");
    } else {
      params.set("house", houseId);
    }
    router.push(`/dashboard/chores?${params.toString()}`);
  };

  const toggleShift = (shift: string) => {
    setFormData((prev) => ({
      ...prev,
      shifts: prev.shifts.includes(shift)
        ? prev.shifts.filter((s) => s !== shift)
        : [...prev.shifts, shift],
    }));
  };

  const toggleStaff = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedToIds: prev.assignedToIds.includes(staffId)
        ? prev.assignedToIds.filter((id) => id !== staffId)
        : [...prev.assignedToIds, staffId],
    }));
  };

  // Filter staff by selected house
  const houseStaff = formData.houseId
    ? staff.filter((s) => s.assignedHouses.some((h) => h.houseId === formData.houseId))
    : [];

  // Filter chores
  const filteredChores = chores.filter((c) => {
    if (!showInactive && !c.isActive) return false;
    if (currentHouseFilter && c.house.id !== currentHouseFilter) return false;
    return true;
  });

  // Group by house then category
  const choresByHouse = filteredChores.reduce((acc, chore) => {
    const houseKey = chore.house.id;
    if (!acc[houseKey]) {
      acc[houseKey] = {
        house: chore.house,
        chores: [],
      };
    }
    acc[houseKey].chores.push(chore);
    return acc;
  }, {} as Record<string, { house: House; chores: Chore[] }>);

  const ChoreForm = () => (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="house">House *</Label>
          <Select
            value={formData.houseId}
            onValueChange={(v) => setFormData((p) => ({ ...p, houseId: v }))}
            disabled={!!editingChore}
          >
            <SelectTrigger>
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

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryLabels[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Chore Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g., Clean kitchen counters"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          placeholder="Detailed instructions for this chore..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Shifts *</Label>
        <div className="flex flex-wrap gap-2">
          {SHIFT_OPTIONS.map((shift) => (
            <label
              key={shift.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                formData.shifts.includes(shift.value)
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Checkbox
                checked={formData.shifts.includes(shift.value)}
                onCheckedChange={() => toggleShift(shift.value)}
              />
              <span className="text-sm">{shift.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Staff Assignment */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Assign to Staff
        </Label>
        {!formData.houseId ? (
          <p className="text-sm text-slate-500 italic">Select a house first to see available staff</p>
        ) : houseStaff.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No staff assigned to this house</p>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              Leave empty for anyone to complete, or select specific staff members
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
              {houseStaff.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                    formData.assignedToIds.includes(s.id)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Checkbox
                    checked={formData.assignedToIds.includes(s.id)}
                    onCheckedChange={() => toggleStaff(s.id)}
                  />
                  <User className="h-3 w-3" />
                  {s.firstName} {s.lastName}
                </label>
              ))}
            </div>
            {formData.assignedToIds.length > 0 && (
              <p className="text-xs text-blue-600">
                {formData.assignedToIds.length} staff member{formData.assignedToIds.length !== 1 ? "s" : ""} assigned
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={formData.requiresPhoto}
            onCheckedChange={(checked) =>
              setFormData((p) => ({ ...p, requiresPhoto: !!checked }))
            }
          />
          <div className="flex items-center gap-1">
            <Camera className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Requires Photo</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={formData.isRequired}
            onCheckedChange={(checked) =>
              setFormData((p) => ({ ...p, isRequired: !!checked }))
            }
          />
          <span className="text-sm font-medium">Required Chore</span>
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          type="number"
          value={formData.sortOrder}
          onChange={(e) =>
            setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))
          }
          className="w-24"
        />
        <p className="text-xs text-slate-500">Lower numbers appear first</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg border">
        <Filter className="h-4 w-4 text-slate-500" />

        <Select
          value={currentHouseFilter || "all"}
          onValueChange={updateHouseFilter}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="All houses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All houses</SelectItem>
            {houses.map((house) => (
              <SelectItem key={house.id} value={house.id}>
                {house.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(!!checked)}
          />
          <span className="text-sm text-slate-600">Show inactive</span>
        </label>

        <div className="flex-grow" />

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Chore
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Chore</DialogTitle>
              <DialogDescription>
                Create a new chore for staff to complete during their shifts.
              </DialogDescription>
            </DialogHeader>
            <ChoreForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Chore
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chores by House */}
      {Object.keys(choresByHouse).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Home className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No chores found</p>
            <p className="text-sm">Create your first chore to get started</p>
          </CardContent>
        </Card>
      ) : (
        Object.values(choresByHouse).map(({ house, chores: houseChores }) => (
          <Card key={house.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                {house.name}
              </CardTitle>
              <CardDescription>
                {houseChores.filter((c) => c.isActive).length} active chores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chore</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Shifts</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-center">Photo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {houseChores.map((chore) => {
                      const shifts = JSON.parse(chore.shifts) as string[];
                      const assignedIds = JSON.parse(chore.assignedToIds || "[]") as string[];
                      const assignedStaff = staff.filter((s) => assignedIds.includes(s.id));
                      return (
                        <TableRow
                          key={chore.id}
                          className={!chore.isActive ? "opacity-50" : ""}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{chore.name}</p>
                              {chore.description && (
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                  {chore.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {categoryLabels[chore.category]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {shifts.map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assignedStaff.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">Anyone</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {assignedStaff.slice(0, 2).map((s) => (
                                  <Badge key={s.id} variant="outline" className="text-xs">
                                    {s.firstName} {s.lastName[0]}.
                                  </Badge>
                                ))}
                                {assignedStaff.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{assignedStaff.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {chore.requiresPhoto ? (
                              <Camera className="h-4 w-4 text-purple-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {chore.isActive ? (
                              chore.isRequired ? (
                                <Badge className="bg-blue-100 text-blue-800">Required</Badge>
                              ) : (
                                <Badge variant="outline">Optional</Badge>
                              )
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {!chore.isActive ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRestore(chore)}
                                  disabled={isSubmitting}
                                  title="Restore"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(chore)}
                                    title="Edit"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteChore(chore)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingChore}
        onOpenChange={(open) => {
          if (!open) {
            setEditingChore(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Chore</DialogTitle>
            <DialogDescription>Update the chore details.</DialogDescription>
          </DialogHeader>
          <ChoreForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChore(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteChore} onOpenChange={() => setDeleteChore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteChore?.name}"? This chore will be
              marked as inactive and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
