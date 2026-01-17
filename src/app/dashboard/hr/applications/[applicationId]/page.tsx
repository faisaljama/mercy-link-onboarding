"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, XCircle, User, Mail, Phone, MapPin, Calendar, FileText, Clock, AlertCircle } from "lucide-react";

interface FormSubmission {
  formType: string;
  status: string;
  signedAt: string | null;
  signatureTypedName: string | null;
}

interface Application {
  id: string;
  accessToken: string;
  status: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  dateOfBirth: string | null;
  ssnLastFour: string | null;
  positionAppliedFor: string | null;
  employmentType: string[];
  availableShifts: string[];
  dateAvailableToStart: string | null;
  authorizedToWork: boolean | null;
  isOver18: boolean | null;
  hasDriversLicense: boolean | null;
  driversLicenseNumber: string | null;
  driversLicenseState: string | null;
  hasReliableTransport: boolean | null;
  hasAutoInsurance: boolean | null;
  hasConviction: boolean | null;
  convictionExplanation: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  formSubmissions: FormSubmission[];
  education: Array<{
    schoolName: string;
    location: string | null;
    yearsAttended: string | null;
    graduated: boolean | null;
    degree: string | null;
  }>;
  workHistory: Array<{
    companyName: string;
    jobTitle: string | null;
    supervisorName: string | null;
    phone: string | null;
    startDate: string | null;
    endDate: string | null;
    reasonForLeaving: string | null;
  }>;
  references: Array<{
    name: string;
    phone: string | null;
    relationship: string | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  ONBOARDING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  HIRED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const FORM_NAMES: Record<string, string> = {
  EMPLOYMENT_APPLICATION: "Employment Application",
  BACKGROUND_STUDY: "Background Study Authorization",
  DIRECT_DEPOSIT: "Direct Deposit Authorization",
  EMERGENCY_CONTACT: "Emergency Contact Form",
  AUTO_INSURANCE: "Auto Insurance & Vehicle Info",
  JOB_DESCRIPTION: "Job Description Acknowledgment",
  DATA_PRIVACY_HIPAA: "Data Privacy & HIPAA",
  AT_WILL_EMPLOYMENT: "At-Will Employment",
  ANTI_FRAUD_POLICY: "Anti-Fraud Policy",
  EUMR_POLICY: "EUMR Policy",
  DRUG_FREE_WORKPLACE: "Drug-Free Workplace",
  GRIEVANCE_POLICY: "Grievance Policy",
  MALTREATMENT_REPORTING: "Maltreatment Reporting",
  CELL_PHONE_POLICY: "Cell Phone & Electronic Device",
  CONFIDENTIALITY: "Confidentiality Agreement",
  SERVICE_RECIPIENT_RIGHTS: "Service Recipient Rights",
  STAFF_PAPP_ORIENTATION: "Staff PAPP Orientation",
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(`/api/hr/applications/${applicationId}`);
        if (!res.ok) {
          throw new Error("Application not found");
        }
        const data = await res.json();
        setApplication(data);
        setReviewNotes(data.reviewNotes || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/hr/applications/${applicationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/hr/applications/${applicationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason, reviewNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject");
      }

      setShowRejectDialog(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateEmployee = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/hr/applications/${applicationId}/create-employee`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create employee");
      }

      const data = await res.json();
      router.push(`/dashboard/employees/${data.employeeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Loading application...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-slate-600 mb-4">{error || "Application not found"}</p>
            <Button onClick={() => router.push("/dashboard/hr")}>Back to HR Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = [application.firstName, application.middleName, application.lastName]
    .filter(Boolean)
    .join(" ") || "Unnamed Applicant";

  const completedForms = application.formSubmissions.filter((f) => f.status === "COMPLETED").length;
  const totalForms = Object.keys(FORM_NAMES).length;

  const canApprove = application.status === "SUBMITTED";
  const canReject = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "ONBOARDING"].includes(application.status);
  const canCreateEmployee = application.status === "COMPLETED";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/hr" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
            <p className="text-slate-600">{application.email}</p>
          </div>
        </div>
        <Badge className={`${STATUS_COLORS[application.status]} text-sm px-3 py-1`}>
          {application.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-medium">{fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {application.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {application.phone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date of Birth</p>
                  <p className="font-medium">
                    {application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {[application.streetAddress, application.city, application.state, application.zipCode]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
                {application.ssnLastFour && (
                  <div>
                    <p className="text-sm text-slate-500">SSN</p>
                    <p className="font-medium">***-**-{application.ssnLastFour}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Position & Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Position & Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Position Applied For</p>
                  <p className="font-medium">{application.positionAppliedFor || "Direct Support Professional"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Available to Start</p>
                  <p className="font-medium">
                    {application.dateAvailableToStart
                      ? new Date(application.dateAvailableToStart).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Employment Type</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.employmentType.length > 0 ? (
                      application.employmentType.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type.replace(/_/g, " ")}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Available Shifts</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.availableShifts.length > 0 ? (
                      application.availableShifts.map((shift) => (
                        <Badge key={shift} variant="outline" className="text-xs">
                          {shift}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle>Eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {application.authorizedToWork ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm">Authorized to work in US</span>
                </div>
                <div className="flex items-center gap-2">
                  {application.isOver18 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm">Over 18 years old</span>
                </div>
                <div className="flex items-center gap-2">
                  {application.hasDriversLicense ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm">Valid driver&apos;s license</span>
                </div>
                <div className="flex items-center gap-2">
                  {application.hasReliableTransport ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm">Reliable transportation</span>
                </div>
                <div className="flex items-center gap-2">
                  {application.hasAutoInsurance ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm">Auto insurance</span>
                </div>
              </div>

              {application.hasDriversLicense && application.driversLicenseNumber && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-500">Driver&apos;s License</p>
                  <p className="font-medium">
                    {application.driversLicenseNumber} ({application.driversLicenseState})
                  </p>
                </div>
              )}

              {application.hasConviction && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-1">Conviction Disclosure</p>
                  <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                    {application.convictionExplanation || "No explanation provided"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work History */}
          {application.workHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Work History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.workHistory.map((job, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{job.companyName}</p>
                          <p className="text-sm text-slate-600">{job.jobTitle}</p>
                        </div>
                        <p className="text-sm text-slate-500">
                          {job.startDate ? new Date(job.startDate).toLocaleDateString() : "?"} -{" "}
                          {job.endDate ? new Date(job.endDate).toLocaleDateString() : "Present"}
                        </p>
                      </div>
                      {job.reasonForLeaving && (
                        <p className="text-sm text-slate-600">
                          <span className="text-slate-500">Reason for leaving:</span> {job.reasonForLeaving}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* References */}
          {application.references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>References</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Relationship</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {application.references.map((ref, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{ref.name || "-"}</TableCell>
                        <TableCell>{ref.phone || "-"}</TableCell>
                        <TableCell>{ref.relationship || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Form Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Form Progress
              </CardTitle>
              <CardDescription>
                {completedForms} of {totalForms} forms completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(completedForms / totalForms) * 100}%` }}
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(FORM_NAMES).map(([formType, name]) => {
                  const submission = application.formSubmissions.find((f) => f.formType === formType);
                  const status = submission?.status || "NOT_STARTED";
                  return (
                    <div key={formType} className="flex items-center justify-between text-sm">
                      <span className="truncate">{name}</span>
                      {status === "COMPLETED" ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : status === "IN_PROGRESS" ? (
                        <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span>{new Date(application.createdAt).toLocaleDateString()}</span>
                </div>
                {application.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Submitted</span>
                    <span>{new Date(application.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {application.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Approved</span>
                    <span>{new Date(application.approvedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {application.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed</span>
                    <span>{new Date(application.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={3}
                />
              </div>

              {canApprove && (
                <Button onClick={handleApprove} disabled={processing} className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processing ? "Processing..." : "Approve Application"}
                </Button>
              )}

              {canCreateEmployee && (
                <Button onClick={handleCreateEmployee} disabled={processing} className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  {processing ? "Creating..." : "Create Employee Record"}
                </Button>
              )}

              {canReject && (
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Application</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for rejecting this application.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter the reason for rejection..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleReject} disabled={processing}>
                        {processing ? "Rejecting..." : "Confirm Rejection"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500 mb-2">Access Token</p>
                <code className="text-xs bg-slate-100 p-2 rounded block break-all">
                  {application.accessToken}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
