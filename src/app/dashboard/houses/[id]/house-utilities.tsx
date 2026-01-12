"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Zap,
  Flame,
  Droplets,
  Wifi,
  Trash2,
  Wrench,
  Camera,
  Bug,
  Snowflake,
  MoreHorizontal,
  Plus,
  ExternalLink,
  Phone,
  CreditCard,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  Loader2,
} from "lucide-react";

interface HouseUtility {
  id: string;
  houseId: string;
  utilityType: string;
  providerName: string;
  websiteUrl: string | null;
  phoneNumber: string | null;
  accountNumber: string | null;
  loginUsername: string | null;
  loginPassword: string | null;
  securityQuestion1: string | null;
  securityAnswer1: string | null;
  securityQuestion2: string | null;
  securityAnswer2: string | null;
  securityQuestion3: string | null;
  securityAnswer3: string | null;
  isAutopay: boolean;
  paymentCard: string | null;
  serviceDay: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HouseUtilitiesProps {
  houseId: string;
  userRole: string;
}

const UTILITY_TYPES = [
  { value: "ELECTRIC", label: "Electric", icon: Zap, color: "text-yellow-600" },
  { value: "GAS", label: "Gas", icon: Flame, color: "text-orange-600" },
  { value: "WATER", label: "Water", icon: Droplets, color: "text-blue-600" },
  { value: "INTERNET", label: "Internet", icon: Wifi, color: "text-purple-600" },
  { value: "WIFI", label: "WiFi", icon: Wifi, color: "text-indigo-600" },
  { value: "TRASH", label: "Trash", icon: Trash2, color: "text-green-600" },
  { value: "MAINTENANCE", label: "Maintenance", icon: Wrench, color: "text-slate-600" },
  { value: "SECURITY_CAMERA", label: "Security Camera", icon: Camera, color: "text-red-600" },
  { value: "PEST_CONTROL", label: "Pest Control", icon: Bug, color: "text-amber-600" },
  { value: "SNOW_REMOVAL", label: "Snow Removal", icon: Snowflake, color: "text-cyan-600" },
  { value: "OTHER", label: "Other", icon: MoreHorizontal, color: "text-slate-500" },
];

const getUtilityConfig = (type: string) => {
  return UTILITY_TYPES.find((u) => u.value === type) || UTILITY_TYPES[UTILITY_TYPES.length - 1];
};

export function HouseUtilities({ houseId, userRole }: HouseUtilitiesProps) {
  const [utilities, setUtilities] = useState<HouseUtility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUtility, setEditingUtility] = useState<HouseUtility | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const isAdmin = userRole === "ADMIN";
  const canEdit = ["ADMIN", "DESIGNATED_COORDINATOR"].includes(userRole);

  const [formData, setFormData] = useState({
    utilityType: "",
    providerName: "",
    websiteUrl: "",
    phoneNumber: "",
    accountNumber: "",
    loginUsername: "",
    loginPassword: "",
    securityQuestion1: "",
    securityAnswer1: "",
    securityQuestion2: "",
    securityAnswer2: "",
    securityQuestion3: "",
    securityAnswer3: "",
    isAutopay: false,
    paymentCard: "",
    serviceDay: "",
    notes: "",
  });

  useEffect(() => {
    fetchUtilities();
  }, [houseId]);

  const fetchUtilities = async () => {
    try {
      const res = await fetch(`/api/houses/${houseId}/utilities`);
      if (res.ok) {
        const data = await res.json();
        setUtilities(data.utilities || []);
      }
    } catch (error) {
      console.error("Error fetching utilities:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      utilityType: "",
      providerName: "",
      websiteUrl: "",
      phoneNumber: "",
      accountNumber: "",
      loginUsername: "",
      loginPassword: "",
      securityQuestion1: "",
      securityAnswer1: "",
      securityQuestion2: "",
      securityAnswer2: "",
      securityQuestion3: "",
      securityAnswer3: "",
      isAutopay: false,
      paymentCard: "",
      serviceDay: "",
      notes: "",
    });
    setEditingUtility(null);
  };

