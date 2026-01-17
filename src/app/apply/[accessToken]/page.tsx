"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, FileText, AlertCircle } from "lucide-react";

interface FormStatus {
  formType: string;
  name: string;
  description: string;
  category: string;
  status: string;
  isPreHire: boolean;
  isOnboarding: boolean;
  isAvailable: boolean;
}

interface ApplicationData {
  id: string;
  status: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  accessToken: string;
  submittedAt: string | null;
}

interface FormsResponse {
  applicationStatus: string;
  forms: FormStatus[];
  progress: {
    completed: number;
    total: number;
    preHireCompleted: number;
    preHireTotal: number;
    onboardingCompleted: number;
    onboardingTotal: number;
  };
  canAccessOnboarding: boolean;
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

export default function ApplicationDashboard() {
  const params = useParams();
  const router = useRouter();
  const accessToken = params.accessToken as string;

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [formsData, setFormsData] = useState<FormsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, formsRes] = await Promise.all([
          fetch(`/api/apply/${accessToken}`),
          fetch(`/api/apply/${accessToken}/forms`),
        ]);

        if (!appRes.ok) {
          throw new Error("Application not found");
        }

        const appData = await appRes.json();
        const formsData = await formsRes.json();

        setApplication(appData);
        setFormsData(formsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading application...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Application Not Found</h2>
            <p className="text-slate-600 mb-4">{error || "Unable to find this application."}</p>
            <Button onClick={() => router.push("/apply")}>Start New Application</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const preHireForms = formsData?.forms.filter((f) => f.isPreHire) || [];
  const onboardingForms = formsData?.forms.filter((f) => f.isOnboarding) || [];

  const getFormLink = (form: FormStatus) => {
    if (form.formType === "EMPLOYMENT_APPLICATION") {
      return `/apply/${accessToken}/employment-application`;
    }
    if (form.formType === "BACKGROUND_STUDY") {
      return `/apply/${accessToken}/background-study`;
    }
    // Convert form type to URL slug
    const slug = form.formType.toLowerCase().replace(/_/g, "-");
    return `/apply/${accessToken}/onboarding/${slug}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const canSubmit =
    application.status === "DRAFT" &&
    formsData?.progress.preHireCompleted === formsData?.progress.preHireTotal;

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/apply/${accessToken}/submit`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      // Refresh the page
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit application");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">ML</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Your Application</h1>
                <p className="text-sm text-slate-500">{application.email}</p>
              </div>
            </div>
            <Badge className={STATUS_COLORS[application.status] || "bg-gray-100"}>
              {application.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
            <CardDescription>
              {formsData?.progress.completed} of {formsData?.progress.total} forms completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{
                  width: `${((formsData?.progress.completed || 0) / (formsData?.progress.total || 1)) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pre-hire Forms */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pre-Hire Forms
            </CardTitle>
            <CardDescription>
              Complete these forms to submit your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preHireForms.map((form) => (
                <Link
                  key={form.formType}
                  href={getFormLink(form)}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(form.status)}
                    <div>
                      <p className="font-medium text-slate-900">{form.name}</p>
                      <p className="text-sm text-slate-500">{form.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {form.status === "COMPLETED" ? "Completed" : form.status === "IN_PROGRESS" ? "In Progress" : "Start"}
                  </Badge>
                </Link>
              ))}
            </div>

            {canSubmit && (
              <div className="mt-6 pt-6 border-t">
                <Button onClick={handleSubmit} className="w-full">
                  Submit Application for Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Onboarding Forms
            </CardTitle>
            <CardDescription>
              {formsData?.canAccessOnboarding
                ? "Complete these forms after your application is approved"
                : "These forms will be available after your application is approved"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {onboardingForms.map((form) => (
                <div
                  key={form.formType}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    form.isAvailable ? "hover:bg-slate-50 cursor-pointer" : "opacity-50"
                  }`}
                  onClick={() => form.isAvailable && router.push(getFormLink(form))}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(form.status)}
                    <div>
                      <p className="font-medium text-slate-900">{form.name}</p>
                      <p className="text-sm text-slate-500">{form.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {!form.isAvailable
                      ? "Locked"
                      : form.status === "COMPLETED"
                      ? "Completed"
                      : form.status === "IN_PROGRESS"
                      ? "In Progress"
                      : "Start"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Access Code Reminder */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Your Access Code:</strong> {accessToken}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Save this code to return to your application later.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
