"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Home,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Camera,
  Loader2,
  Phone,
  Copy,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface PrnItem {
  id: string;
  medicationName: string;
  quantityRemaining: number;
  expirationDate: Date;
  photoUrl: string | null;
  notes: string | null;
  client: { id: string; firstName: string; lastName: string };
  house: { id: string; name: string };
  updatedBy: { id: string; name: string };
  updatedAt: Date;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  houseId: string;
  house: { name: string };
}

interface PrnInventorySectionProps {
  inventory: PrnItem[];
  residents: Resident[];
  lowStockThreshold: number;
}

const GENOA_PHONE = "651-583-7097";

export function PrnInventorySection({
  inventory,
  residents,
  lowStockThreshold,
}: PrnInventorySectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<PrnItem | null>(null);

  // Form state
  const [selectedResident, setSelectedResident] = useState<string>("");
  const [medicationName, setMedicationName] = useState("");
  const [quantityRemaining, setQuantityRemaining] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Low stock alert state
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [lowStockItem, setLowStockItem] = useState<{
    medicationName: string;
    clientName: string;
    quantity: number;
    prnInventoryId: string;
  } | null>(null);
  const [acknowledgmentType, setAcknowledgmentType] = useState<string>("");
  const [acknowledgmentNotes, setAcknowledgmentNotes] = useState("");
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const selectedResidentData = residents.find((r) => r.id === selectedResident);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setSelectedResident("");
    setMedicationName("");
    setQuantityRemaining("");
    setExpirationDate("");
    setNotes("");
    setPhoto(null);
    setPhotoPreview(null);
    setError(null);
    setEditingItem(null);
  };

  const openEditDialog = (item: PrnItem) => {
    setEditingItem(item);
    setSelectedResident(item.client.id);
    setMedicationName(item.medicationName);
    setQuantityRemaining(item.quantityRemaining.toString());
    setExpirationDate(format(new Date(item.expirationDate), "yyyy-MM-dd"));
    setNotes(item.notes || "");
    setPhotoPreview(item.photoUrl);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!editingItem && !selectedResident) {
      setError("Please select a resident");
      return;
    }

    if (!medicationName.trim() || medicationName.trim().length < 2) {
      setError("Medication name must be at least 2 characters");
      return;
    }

    const qty = parseInt(quantityRemaining);
    if (isNaN(qty) || qty < 0) {
      setError("Quantity must be 0 or greater");
      return;
    }

    if (!expirationDate) {
      setError("Expiration date is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (!editingItem) {
        formData.append("clientId", selectedResident);
      }
      formData.append("medicationName", medicationName.trim());
      formData.append("quantityRemaining", qty.toString());
      formData.append("expirationDate", expirationDate);
      formData.append("notes", notes);
      if (photo) {
        formData.append("photo", photo);
      }

      const url = editingItem
        ? `/api/medications/prn/${editingItem.id}`
        : "/api/medications/prn";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save PRN item");
      }

      const data = await response.json();

      // Check if low stock alert should be shown
      if (data.isLowStock && qty <= lowStockThreshold) {
        const resident = residents.find((r) => r.id === (editingItem?.client.id || selectedResident));
        setLowStockItem({
          medicationName: medicationName.trim(),
          clientName: resident ? `${resident.firstName} ${resident.lastName}` : "Unknown",
          quantity: qty,
          prnInventoryId: data.prnItem.id,
        });
        setShowLowStockAlert(true);
      }

      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PRN item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!acknowledgmentType) {
      return;
    }

    if (acknowledgmentType === "other" && !acknowledgmentNotes.trim()) {
      return;
    }

    setIsAcknowledging(true);

    try {
      const response = await fetch("/api/medications/prn/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prnInventoryId: lowStockItem?.prnInventoryId,
          acknowledgmentType,
          acknowledgmentNotes,
          alertType: "popup",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to acknowledge alert");
      }

      setShowLowStockAlert(false);
      setLowStockItem(null);
      setAcknowledgmentType("");
      setAcknowledgmentNotes("");
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(GENOA_PHONE);
  };

  // Group inventory by resident
  const groupedInventory = inventory.reduce((acc, item) => {
    const key = `${item.client.id}-${item.house.id}`;
    if (!acc[key]) {
      acc[key] = {
        client: item.client,
        house: item.house,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { client: PrnItem["client"]; house: PrnItem["house"]; items: PrnItem[] }>);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                PRN Inventory
              </CardTitle>
              <CardDescription>
                Track PRN medication quantities (Alert when ≤{lowStockThreshold})
              </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add PRN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit PRN Medication" : "Add PRN Medication"}
                  </DialogTitle>
                  <DialogDescription>
                    Track PRN medication quantity for a resident.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Resident Selection */}
                  {!editingItem && (
                    <div className="space-y-2">
                      <Label htmlFor="resident">Resident *</Label>
                      <Select value={selectedResident} onValueChange={setSelectedResident}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resident" />
                        </SelectTrigger>
                        <SelectContent>
                          {residents.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.firstName} {r.lastName} ({r.house.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Auto-populated House */}
                  {(selectedResidentData || editingItem) && (
                    <div className="space-y-2">
                      <Label>House</Label>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border text-sm">
                        <Home className="h-4 w-4 text-slate-400" />
                        {editingItem?.house.name || selectedResidentData?.house.name}
                      </div>
                    </div>
                  )}

                  {/* Medication Name */}
                  <div className="space-y-2">
                    <Label htmlFor="medicationName">Medication Name *</Label>
                    <Input
                      id="medicationName"
                      value={medicationName}
                      onChange={(e) => setMedicationName(e.target.value)}
                      placeholder="e.g., Tylenol 500mg"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity Remaining *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={quantityRemaining}
                      onChange={(e) => setQuantityRemaining(e.target.value)}
                      placeholder="0"
                    />
                    {quantityRemaining && parseInt(quantityRemaining) <= lowStockThreshold && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low stock alert will be triggered
                      </p>
                    )}
                  </div>

                  {/* Expiration Date */}
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiration Date *</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                    {expirationDate && new Date(expirationDate) < new Date() && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        This medication is expired
                      </p>
                    )}
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label>Photo of PRN Bottle (Optional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {photoPreview ? (
                        <div className="space-y-2">
                          <img
                            src={photoPreview}
                            alt="PRN bottle preview"
                            className="max-h-32 mx-auto rounded"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPhoto(null);
                              setPhotoPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <Camera className="h-6 w-6" />
                            <span className="text-sm">Click to upload photo</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                      rows={2}
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingItem ? "Update PRN" : "Save PRN"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedInventory).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No PRN medications tracked</p>
              <p className="text-sm">Add a PRN item to start tracking</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.values(groupedInventory).map((group) => (
                <div key={`${group.client.id}-${group.house.id}`} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-medium text-xs">
                        {group.client.firstName[0]}{group.client.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {group.client.firstName} {group.client.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{group.house.name}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isLowStock = item.quantityRemaining <= lowStockThreshold;
                      const isExpired = new Date(item.expirationDate) < new Date();

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 rounded ${
                            isLowStock ? "bg-red-50" : "bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-sm">{item.medicationName}</p>
                            <p className="text-xs text-slate-500">
                              Exp: {format(new Date(item.expirationDate), "MM/yyyy")}
                              {isExpired && (
                                <span className="text-red-600 ml-1">(Expired)</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={isLowStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                              {isLowStock ? (
                                <>
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  {item.quantityRemaining} LOW
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  {item.quantityRemaining}
                                </>
                              )}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert Modal */}
      <Dialog open={showLowStockAlert} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Low PRN Inventory Alert
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-slate-700">
              <strong>{lowStockItem?.medicationName}</strong> for{" "}
              <strong>{lowStockItem?.clientName}</strong> has only{" "}
              <strong>{lowStockItem?.quantity}</strong> remaining.
            </p>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Call Genoa Pharmacy to reorder:</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-900">{GENOA_PHONE}</span>
                <Button variant="outline" size="sm" onClick={copyPhone}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Number
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Please confirm action taken:</p>
              <div className="space-y-2">
                {[
                  { value: "called", label: "I have called Genoa to reorder" },
                  { value: "closed", label: "Pharmacy was closed - will call back" },
                  { value: "on_order", label: "Medication is already on order" },
                  { value: "other", label: "Other (explain in notes)" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      acknowledgmentType === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="acknowledgmentType"
                      value={option.value}
                      checked={acknowledgmentType === option.value}
                      onChange={(e) => setAcknowledgmentType(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>

              {acknowledgmentType === "other" && (
                <Textarea
                  value={acknowledgmentNotes}
                  onChange={(e) => setAcknowledgmentNotes(e.target.value)}
                  placeholder="Please explain..."
                  rows={2}
                />
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleAcknowledge}
              disabled={
                !acknowledgmentType ||
                (acknowledgmentType === "other" && !acknowledgmentNotes.trim()) ||
                isAcknowledging
              }
            >
              {isAcknowledging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Acknowledge & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
