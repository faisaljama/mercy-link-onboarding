"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, AlertTriangle, PenTool } from "lucide-react";
import { SignaturePadComponent } from "@/components/signature-pad";

interface House {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface ViolationCategory {
  id: string;
  categoryName: string;
  severityLevel: string;
  defaultPoints: number;
}

interface GroupedCategories {
  MINOR: ViolationCategory[];
  MODERATE: ViolationCategory[];
  SERIOUS: ViolationCategory[];
  CRITICAL: ViolationCategory[];
  IMMEDIATE_TERMINATION: ViolationCategory[];
}

interface NewActionDialogProps {
  houses: House[];
  employees: Employee[];
}

export function NewActionDialog({ houses, employees }: NewActionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<GroupedCategories | null>(null);
  const [employeePoints, setEmployeePoints] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ViolationCategory | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    houseId: "",
    violationCategoryId: "",
    violationDate: new Date().toISOString().split("T")[0],
    violationTime: "",
    incidentDescription: "",
    hasMitigating: false,
    mitigatingCircumstances: "",
    pointsAssigned: 0,
    pointsAdjusted: null as number | null,
    adjustmentReason: "",
    correctiveExpectations: [] as string[],
    consequencesText: "Further violations may result in additional disciplinary action up to and including termination of employment.",
    pipScheduled: false,
    pipDate: "",
    supervisorSignature: null as string | null,
  });

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/violation-categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.grouped);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch employee points when employee changes
  useEffect(() => {
    async function fetchPoints() {
      if (!formData.employeeId) {
        setEmployeePoints(null);
        return;
      }
      try {
        const res = await fetch(`/api/employees/${formData.employeeId}/points`);
        if (res.ok) {
          const data = await res.json();
          setEmployeePoints(data.currentPoints);
        }
      } catch (error) {
        console.error("Failed to fetch points:", error);
      }
    }
    fetchPoints();
  }, [formData.employeeId]);

  // Update points when category changes
  useEffect(() => {
    if (selectedCategory) {
      setFormData((prev) => ({
        ...prev,
        pointsAssigned: selectedCategory.defaultPoints,
      }));
    }
  }, [selectedCategory]);

  const handleCategorySelect = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, violationCategoryId: categoryId }));

    // Find the selected category
    if (categories) {
      const allCategories = [
        ...(categories.MINOR || []),
        ...(categories.MODERATE || []),
        ...(categories.SERIOUS || []),
        ...(categories.CRITICAL || []),
        ...(categories.IMMEDIATE_TERMINATION || []),
      ];
      const category = allCategories.find((c) => c.id === categoryId);
      setSelectedCategory(category || null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/corrective-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pointsAdjusted: formData.hasMitigating ? formData.pointsAdjusted : null,
          supervisorSignature: formData.supervisorSignature,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOpen(false);
        resetForm();
        router.refresh();
        router.push(`/dashboard/discipline/${data.action.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create corrective action");
      }
    } catch (error) {
      console.error("Error creating action:", error);
      alert("Failed to create corrective action");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      employeeId: "",
      houseId: "",
      violationCategoryId: "",
      violationDate: new Date().toISOString().split("T")[0],
      violationTime: "",
      incidentDescription: "",
      hasMitigating: false,
      mitigatingCircumstances: "",
      pointsAssigned: 0,
      pointsAdjusted: null,
      adjustmentReason: "",
      correctiveExpectations: [],
      consequencesText: "Further violations may result in additional disciplinary action up to and including termination of employment.",
      pipScheduled: false,
      pipDate: "",
      supervisorSignature: null,
    });
    setSelectedCategory(null);
    setEmployeePoints(null);
  };

  const canProceedStep1 = formData.employeeId && formData.violationCategoryId && formData.violationDate;
  const canProceedStep2 = formData.incidentDescription.length >= 50;
  const newTotalPoints = (employeePoints || 0) + (formData.hasMitigating && formData.pointsAdjusted !== null ? formData.pointsAdjusted : formData.pointsAssigned);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Corrective Action
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Corrective Action</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {step === 1 ? "Employee & Violation" : step === 2 ? "Incident Details" : step === 3 ? "Review" : "Supervisor Signature"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Employee & Violation */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, employeeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.lastName}, {emp.firstName} ({emp.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {employeePoints !== null && (
                <p className="text-sm mt-1">
                  Current points: <span className={employeePoints >= 14 ? "text-red-600 font-bold" : employeePoints >= 10 ? "text-orange-600 font-medium" : ""}>{employeePoints}/18</span>
                </p>
              )}
            </div>

            <div>
              <Label>Site Where Violation Occurred</Label>
              <Select
                value={formData.houseId || "none"}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, houseId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific site</SelectItem>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Violation Date *</Label>
                <Input
                  type="date"
                  value={formData.violationDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, violationDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Violation Time</Label>
                <Input
                  type="time"
                  value={formData.violationTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, violationTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Violation Category *</Label>
              <Select
                value={formData.violationCategoryId}
                onValueChange={handleCategorySelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select violation..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {categories && (
                    <>
                      {categories.MINOR?.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50">
                            MINOR (1-2 pts)
                          </div>
                          {categories.MINOR.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.categoryName} ({cat.defaultPoints} pt{cat.defaultPoints !== 1 ? "s" : ""})
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {categories.MODERATE?.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-yellow-600 bg-yellow-50">
                            MODERATE (3-4 pts)
                          </div>
                          {categories.MODERATE.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.categoryName} ({cat.defaultPoints} pts)
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {categories.SERIOUS?.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-50">
                            SERIOUS (5-6 pts)
                          </div>
                          {categories.SERIOUS.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.categoryName} ({cat.defaultPoints} pts)
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {categories.CRITICAL?.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50">
                            CRITICAL (8-10 pts)
                          </div>
                          {categories.CRITICAL.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.categoryName} ({cat.defaultPoints} pts)
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {categories.IMMEDIATE_TERMINATION?.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-white bg-red-600">
                            IMMEDIATE TERMINATION REVIEW
                          </div>
                          {categories.IMMEDIATE_TERMINATION.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.categoryName}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Points to assign:</span>
                    <Badge>{formData.pointsAssigned} pts</Badge>
                  </div>
                  {employeePoints !== null && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">New total:</span>
                      <span className={`font-bold ${newTotalPoints >= 18 ? "text-red-600" : newTotalPoints >= 14 ? "text-orange-600" : ""}`}>
                        {newTotalPoints}/18 pts
                      </span>
                    </div>
                  )}
                  {newTotalPoints >= 14 && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">
                        {newTotalPoints >= 18 ? "Employee will reach TERMINATION level" : "Employee will reach FINAL WARNING level"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 2: Incident Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Description of Incident *</Label>
              <Textarea
                value={formData.incidentDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, incidentDescription: e.target.value }))}
                placeholder="Provide detailed description of what occurred, including specific times, locations, and any witnesses present..."
                rows={5}
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.incidentDescription.length}/50 characters minimum
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mitigating"
                checked={formData.hasMitigating}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, hasMitigating: checked as boolean }))
                }
              />
              <label htmlFor="mitigating" className="text-sm font-medium">
                Mitigating circumstances apply
              </label>
            </div>

            {formData.hasMitigating && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label>Mitigating Circumstances</Label>
                  <Textarea
                    value={formData.mitigatingCircumstances}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, mitigatingCircumstances: e.target.value }))
                    }
                    placeholder="Describe the mitigating circumstances..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Adjusted Points</Label>
                  <Input
                    type="number"
                    min={0}
                    max={formData.pointsAssigned}
                    value={formData.pointsAdjusted ?? formData.pointsAssigned}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pointsAdjusted: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Original points: {formData.pointsAssigned}
                  </p>
                </div>
                <div>
                  <Label>Adjustment Justification *</Label>
                  <Textarea
                    value={formData.adjustmentReason}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, adjustmentReason: e.target.value }))
                    }
                    placeholder="Explain why points are being adjusted..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <h4 className="font-medium">Review Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-500">Employee:</div>
                <div>{employees.find((e) => e.id === formData.employeeId)?.lastName}, {employees.find((e) => e.id === formData.employeeId)?.firstName}</div>

                <div className="text-slate-500">Violation:</div>
                <div>{selectedCategory?.categoryName}</div>

                <div className="text-slate-500">Date:</div>
                <div>{formData.violationDate}</div>

                <div className="text-slate-500">Points:</div>
                <div className="font-medium">
                  {formData.hasMitigating && formData.pointsAdjusted !== null
                    ? `${formData.pointsAdjusted} (adjusted from ${formData.pointsAssigned})`
                    : formData.pointsAssigned}
                </div>

                <div className="text-slate-500">New Total:</div>
                <div className={`font-bold ${newTotalPoints >= 18 ? "text-red-600" : newTotalPoints >= 14 ? "text-orange-600" : ""}`}>
                  {newTotalPoints}/18 pts
                </div>
              </div>
            </div>

            <div>
              <Label>Corrective Expectations</Label>
              <Textarea
                value={formData.correctiveExpectations.join("\n")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    correctiveExpectations: e.target.value.split("\n").filter(Boolean),
                  }))
                }
                placeholder="Enter expectations, one per line..."
                rows={3}
              />
            </div>

            <div>
              <Label>Consequences of Further Violations</Label>
              <Textarea
                value={formData.consequencesText}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, consequencesText: e.target.value }))
                }
                rows={2}
              />
            </div>

            {newTotalPoints >= 14 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pip"
                  checked={formData.pipScheduled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, pipScheduled: checked as boolean }))
                  }
                />
                <label htmlFor="pip" className="text-sm font-medium">
                  Schedule Performance Improvement Plan (PIP) meeting
                </label>
              </div>
            )}

            {formData.pipScheduled && (
              <div>
                <Label>PIP Meeting Date</Label>
                <Input
                  type="date"
                  value={formData.pipDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pipDate: e.target.value }))}
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next: Sign Document</Button>
            </div>
          </div>
        )}

        {/* Step 4: Supervisor Signature */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PenTool className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Supervisor Signature Required</h4>
              </div>
              <p className="text-sm text-blue-700">
                As the issuing supervisor, please sign below to confirm you have reviewed this corrective action with the employee.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <Label className="mb-3 block">Your Signature</Label>
              <SignaturePadComponent
                onSignatureChange={(data) => setFormData((prev) => ({ ...prev, supervisorSignature: data }))}
                width={400}
                height={150}
              />
            </div>

            {!formData.supervisorSignature && (
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Signature is required to create the corrective action
              </p>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading || !formData.supervisorSignature}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create & Sign Corrective Action"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
