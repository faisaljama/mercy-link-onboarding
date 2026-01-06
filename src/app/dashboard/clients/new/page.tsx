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
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface House {
  id: string;
  name: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    admissionDate: new Date().toISOString().split("T")[0],
    houseId: "",
    waiverType: "",
    caseManagerName: "",
    caseManagerEmail: "",
    caseManagerPhone: "",
    legalRepName: "",
    legalRepPhone: "",
  });

  useEffect(() => {
    fetch("/api/houses")
      .then((res) => res.json())
      .then((data) => setHouses(data.houses || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create client");
      }

      const { client } = await res.json();
      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Add New Client</h1>
        <p className="text-slate-500">Create a new service recipient record</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the client's personal details</CardDescription>
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
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date *</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="house">Assigned House *</Label>
                <Select
                  value={formData.houseId}
                  onValueChange={(value) => setFormData({ ...formData, houseId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a house" />
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
                <Label htmlFor="waiverType">Waiver Type</Label>
                <Select
                  value={formData.waiverType}
                  onValueChange={(value) => setFormData({ ...formData, waiverType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select waiver type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD">DD (Developmental Disabilities)</SelectItem>
                    <SelectItem value="CADI">CADI (Community Alternative Care)</SelectItem>
                    <SelectItem value="BI">BI (Brain Injury)</SelectItem>
                    <SelectItem value="CAC">CAC (Community Access for Disability Inclusion)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Case manager and legal representative details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-700">Case Manager</h4>
                <div className="space-y-2">
                  <Label htmlFor="caseManagerName">Name</Label>
                  <Input
                    id="caseManagerName"
                    value={formData.caseManagerName}
                    onChange={(e) => setFormData({ ...formData, caseManagerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseManagerEmail">Email</Label>
                  <Input
                    id="caseManagerEmail"
                    type="email"
                    value={formData.caseManagerEmail}
                    onChange={(e) => setFormData({ ...formData, caseManagerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseManagerPhone">Phone</Label>
                  <Input
                    id="caseManagerPhone"
                    type="tel"
                    value={formData.caseManagerPhone}
                    onChange={(e) => setFormData({ ...formData, caseManagerPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-700">Legal Representative</h4>
                <div className="space-y-2">
                  <Label htmlFor="legalRepName">Name</Label>
                  <Input
                    id="legalRepName"
                    value={formData.legalRepName}
                    onChange={(e) => setFormData({ ...formData, legalRepName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalRepPhone">Phone</Label>
                  <Input
                    id="legalRepPhone"
                    type="tel"
                    value={formData.legalRepPhone}
                    onChange={(e) => setFormData({ ...formData, legalRepPhone: e.target.value })}
                  />
                </div>
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
          <Link href="/dashboard/clients">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Client
          </Button>
        </div>
      </form>
    </div>
  );
}
