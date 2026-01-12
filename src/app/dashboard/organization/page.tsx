"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Search,
  CreditCard,
  Plus,
  ExternalLink,
  Phone,
  MapPin,
  Wifi,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Loader2,
  Printer,
} from "lucide-react";

interface OrganizationCredential {
  id: string;
  category: string;
  name: string;
  address: string | null;
  phone: string | null;
  fax: string | null;
  websiteUrl: string | null;
  loginUsername: string | null;
  loginPassword: string | null;
  accountNumber: string | null;
  securityQuestion1: string | null;
  securityAnswer1: string | null;
  securityQuestion2: string | null;
  securityAnswer2: string | null;
  securityQuestion3: string | null;
  securityAnswer3: string | null;
  wifiNetwork: string | null;
  wifiPassword: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "OFFICE", label: "Office", icon: Building2, color: "text-blue-600", bgColor: "bg-blue-100" },
  { value: "HR_SYSTEM", label: "HR System", icon: Search, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "BILLING_SYSTEM", label: "Billing System", icon: CreditCard, color: "text-purple-600", bgColor: "bg-purple-100" },
  { value: "OTHER", label: "Other", icon: Lock, color: "text-slate-600", bgColor: "bg-slate-100" },
];

const getCategoryConfig = (category: string) => {
  return CATEGORIES.find((c) => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
};

export default function OrganizationPage() {
  const [credentials, setCredentials] = useState<OrganizationCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<OrganizationCredential | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    category: "",
    name: "",
    address: "",
    phone: "",
    fax: "",
    websiteUrl: "",
    loginUsername: "",
    loginPassword: "",
    accountNumber: "",
    securityQuestion1: "",
    securityAnswer1: "",
    securityQuestion2: "",
    securityAnswer2: "",
    securityQuestion3: "",
    securityAnswer3: "",
    wifiNetwork: "",
    wifiPassword: "",
    notes: "",
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials || []);
      } else if (res.status === 403) {
        // User doesn't have access
        setCredentials([]);
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      name: "",
      address: "",
      phone: "",
      fax: "",
      websiteUrl: "",
      loginUsername: "",
      loginPassword: "",
      accountNumber: "",
      securityQuestion1: "",
      securityAnswer1: "",
      securityQuestion2: "",
      securityAnswer2: "",
      securityQuestion3: "",
      securityAnswer3: "",
      wifiNetwork: "",
      wifiPassword: "",
      notes: "",
    });
    setEditingCredential(null);
  };

  const handleOpenDialog = (credential?: OrganizationCredential) => {
    if (credential) {
      setEditingCredential(credential);
      setFormData({
        category: credential.category,
        name: credential.name,
        address: credential.address || "",
        phone: credential.phone || "",
        fax: credential.fax || "",
        websiteUrl: credential.websiteUrl || "",
        loginUsername: credential.loginUsername || "",
        loginPassword: credential.loginPassword || "",
        accountNumber: credential.accountNumber || "",
        securityQuestion1: credential.securityQuestion1 || "",
        securityAnswer1: credential.securityAnswer1 || "",
        securityQuestion2: credential.securityQuestion2 || "",
        securityAnswer2: credential.securityAnswer2 || "",
        securityQuestion3: credential.securityQuestion3 || "",
        securityAnswer3: credential.securityAnswer3 || "",
        wifiNetwork: credential.wifiNetwork || "",
        wifiPassword: credential.wifiPassword || "",
        notes: credential.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.name) {
      alert("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCredential
        ? `/api/organization/${editingCredential.id}`
        : "/api/organization";
      const method = editingCredential ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchCredentials();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save credential");
      }
    } catch (error) {
      console.error("Error saving credential:", error);
      alert("Failed to save credential");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;

    try {
      const res = await fetch(`/api/organization/${credentialId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCredentials();
      } else {
        alert("Failed to delete credential");
      }
    } catch (error) {
      console.error("Error deleting credential:", error);
    }
  };

  const toggleSecrets = (credentialId: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [credentialId]: !prev[credentialId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">Loading organization data...</span>
      </div>
    );
  }

  // Group credentials by category
  const groupedCredentials = credentials.reduce((acc, cred) => {
    if (!acc[cred.category]) {
      acc[cred.category] = [];
    }
    acc[cred.category].push(cred);
    return acc;
  }, {} as Record<string, OrganizationCredential[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organization Hub</h1>
          <p className="text-slate-500">Manage office info, system logins, and credentials</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCredential ? "Edit Credential" : "Add New Credential"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${cat.color}`} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Office, NetStudy, MN-ITS"
                  />
                </div>

                {/* Office-specific fields */}
                {formData.category === "OFFICE" && (
                  <>
                    <div className="col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main Street, City, State ZIP"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label>Fax</Label>
                      <Input
                        value={formData.fax}
                        onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                        placeholder="(555) 123-4568"
                      />
                    </div>
                    <div>
                      <Label>WiFi Network</Label>
                      <Input
                        value={formData.wifiNetwork}
                        onChange={(e) => setFormData({ ...formData, wifiNetwork: e.target.value })}
                        placeholder="Network SSID"
                      />
                    </div>
                    <div>
                      <Label>WiFi Password</Label>
                      <Input
                        value={formData.wifiPassword}
                        onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                        placeholder="WiFi password"
                      />
                    </div>
                  </>
                )}

                {/* System login fields */}
                {(formData.category === "HR_SYSTEM" || formData.category === "BILLING_SYSTEM" || formData.category === "OTHER") && (
                  <>
                    <div className="col-span-2">
                      <Label>Website URL</Label>
                      <Input
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={formData.loginUsername}
                        onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                        placeholder="Username/Email"
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="text"
                        value={formData.loginPassword}
                        onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                        placeholder="Password"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Account Number</Label>
                      <Input
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="Account or ID number"
                      />
                    </div>

                    {/* Security Questions */}
                    <div className="col-span-2 pt-2 border-t">
                      <p className="text-sm font-medium text-slate-700 mb-3">Security Questions (Optional)</p>
                    </div>
                    <div>
                      <Label className="text-xs">Question 1</Label>
                      <Input
                        value={formData.securityQuestion1}
                        onChange={(e) => setFormData({ ...formData, securityQuestion1: e.target.value })}
                        placeholder="Security question"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Answer 1</Label>
                      <Input
                        value={formData.securityAnswer1}
                        onChange={(e) => setFormData({ ...formData, securityAnswer1: e.target.value })}
                        placeholder="Answer"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Question 2</Label>
                      <Input
                        value={formData.securityQuestion2}
                        onChange={(e) => setFormData({ ...formData, securityQuestion2: e.target.value })}
                        placeholder="Security question"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Answer 2</Label>
                      <Input
                        value={formData.securityAnswer2}
                        onChange={(e) => setFormData({ ...formData, securityAnswer2: e.target.value })}
                        placeholder="Answer"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Question 3</Label>
                      <Input
                        value={formData.securityQuestion3}
                        onChange={(e) => setFormData({ ...formData, securityQuestion3: e.target.value })}
                        placeholder="Security question"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Answer 3</Label>
                      <Input
                        value={formData.securityAnswer3}
                        onChange={(e) => setFormData({ ...formData, securityAnswer3: e.target.value })}
                        placeholder="Answer"
                        className="text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingCredential ? "Update" : "Add Credential"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {credentials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No credentials yet</h3>
            <p className="text-slate-500 mb-4">Add your first organization credential to get started.</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Credential
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((category) => {
            const categoryCredentials = groupedCredentials[category.value] || [];
            if (categoryCredentials.length === 0) return null;

            const CategoryIcon = category.icon;

            return (
              <div key={category.value}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded ${category.bgColor}`}>
                    <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{category.label}</h2>
                  <Badge variant="outline">{categoryCredentials.length}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {categoryCredentials.map((credential) => {
                    const showSecret = showSecrets[credential.id];
                    const hasSecurityQuestions = credential.securityQuestion1 || credential.securityQuestion2 || credential.securityQuestion3;

                    return (
                      <Card key={credential.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{credential.name}</CardTitle>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSecrets(credential.id)}
                                className="h-8 px-2"
                              >
                                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(credential)}
                                className="h-8 px-2"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(credential.id)}
                                className="h-8 px-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Office fields */}
                          {credential.address && (
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                              <span>{credential.address}</span>
                            </div>
                          )}
                          {credential.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-slate-400" />
                              <span>{credential.phone}</span>
                            </div>
                          )}
                          {credential.fax && (
                            <div className="flex items-center gap-2 text-sm">
                              <Printer className="h-4 w-4 text-slate-400" />
                              <span>Fax: {credential.fax}</span>
                            </div>
                          )}

                          {/* WiFi */}
                          {(credential.wifiNetwork || credential.wifiPassword) && (
                            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded text-sm">
                              <div className="flex items-center gap-1 font-medium text-indigo-800 mb-1">
                                <Wifi className="h-3 w-3" />
                                WiFi
                              </div>
                              <div className="space-y-1 text-indigo-700">
                                {credential.wifiNetwork && (
                                  <p>Network: {credential.wifiNetwork}</p>
                                )}
                                {credential.wifiPassword && (
                                  <p>Password: {showSecret ? credential.wifiPassword : "••••••••"}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Website */}
                          {credential.websiteUrl && (
                            <a
                              href={credential.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {credential.websiteUrl}
                            </a>
                          )}

                          {/* Login credentials */}
                          {(credential.loginUsername || credential.loginPassword || credential.accountNumber) && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                              <div className="flex items-center gap-1 font-medium text-amber-800 mb-1">
                                <Lock className="h-3 w-3" />
                                Login Details
                              </div>
                              <div className="space-y-1 text-amber-700">
                                {credential.accountNumber && (
                                  <p>Account: {showSecret ? credential.accountNumber : "••••••••"}</p>
                                )}
                                {credential.loginUsername && (
                                  <p>Username: {showSecret ? credential.loginUsername : "••••••••"}</p>
                                )}
                                {credential.loginPassword && (
                                  <p>Password: {showSecret ? credential.loginPassword : "••••••••"}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Security Questions */}
                          {hasSecurityQuestions && (
                            <div className="p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                              <div className="flex items-center gap-1 font-medium text-purple-800 mb-1">
                                <Lock className="h-3 w-3" />
                                Security Questions
                              </div>
                              <div className="space-y-2 text-purple-700">
                                {credential.securityQuestion1 && (
                                  <div>
                                    <p className="text-xs text-purple-600">Q1: {credential.securityQuestion1}</p>
                                    <p className="font-medium">A: {showSecret ? credential.securityAnswer1 : "••••••••"}</p>
                                  </div>
                                )}
                                {credential.securityQuestion2 && (
                                  <div>
                                    <p className="text-xs text-purple-600">Q2: {credential.securityQuestion2}</p>
                                    <p className="font-medium">A: {showSecret ? credential.securityAnswer2 : "••••••••"}</p>
                                  </div>
                                )}
                                {credential.securityQuestion3 && (
                                  <div>
                                    <p className="text-xs text-purple-600">Q3: {credential.securityQuestion3}</p>
                                    <p className="font-medium">A: {showSecret ? credential.securityAnswer3 : "••••••••"}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {credential.notes && (
                            <p className="text-sm text-slate-500 italic">{credential.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
