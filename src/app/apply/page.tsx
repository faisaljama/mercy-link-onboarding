"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, Users } from "lucide-react";

export default function ApplyLandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);

  const handleStartApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/apply/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start application");
      }

      router.push(`/apply/${data.accessToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeApplication = () => {
    if (accessCode.trim()) {
      router.push(`/apply/${accessCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">ML</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Mercy Link LLC</h1>
              <p className="text-sm text-slate-500">Employment Application Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Join Our Team as a Direct Support Professional
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We&apos;re looking for compassionate individuals to support people with developmental
            disabilities in our community residential settings.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">Easy Application</h3>
            <p className="text-sm text-slate-500">Complete online in your own time</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">Save Progress</h3>
            <p className="text-sm text-slate-500">Return anytime to continue</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">Digital Signatures</h3>
            <p className="text-sm text-slate-500">Sign all documents online</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">Quick Review</h3>
            <p className="text-sm text-slate-500">Fast response from our team</p>
          </div>
        </div>

        {/* Application Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Start New Application */}
          <Card>
            <CardHeader>
              <CardTitle>Start New Application</CardTitle>
              <CardDescription>Enter your email to begin your application</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartApplication} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    We&apos;ll send your application link to this email
                  </p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Starting..." : "Start Application"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resume Application */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Existing Application</CardTitle>
              <CardDescription>Already started? Enter your access code to continue</CardDescription>
            </CardHeader>
            <CardContent>
              {!showAccessCode ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAccessCode(true)}
                >
                  I have an access code
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessCode">Access Code</Label>
                    <Input
                      id="accessCode"
                      placeholder="Enter your access code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleResumeApplication}
                    disabled={!accessCode.trim()}
                  >
                    Continue Application
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Requirements */}
        <div className="mt-12 bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Position Requirements</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Must be 18 years of age or older</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Authorized to work in the United States</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Valid driver&apos;s license and reliable transportation</span>
              </li>
            </ul>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Ability to pass a Minnesota DHS background study</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>High school diploma or GED preferred</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Compassion and dedication to helping others</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Mercy Link LLC. All rights reserved.</p>
          <p className="mt-1">Dakota and Hennepin Counties, Minnesota</p>
        </div>
      </footer>
    </div>
  );
}
