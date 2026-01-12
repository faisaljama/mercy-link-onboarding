"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface House {
  id: string;
  name: string;
  address: string;
  county: string;
  licenseNumber: string | null;
  capacity: number;
  _count: {
    clients: number;
    employees: number;
  };
}

export default function EditHousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingHouse, setLoadingHouse] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [house, setHouse] = useState<House | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    county: "",
    licenseNumber: "",
    capacity: "4",
  });

  useEffect(() => {
    fetchHouse();
  }, [id]);

  const fetchHouse = async () => {
    try {
      const res = await fetch(`/api/houses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setHouse(data.house);
        setFormData({
          name: data.house.name,
          address: data.house.address,
          county: data.house.county,
          licenseNumber: data.house.licenseNumber || "",
          capacity: data.house.capacity.toString(),
        });
      } else {
        setError("House not found");
      }
    } catch (error) {
      console.error("Failed to fetch house:", error);
      setError("Failed to load house");
    } finally {
      setLoadingHouse(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/houses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update house");
      }

      router.push(`/dashboard/houses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update house");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/houses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/houses");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete house");
      }
    } catch (error) {
      console.error("Error deleting house:", error);
      setError("Failed to delete house");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingHouse) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!house) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/houses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Houses
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            House not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveClients = house._count.clients > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/houses/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to House
            </Button>
          </Link>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={hasActiveClients}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete House
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete House</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{house.name}</strong>?
                This will remove the house and all associated user assignments. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete House"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Edit House</h1>
        <p className="text-slate-500">Update {house.name} information</p>
      </div>

      {hasActiveClients && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">House has active clients</p>
            <p className="text-sm text-amber-700">
              This house has {house._count.clients} active client{house._count.clients !== 1 ? "s" : ""}.
              You must discharge or transfer all clients before deleting this house.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>House Information</CardTitle>
            <CardDescription>Update the CRS location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">House Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cedar House"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 1234 Main St, Burnsville, MN 55337"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="county">County *</Label>
                <Select
                  value={formData.county}
                  onValueChange={(value) => setFormData({ ...formData, county: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dakota">Dakota</SelectItem>
                    <SelectItem value="Hennepin">Hennepin</SelectItem>
                    <SelectItem value="Ramsey">Ramsey</SelectItem>
                    <SelectItem value="Anoka">Anoka</SelectItem>
                    <SelectItem value="Washington">Washington</SelectItem>
                    <SelectItem value="Scott">Scott</SelectItem>
                    <SelectItem value="Carver">Carver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Select
                  value={formData.capacity}
                  onValueChange={(value) => setFormData({ ...formData, capacity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} residents
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g., 245D-123456"
              />
              <p className="text-xs text-slate-500">
                DHS 245D license number (optional)
              </p>
            </div>

            {/* House Stats (read-only info) */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-slate-700 mb-3">Current Assignments</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">{house._count.clients}</p>
                  <p className="text-xs text-slate-500">Active Clients</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">{house._count.employees}</p>
                  <p className="text-xs text-slate-500">Staff Assigned</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/dashboard/houses/${id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
