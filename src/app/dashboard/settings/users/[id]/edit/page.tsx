"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Home } from "lucide-react";
import Link from "next/link";

interface House {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedHouses: { house: House }[];
}

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState("");
  const [houses, setHouses] = useState<House[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "LEAD_STAFF",
    houseIds: [] as string[],
  });

  useEffect(() => {
    fetchUser();
    fetchHouses();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          password: "",
          confirmPassword: "",
          role: data.user.role,
          houseIds: data.user.assignedHouses.map((ah: { house: House }) => ah.house.id),
        });
      } else {
        setError("User not found");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setError("Failed to load user");
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchHouses = async () => {
    try {
      const res = await fetch("/api/houses");
      if (res.ok) {
        const data = await res.json();
        setHouses(data.houses);
      }
    } catch (error) {
      console.error("Failed to fetch houses:", error);
    }
  };

  const handleHouseToggle = (houseId: string) => {
    setFormData((prev) => ({
      ...prev,
      houseIds: prev.houseIds.includes(houseId)
        ? prev.houseIds.filter((id) => id !== houseId)
        : [...prev.houseIds, houseId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match if changing password
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length if changing password
    if (formData.password && formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        houseIds: formData.role === "ADMIN" ? [] : formData.houseIds,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }

      router.push("/dashboard/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            User not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Edit User</h1>
        <p className="text-slate-500">Update user account details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Update the user details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@mercylink.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD_STAFF">Lead Staff (DSP)</SelectItem>
                    <SelectItem value="DESIGNATED_COORDINATOR">Designated Coordinator (DC)</SelectItem>
                    <SelectItem value="DESIGNATED_MANAGER">Designated Manager (DM)</SelectItem>
                    <SelectItem value="OPERATIONS">Operations</SelectItem>
                    <SelectItem value="HR">Human Resources (HR)</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {formData.role === "ADMIN" && "Full access to all houses, settings, and admin functions"}
                  {formData.role === "DESIGNATED_MANAGER" && "Manager-level access for assigned houses"}
                  {formData.role === "DESIGNATED_COORDINATOR" && "Coordinator access for managing compliance"}
                  {formData.role === "OPERATIONS" && "Operations team member access"}
                  {formData.role === "HR" && "Human Resources access"}
                  {formData.role === "FINANCE" && "Finance and billing access"}
                  {formData.role === "LEAD_STAFF" && "Lead Staff can view assigned houses"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Leave blank to keep the current password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.role !== "ADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle>House Assignments</CardTitle>
                <CardDescription>
                  Select which houses this user can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {houses.length === 0 ? (
                  <div className="py-4 text-center text-slate-500">
                    No houses available.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {houses.map((house) => (
                      <div
                        key={house.id}
                        className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-slate-50"
                      >
                        <Checkbox
                          id={house.id}
                          checked={formData.houseIds.includes(house.id)}
                          onCheckedChange={() => handleHouseToggle(house.id)}
                        />
                        <label
                          htmlFor={house.id}
                          className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1"
                        >
                          <Home className="h-4 w-4 text-slate-400" />
                          {house.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/settings">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
