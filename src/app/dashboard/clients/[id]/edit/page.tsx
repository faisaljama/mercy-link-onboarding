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
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

interface House {
  id: string;
  name: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  admissionDate: string;
  houseId: string;
  waiverType: string | null;
  status: string;
  caseManagerName: string | null;
  caseManagerEmail: string | null;
  caseManagerPhone: string | null;
  legalRepName: string | null;
  legalRepPhone: string | null;
}

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [error, setError] = useState("");
  const [client, setClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    admissionDate: "",
    houseId: "",
    waiverType: "",
    status: "ACTIVE",
    caseManagerName: "",
    caseManagerEmail: "",
    caseManagerPhone: "",
    legalRepName: "",
    legalRepPhone: "",
  });

  useEffect(() => {
    fetchClient();
    fetchHouses();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setFormData({
          firstName: data.client.firstName,
          lastName: data.client.lastName,
          dob: new Date(data.client.dob).toISOString().split("T")[0],
          admissionDate: new Date(data.client.admissionDate).toISOString().split("T")[0],
          houseId: data.client.houseId,
          waiverType: data.client.waiverType || "",
          status: data.client.status,
          caseManagerName: data.client.caseManagerName || "",
          caseManagerEmail: data.client.caseManagerEmail || "",
          caseManagerPhone: data.client.caseManagerPhone || "",
          legalRepName: data.client.legalRepName || "",
          legalRepPhone: data.client.legalRepPhone || "",
        });
      } else {
        setError("Client not found");
      }
    } catch (error) {
      console.error("Failed to fetch client:", error);
      setError("Failed to load client");
    } finally {
      setLoadingClient(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update client");
      }

      router.push(`/dashboard/clients/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/clients");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      setError("Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!client) {
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
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Client not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/clients/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Client
            </Button>
          </Link>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Client
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{client.firstName} {client.lastName}</strong>?
                This will permanently remove all their compliance records and documents. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Client"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Edit Client</h1>
        <p className="text-slate-500">Update {client.firstName} {client.lastName}'s information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the client's personal details</CardDescription>
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

              <div className="grid gap-4 sm:grid-cols-2">
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
                      <SelectItem value="DISCHARGED">Discharged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
          <Link href={`/dashboard/clients/${id}`}>
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
