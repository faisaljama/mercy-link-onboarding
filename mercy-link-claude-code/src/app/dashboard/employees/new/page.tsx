"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";

interface House {
  id: string;
  name: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [error, setError] = useState("");
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hireDate: new Date().toISOString().split("T")[0],
    position: "",
    experienceYears: "0",
  });

  useEffect(() => {
    fetch("/api/houses")
      .then((res) => res.json())
      .then((data) => setHouses(data.houses || []))
      .catch(console.error);
  }, []);

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
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          experienceYears: parseInt(formData.experienceYears),
          assignedHouseIds: selectedHouses,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create employee");
      }

      const { employee } = await res.json();
      router.push(`/dashboard/employees/${employee.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

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

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Add New Employee</h1>
        <p className="text-slate-500">Create a new staff member record</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the employee's personal details</CardDescription>
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
            </CardContent>
          </Card>

          {/* Position & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Position & Assignment</CardTitle>
              <CardDescription>Set role and house assignments</CardDescription>
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
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((years) => (
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
                <Select onValueChange={handleAddHouse}>
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
          <Link href="/dashboard/employees">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Employee
          </Button>
        </div>
      </form>
    </div>
  );
}
