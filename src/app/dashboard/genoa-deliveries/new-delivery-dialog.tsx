"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Plus, Loader2, Upload, X, Image } from "lucide-react";

interface House {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  house: {
    id: string;
    name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

export function NewDeliveryDialog({
  houses,
  clients,
  employees,
}: {
  houses: House[];
  clients: Client[];
  employees: Employee[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    houseId: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    deliveryTime: new Date().toTimeString().slice(0, 5),
    receivedById: "",
    clientId: "",
    isAllResidents: false,
    medicationsMatch: null as boolean | null,
    medicationsMatchNotes: "",
    properlyStored: null as boolean | null,
    properlyStoredNotes: "",
    notes: "",
  });

  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);

  // Filter clients by selected house
  const filteredClients = formData.houseId
    ? clients.filter((c) => c.house.id === formData.houseId)
    : clients;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("type", "photo");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload photo");
        }

        const data = await res.json();
        setPhotos((prev) => [...prev, { url: data.url, name: file.name }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/genoa-deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          manifestPhotos: photos.map((p) => p.url),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create delivery record");
      }

      const data = await res.json();
      setOpen(false);
      router.push(`/dashboard/genoa-deliveries/${data.delivery.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create delivery");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      houseId: "",
      deliveryDate: new Date().toISOString().split("T")[0],
      deliveryTime: new Date().toTimeString().slice(0, 5),
      receivedById: "",
      clientId: "",
      isAllResidents: false,
      medicationsMatch: null,
      medicationsMatchNotes: "",
      properlyStored: null,
      properlyStoredNotes: "",
      notes: "",
    });
    setPhotos([]);
    setError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Delivery
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Genoa Delivery</DialogTitle>
            <DialogDescription>
              Record a new medication delivery from Genoa Pharmacy
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="houseId">House *</Label>
                <Select
                  value={formData.houseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, houseId: value, clientId: "" })
                  }
                  required
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
                <Label htmlFor="receivedById">Received By *</Label>
                <Select
                  value={formData.receivedById}
                  onValueChange={(value) =>
                    setFormData({ ...formData, receivedById: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Delivery Time *</Label>
                <Input
                  id="deliveryTime"
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-3">
              <Label>Recipient</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAllResidents"
                  checked={formData.isAllResidents}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isAllResidents: checked as boolean,
                      clientId: checked ? "" : formData.clientId,
                    })
                  }
                />
                <label
                  htmlFor="isAllResidents"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  All Residents Monthly Delivery
                </label>
              </div>

              {!formData.isAllResidents && (
                <div className="space-y-2">
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clientId: value })
                    }
                    required={!formData.isAllResidents}
                    disabled={!formData.houseId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          formData.houseId
                            ? "Select client"
                            : "Select house first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <Label>Delivery Manifest Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  ) : (
                    <Upload className="h-8 w-8 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-600">
                    {uploading
                      ? "Uploading..."
                      : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-slate-400">
                    JPG, PNG, GIF up to 10MB each
                  </span>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-slate-900">
                Verification of Medications
              </h3>

              <div className="space-y-3">
                <Label>
                  Did the medications match the delivery manifest? *
                </Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={
                      formData.medicationsMatch === true ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        medicationsMatch: true,
                        medicationsMatchNotes: "",
                      })
                    }
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formData.medicationsMatch === false ? "destructive" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, medicationsMatch: false })
                    }
                  >
                    No
                  </Button>
                </div>
                {formData.medicationsMatch === false && (
                  <Textarea
                    placeholder="Explain what didn't match (required)"
                    value={formData.medicationsMatchNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medicationsMatchNotes: e.target.value,
                      })
                    }
                    required
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label>
                  Were the medications stored properly in grey Genoa delivery box
                  in office? *
                </Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={
                      formData.properlyStored === true ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        properlyStored: true,
                        properlyStoredNotes: "",
                      })
                    }
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formData.properlyStored === false ? "destructive" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, properlyStored: false })
                    }
                  >
                    No
                  </Button>
                </div>
                {formData.properlyStored === false && (
                  <Textarea
                    placeholder="Explain why medications were not stored properly (required)"
                    value={formData.properlyStoredNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        properlyStoredNotes: e.target.value,
                      })
                    }
                    required
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional observations or notes..."
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.houseId ||
                !formData.receivedById ||
                (!formData.isAllResidents && !formData.clientId) ||
                formData.medicationsMatch === null ||
                formData.properlyStored === null ||
                (formData.medicationsMatch === false && !formData.medicationsMatchNotes) ||
                (formData.properlyStored === false && !formData.properlyStoredNotes)
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Delivery
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