  const handleOpenDialog = (utility?: HouseUtility) => {
    if (utility) {
      setEditingUtility(utility);
      setFormData({
        utilityType: utility.utilityType,
        providerName: utility.providerName,
        websiteUrl: utility.websiteUrl || "",
        phoneNumber: utility.phoneNumber || "",
        accountNumber: utility.accountNumber || "",
        loginUsername: utility.loginUsername || "",
        loginPassword: utility.loginPassword || "",
        securityQuestion1: utility.securityQuestion1 || "",
        securityAnswer1: utility.securityAnswer1 || "",
        securityQuestion2: utility.securityQuestion2 || "",
        securityAnswer2: utility.securityAnswer2 || "",
        securityQuestion3: utility.securityQuestion3 || "",
        securityAnswer3: utility.securityAnswer3 || "",
        isAutopay: utility.isAutopay,
        paymentCard: utility.paymentCard || "",
        serviceDay: utility.serviceDay || "",
        notes: utility.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.utilityType || !formData.providerName) {
      alert("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingUtility
        ? `/api/houses/${houseId}/utilities/${editingUtility.id}`
        : `/api/houses/${houseId}/utilities`;
      const method = editingUtility ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchUtilities();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save utility");
      }
    } catch (error) {
      console.error("Error saving utility:", error);
      alert("Failed to save utility");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (utilityId: string) => {
    if (!confirm("Are you sure you want to delete this utility?")) return;

    try {
      const res = await fetch(`/api/houses/${houseId}/utilities/${utilityId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUtilities();
      } else {
        alert("Failed to delete utility");
      }
    } catch (error) {
      console.error("Error deleting utility:", error);
    }
  };

  const togglePasswordVisibility = (utilityId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [utilityId]: !prev[utilityId],
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Utilities & Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">Loading utilities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Utilities & Services
        </CardTitle>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Utility
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUtility ? "Edit Utility" : "Add New Utility"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Utility Type *</Label>
                    <Select
                      value={formData.utilityType}
                      onValueChange={(v) => setFormData({ ...formData, utilityType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {UTILITY_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Provider Name *</Label>
                    <Input
                      value={formData.providerName}
                      onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                      placeholder="e.g., Xcel Energy"
                    />
                  </div>

                  <div>
                    <Label>Website URL</Label>
                    <Input
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Account Number - visible to Admin and DC */}
                  {canEdit && (
                    <>
                      <div className="col-span-2 pt-2 border-t">
                        <p className="text-sm font-medium text-slate-700 mb-3">Account Information</p>
                      </div>
                      <div className="col-span-2">
                        <Label>Account Number</Label>
                        <Input
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="Account #"
                        />
                      </div>
                    </>
                  )}

                  {/* Login Details - Admin Only */}
                  {isAdmin && (
                    <>
                      <div className="col-span-2 pt-2 border-t">
                        <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          Login Details (Admin Only)
                        </p>
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

                      <div className="col-span-2 pt-2 border-t">
                        <p className="text-sm font-medium text-slate-700 mb-3">Security Questions (Optional)</p>
                      </div>
                      <div className="col-span-2 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Question 1</Label>
                            <Input
                              value={formData.securityQuestion1}
                              onChange={(e) => setFormData({ ...formData, securityQuestion1: e.target.value })}
                              placeholder="e.g., Mother's maiden name"
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
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Question 2</Label>
                            <Input
                              value={formData.securityQuestion2}
                              onChange={(e) => setFormData({ ...formData, securityQuestion2: e.target.value })}
                              placeholder="e.g., First pet's name"
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
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Question 3</Label>
                            <Input
                              value={formData.securityQuestion3}
                              onChange={(e) => setFormData({ ...formData, securityQuestion3: e.target.value })}
                              placeholder="e.g., Favorite color"
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
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-span-2 pt-2 border-t">
                    <p className="text-sm font-medium text-slate-700 mb-3">Payment Info</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="autopay"
                      checked={formData.isAutopay}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAutopay: checked })}
                    />
                    <Label htmlFor="autopay">Autopay Enabled</Label>
                  </div>

                  <div>
                    <Label>Payment Card</Label>
                    <Input
                      value={formData.paymentCard}
                      onChange={(e) => setFormData({ ...formData, paymentCard: e.target.value })}
                      placeholder="e.g., US Bank 7875"
                    />
                  </div>

                  {formData.utilityType === "TRASH" && (
                    <div className="col-span-2">
                      <Label>Service/Pickup Day</Label>
                      <Input
                        value={formData.serviceDay}
                        onChange={(e) => setFormData({ ...formData, serviceDay: e.target.value })}
                        placeholder="e.g., Tuesday, Every other Monday"
                      />
                    </div>
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
                    {submitting ? "Saving..." : editingUtility ? "Update" : "Add Utility"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {utilities.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No utilities configured for this house
          </div>
        ) : (
          <div className="space-y-4">
            {utilities.map((utility) => {
              const config = getUtilityConfig(utility.utilityType);
              const Icon = config.icon;
              const showPassword = showPasswords[utility.id];

              return (
                <div
                  key={utility.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-slate-100`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{utility.providerName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {utility.isAutopay && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Autopay
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          {utility.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {utility.phoneNumber}
                            </span>
                          )}
                          {utility.websiteUrl && (
                            <a
                              href={utility.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Website
                            </a>
                          )}
                          {utility.paymentCard && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {utility.paymentCard}
                            </span>
                          )}
                          {utility.serviceDay && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {utility.serviceDay}
                            </span>
                          )}
                        </div>

                        {/* Account Number - visible to Admin and DC */}
                        {canEdit && utility.accountNumber && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <span className="font-medium text-blue-800">Account #: </span>
                            <span className="text-blue-700">{utility.accountNumber}</span>
                          </div>
                        )}

                        {/* Admin-only: Login details */}
                        {isAdmin && (utility.loginUsername || utility.loginPassword) && (
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-amber-800 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Login Details
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(utility.id)}
                                className="h-6 px-2"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <div className="space-y-1 text-amber-700">
                              {utility.loginUsername && (
                                <p>Username: {showPassword ? utility.loginUsername : "••••••••"}</p>
                              )}
                              {utility.loginPassword && (
                                <p>Password: {showPassword ? utility.loginPassword : "••••••••"}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Admin-only: Security Questions */}
                        {isAdmin && (utility.securityQuestion1 || utility.securityQuestion2 || utility.securityQuestion3) && (
                          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-purple-800 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Security Questions
                              </span>
                            </div>
                            <div className="space-y-2 text-purple-700">
                              {utility.securityQuestion1 && (
                                <div>
                                  <p className="text-xs text-purple-600">Q1: {utility.securityQuestion1}</p>
                                  <p className="font-medium">A: {showPassword ? utility.securityAnswer1 : "••••••••"}</p>
                                </div>
                              )}
                              {utility.securityQuestion2 && (
                                <div>
                                  <p className="text-xs text-purple-600">Q2: {utility.securityQuestion2}</p>
                                  <p className="font-medium">A: {showPassword ? utility.securityAnswer2 : "••••••••"}</p>
                                </div>
                              )}
                              {utility.securityQuestion3 && (
                                <div>
                                  <p className="text-xs text-purple-600">Q3: {utility.securityQuestion3}</p>
                                  <p className="font-medium">A: {showPassword ? utility.securityAnswer3 : "••••••••"}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {utility.notes && (
                          <p className="mt-2 text-sm text-slate-500">{utility.notes}</p>
                        )}
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(utility)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(utility.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
