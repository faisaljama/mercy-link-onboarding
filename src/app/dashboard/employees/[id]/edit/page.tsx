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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, X, Trash2 } from "lucide-react";
import Link from "next/link";

interface House {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  hireDate: string;
  position: string;
  experienceYears: number;
  status: string;
  assignedHouses: { house: House }[];
}

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hireDate: "",
    position: "",
    experienceYears: "0",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchEmployee();
    fetchHouses();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/employees/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
        setFormData({
          firstName: data.employee.firstName,
          lastName: data.employee.lastName,
          email: data.employee.email || "",
          phone: data.employee.phone || "",
          hireDate: new Date(data.employee.hireDate).toISOString().split("T")[0],
          position: data.employee.position,
          experienceYears: data.employee.experienceYears.toString(),
          status: data.employee.status,
        });
        setSelectedHouses(data.employee.assignedHouses.map((ah: { house: House }) => ah.house.id));
      } else {
        setError("Employee not found");
      }
    } catch (error) {
      console.error("Failed to fetch employee:", error);
      setError("Failed to load employee");
    } finally {
      setLoadingEmployee(false);
    }
  };

  const fetchHouses = async () => {
    try {
      const res = await fetch("/api/houses");
      if (res.ok) {
        const data = await res.json();
        setHouses(data.houses || []);
      }
    } catch (error) {
      console.error("Failed to fetch houses:", error);
    }
  };

  const handleAddHouse = (houseId: string) => {
    if (!selectedHouses.includes(houseId)) {
      setSelectedHouses([...selectedHouses, houseId]);
    }
  };

  const handleRemoveHouse = (houseId: string) => {
    setSelectedHouses(selectedHouses.filter((id) => id !== houseId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (selectedHouses.length === 0) {
      setError("Please assign at least one house");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          experienceYears: parseInt(formData.experienceYears),
          assignedHouseIds: selectedHouses,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update employee");
      }

      router.push(`/dashboard/employees/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/employees");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete employee");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      setError("Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingEmployee) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employees">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Employee not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/employees/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employee
            </Button>
          </Link>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Employee
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{employee.firstName} {employee.lastName}</strong>?
                This will permanently remove all their training records and documents. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Employee"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Edit Employee</h1>
        <p className="text-slate-500">Update {employee.firstName} {employee.lastName}'s information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the employee's personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Position & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Position & Assignment</CardTitle>
              <CardDescription>Update role and house assignments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DSP">Direct Support Professional (DSP)</SelectItem>
                    <SelectItem value="LEAD_DSP">Lead DSP</SelectItem>
                    <SelectItem value="DC">Designated Coordinator (DC)</SelectItem>
                    <SelectItem value="DM">Designated Manager (DM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears">Years of Experience</Label>
                <Select
                  value={formData.experienceYears}
                  onValueChange={(value) => setFormData({ ...formData, experienceYears: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30].map((years) => (
                      <SelectItem key={years} value={years.toString()}>
                        {years} {years === 1 ? "year" : "years"}
                        {years >= 5 && " (12hr annual training)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Employees with 5+ years experience require 12 hours annual training vs 24 hours
                </p>
              </div>

              <div className="space-y-2">
                <Label>Assigned Houses *</Label>
                <Select onValueChange={handleAddHouse} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Add house assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {houses
                      .filter((h) => !selectedHouses.includes(h.id))
                      .map((house) => (
                        <SelectItem key={house.id} value={house.id}>
                          {house.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {selectedHouses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedHouses.map((houseId) => {
                      const house = houses.find((h) => h.id === houseId);
                      return (
                        <Badge key={houseId} variant="secondary" className="gap-1">
                          {house?.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveHouse(houseId)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {selectedHouses.length === 0 && (
                  <p className="text-xs text-red-500">At least one house must be assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <Link href={`/dashboard/employees/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
