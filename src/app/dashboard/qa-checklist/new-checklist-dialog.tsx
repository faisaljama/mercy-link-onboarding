"use client";

import { useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";

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

// Default checklist items by type
const checklistTemplates: Record<string, { label: string; category: string }[]> = {
  CRS_HOME_SAFETY: [
    // Emergency Procedures
    { label: "A list of emergency phone numbers is posted", category: "Emergency Procedures" },
    { label: "A written fire/emergency escape plan is posted", category: "Emergency Procedures" },
    { label: "An operable flashlight and radio or television set that does not require electricity", category: "Emergency Procedures" },
    { label: "Accessible first-aid supplies", category: "Emergency Procedures" },
    { label: "An operable telephone", category: "Emergency Procedures" },
    // Physical Environment
    { label: "Exit doors and windows are not obstructed and are easily opened from the inside", category: "Physical Environment" },
    { label: "The wiring appears safe; no known hazards exist", category: "Physical Environment" },
    { label: "Extension cords are appropriately used and are not used in place of permanent wiring", category: "Physical Environment" },
    { label: "A fire extinguisher with a minimum rating of 2A:10BC is maintained in the home", category: "Physical Environment" },
    { label: "All smoke detectors work and are properly installed on all levels of the home", category: "Physical Environment" },
    { label: "All interior doors can be unlocked from the outside and the opening device is readily accessible in case of emergency", category: "Physical Environment" },
    { label: "The home is clean and free from accumulations of dirt, grease, garbage, peeling paint, vermin and insects", category: "Physical Environment" },
    { label: "Outside property is free from debris and safety hazards. Exterior stairs and walkways are free of ice and snow", category: "Physical Environment" },
    { label: "When in use, fireplaces, wood burning stoves, and hot surfaces that could cause burns are protected by guards", category: "Physical Environment" },
    { label: "The heating system in the home is maintained in good working condition", category: "Physical Environment" },
    // Home Safety & Health
    { label: "Knives, tools, matches, and other potentially hazardous materials are not accessible to persons receiving services (as identified in service plans)", category: "Home Safety & Health" },
    { label: "Chemicals, detergents, and other toxic substances are not stored with food products or accessible in any way that poses a risk", category: "Home Safety & Health" },
    { label: "Combustible items are properly stored at least 36 inches from any heating sources", category: "Home Safety & Health" },
    { label: "Individual clean bed linens, towels, wash cloths are provided for each person receiving services", category: "Home Safety & Health" },
    { label: "Food is handled and properly stored to prevent contamination, spoilage, or a threat to health", category: "Home Safety & Health" },
    { label: "Schedule II controlled substances are stored in a locked storage area permitting access only by authorized persons", category: "Home Safety & Health" },
    { label: "There is a safe water supply in the home", category: "Home Safety & Health" },
    { label: "The water temperature does not exceed 120 degrees Fahrenheit to prevent scalding", category: "Home Safety & Health" },
    { label: "Weapons and ammunition are stored separately in locked areas that are not accessible or visible to persons receiving services", category: "Home Safety & Health" },
  ],
  MONTHLY_HOUSE: [
    { label: "Medication storage secure and organized", category: "Medications" },
    { label: "Medication administration records (MARs) current", category: "Medications" },
    { label: "Emergency contacts posted and current", category: "Safety" },
    { label: "Fire extinguisher accessible and inspected", category: "Safety" },
    { label: "Smoke detectors tested and working", category: "Safety" },
    { label: "First aid kit stocked", category: "Safety" },
    { label: "Emergency evacuation plan posted", category: "Safety" },
    { label: "House clean and maintained", category: "Environment" },
    { label: "Food properly stored and dated", category: "Environment" },
    { label: "Client personal items secure", category: "Client Rights" },
    { label: "Staff schedule posted", category: "Staffing" },
    { label: "Communication log current", category: "Documentation" },
    { label: "All client rent payments collected for the month", category: "Financial" },
    { label: "Rent collection records documented with payment method", category: "Financial" },
    { label: "DC sign-off completed for rent payments", category: "Financial" },
    { label: "All house expense receipts uploaded", category: "Financial" },
    { label: "House expenses properly categorized", category: "Financial" },
    { label: "Bill.com card reconciliation complete", category: "Financial" },
  ],
  QUARTERLY_CLIENT: [
    { label: "Service plan goals reviewed", category: "Service Plan" },
    { label: "Progress toward goals documented", category: "Service Plan" },
    { label: "Client satisfaction assessed", category: "Client Rights" },
    { label: "Rights reviewed with client", category: "Client Rights" },
    { label: "Medical appointments current", category: "Health" },
    { label: "Medications reviewed for changes", category: "Health" },
    { label: "Behavioral support plan current (if applicable)", category: "Behavior" },
    { label: "Incident reports reviewed", category: "Documentation" },
    { label: "Emergency contact info verified", category: "Documentation" },
    { label: "Rent payments current for the quarter", category: "Financial" },
    { label: "No outstanding rent balance", category: "Financial" },
    { label: "Payment history reviewed with client (if applicable)", category: "Financial" },
  ],
  ANNUAL_REVIEW: [
    { label: "All staff training current", category: "Staffing" },
    { label: "Background studies current for all staff", category: "Staffing" },
    { label: "House license current", category: "Licensing" },
    { label: "All client service plans current", category: "Service Plans" },
    { label: "Annual planning meetings completed", category: "Service Plans" },
    { label: "Policy and procedure manual updated", category: "Policies" },
    { label: "Emergency procedures reviewed", category: "Safety" },
    { label: "Quality improvement goals set", category: "Quality" },
    { label: "Incident trend analysis completed", category: "Quality" },
    { label: "Client satisfaction surveys completed", category: "Quality" },
    { label: "Annual rent collection summary complete", category: "Financial" },
    { label: "All rent discrepancies resolved", category: "Financial" },
    { label: "Annual expense report documented", category: "Financial" },
    { label: "Financial record keeping audit completed", category: "Financial" },
  ],
  INCIDENT_FOLLOWUP: [
    { label: "Incident properly documented", category: "Documentation" },
    { label: "Root cause identified", category: "Analysis" },
    { label: "Corrective actions implemented", category: "Actions" },
    { label: "Staff debriefed/trained as needed", category: "Actions" },
    { label: "Follow-up monitoring in place", category: "Monitoring" },
    { label: "Required notifications completed", category: "Reporting" },
  ],
};

export function NewChecklistDialog({
  houses,
  clients,
}: {
  houses: House[];
  clients: Client[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    checklistType: "",
    houseId: "",
    clientId: "",
    reviewDate: new Date().toISOString().split("T")[0],
    overallNotes: "",
  });

  const [checklistItems, setChecklistItems] = useState<
    { label: string; category: string; value: string; notes: string }[]
  >([]);

  const handleTypeChange = (type: string) => {
    setFormData({ ...formData, checklistType: type });
    const template = checklistTemplates[type] || [];
    setChecklistItems(
      template.map((item) => ({
        ...item,
        value: "",
        notes: "",
      }))
    );
  };

  const updateItem = (index: number, field: string, value: string) => {
    setChecklistItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/qa-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reviewDate: new Date(formData.reviewDate).toISOString(),
          items: checklistItems,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checklist");
      }

      const data = await res.json();
      setOpen(false);
      router.push(`/dashboard/qa-checklist/${data.checklist.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checklist");
    } finally {
      setLoading(false);
    }
  };

  const needsHouse = formData.checklistType === "CRS_HOME_SAFETY" || formData.checklistType === "MONTHLY_HOUSE" || formData.checklistType === "ANNUAL_REVIEW";
  const needsClient = formData.checklistType === "QUARTERLY_CLIENT";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Checklist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New QA Checklist</DialogTitle>
            <DialogDescription>
              Create a new quality assurance review checklist
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checklistType">Checklist Type *</Label>
                <Select
                  value={formData.checklistType}
                  onValueChange={handleTypeChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRS_HOME_SAFETY">CRS Home Safety Checklist (Monthly)</SelectItem>
                    <SelectItem value="MONTHLY_HOUSE">Monthly House Review</SelectItem>
                    <SelectItem value="QUARTERLY_CLIENT">Quarterly Client Review</SelectItem>
                    <SelectItem value="ANNUAL_REVIEW">Annual Review</SelectItem>
                    <SelectItem value="INCIDENT_FOLLOWUP">Incident Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewDate">Review Date *</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={formData.reviewDate}
                  onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {needsHouse && (
              <div className="space-y-2">
                <Label htmlFor="houseId">House *</Label>
                <Select
                  value={formData.houseId}
                  onValueChange={(value) => setFormData({ ...formData, houseId: value })}
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
            )}

            {needsClient && (
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName} ({client.house.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {checklistItems.length > 0 && (
              <div className="space-y-4">
                <Label>Checklist Items</Label>
                <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <Select
                          value={item.value}
                          onValueChange={(value) => updateItem(index, "value", value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YES">Yes</SelectItem>
                            <SelectItem value="NO">No</SelectItem>
                            <SelectItem value="NA">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {item.value === "NO" && (
                        <Input
                          placeholder="Notes (required for 'No' items)"
                          value={item.notes}
                          onChange={(e) => updateItem(index, "notes", e.target.value)}
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="overallNotes">Overall Notes</Label>
              <Textarea
                id="overallNotes"
                value={formData.overallNotes}
                onChange={(e) => setFormData({ ...formData, overallNotes: e.target.value })}
                placeholder="Additional observations or comments..."
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.checklistType || (needsHouse && !formData.houseId) || (needsClient && !formData.clientId)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Checklist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
