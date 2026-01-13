import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mic,
  Smartphone,
  MessageSquare,
  Copy,
  FileText,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Info,
  Headphones,
  Settings,
} from "lucide-react";
import Link from "next/link";

export default async function ChatGPTGuidePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dsp/notes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Mic className="h-8 w-8 text-blue-600" />
          ChatGPT Voice-to-Text Guide
        </h1>
        <p className="text-slate-500 mt-2">
          Learn how to use ChatGPT to quickly document shift notes using your voice
        </p>
      </div>

      {/* Quick Start */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Quick Start Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
            <p className="text-blue-800">Copy the resident&apos;s prompt from the Notes page</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
            <p className="text-blue-800">Open ChatGPT and paste the prompt</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
            <p className="text-blue-800">Tap the microphone and speak your observations</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">4</div>
            <p className="text-blue-800">Copy ChatGPT&apos;s formatted response and paste it back here</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">5</div>
            <p className="text-blue-800">Sign and submit your note</p>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Getting ChatGPT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Step 1: Get the ChatGPT App
          </CardTitle>
          <CardDescription>
            Download the free ChatGPT app on your phone for the best voice experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="https://apps.apple.com/app/chatgpt/id6448311069"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="h-12 w-12 bg-black rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white fill-current">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">iPhone / iPad</p>
                <p className="text-sm text-slate-500">App Store</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 ml-auto" />
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.openai.chatgpt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white fill-current">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Android</p>
                <p className="text-sm text-slate-500">Google Play</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 ml-auto" />
            </a>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-medium">Why use the app?</p>
                <p className="mt-1">The ChatGPT mobile app has a built-in voice mode that&apos;s much easier to use than typing. You can also use ChatGPT on a computer at <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">chat.openai.com</a></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Create Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Step 2: Create a Free Account
          </CardTitle>
          <CardDescription>
            Sign up for a free ChatGPT account if you don&apos;t have one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
              <span>Open the ChatGPT app or go to <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">chat.openai.com</a></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
              <span>Tap &quot;Sign up&quot; and create an account with your email or Google/Apple account</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
              <span>The free version works perfectly for progress notes - you don&apos;t need to pay</span>
            </li>
          </ol>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Good to know</p>
                <p className="mt-1">The free ChatGPT account is all you need. Voice mode and text responses are included at no cost.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Using Voice Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-blue-600" />
            Step 3: Using Voice Mode
          </CardTitle>
          <CardDescription>
            How to dictate your observations using voice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <Mic className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">On Mobile (Recommended)</p>
                <ol className="text-sm text-slate-600 mt-2 space-y-1">
                  <li>1. Tap the microphone icon in the message box</li>
                  <li>2. Speak naturally about the resident&apos;s day</li>
                  <li>3. Tap again when done speaking</li>
                  <li>4. ChatGPT will format your observations</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">On Computer</p>
                <ol className="text-sm text-slate-600 mt-2 space-y-1">
                  <li>1. Type your observations in the message box</li>
                  <li>2. Or use your browser&apos;s built-in dictation (keyboard icon on Mac/Windows)</li>
                  <li>3. Press Enter to send</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Tips for good voice notes</p>
                <ul className="mt-2 space-y-1">
                  <li>- Speak clearly and at a normal pace</li>
                  <li>- Mention specific activities and times</li>
                  <li>- Describe mood and interactions</li>
                  <li>- Note any concerns or highlights</li>
                  <li>- Use person-first language</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: The Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Step 4: Complete Workflow
          </CardTitle>
          <CardDescription>
            Putting it all together to write a progress note
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4">
            <li className="flex items-start gap-3 p-4 border rounded-lg">
              <Copy className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Copy the Prompt</p>
                <p className="text-sm text-slate-600 mt-1">
                  On the Notes page, click a resident&apos;s name and copy their personalized ChatGPT prompt. This prompt tells ChatGPT exactly how to format the progress note.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-4 border rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Paste in ChatGPT</p>
                <p className="text-sm text-slate-600 mt-1">
                  Open ChatGPT and paste the prompt. ChatGPT is now ready to help you write a professional progress note.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-4 border rounded-lg">
              <Mic className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Speak Your Observations</p>
                <p className="text-sm text-slate-600 mt-1">
                  Tap the microphone and describe the resident&apos;s day. Talk about what they did, how they seemed, meals, activities, interactions - just like you&apos;re telling a coworker.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-4 border rounded-lg">
              <Copy className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Copy the Response</p>
                <p className="text-sm text-slate-600 mt-1">
                  ChatGPT will format your spoken observations into a professional progress note. Long-press to copy the entire response.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-4 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Paste, Review, Sign</p>
                <p className="text-sm text-slate-600 mt-1">
                  Back in the Notes page, paste the response, review it for accuracy, sign with your finger, and submit.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <Info className="h-5 w-5" />
            Privacy & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-3">
          <p>
            <strong>Resident Privacy:</strong> The prompts are designed to help you write professional notes without including identifying information. ChatGPT only sees what you tell it in that conversation.
          </p>
          <p>
            <strong>HIPAA Reminder:</strong> Never include full names, addresses, SSNs, or other identifying information when speaking to ChatGPT. Use first names or nicknames only.
          </p>
          <p>
            <strong>Your Final Responsibility:</strong> Always review ChatGPT&apos;s response before submitting. You are signing that the note accurately reflects your observations.
          </p>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-slate-600">
              Questions? Ask your supervisor or email{" "}
              <a href="mailto:support@mercylink.com" className="text-blue-600 hover:underline">
                support@mercylink.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-center pb-6">
        <Link href="/dsp/notes">
          <Button size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </Button>
        </Link>
      </div>
    </div>
  );
}
