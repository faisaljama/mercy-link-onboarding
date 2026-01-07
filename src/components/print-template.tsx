"use client";

import { format } from "date-fns";

interface PrintTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showFooter?: boolean;
}

export function PrintTemplate({ title, subtitle, children, showFooter = true }: PrintTemplateProps) {
  return (
    <>
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-6">
        <div className="flex items-center justify-between border-b-2 border-blue-600 pb-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/mercy-link-logo.png"
              alt="Mercy Link"
              className="h-16 w-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">MERCY LINK MN, LLC</h1>
              <p className="text-sm text-slate-600">245D Residential Services</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-blue-700">{title}</p>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="print:text-sm">{children}</div>

      {/* Print Footer - Only visible when printing */}
      {showFooter && (
        <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:border-slate-300">
          <div className="flex justify-between text-xs text-slate-500">
            <div>
              <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
              <p className="mt-1">Mercy Link MN, LLC | 245D Licensed Provider</p>
            </div>
            <div className="text-right">
              <p>CONFIDENTIAL</p>
              <p className="mt-1">Protected under HIPAA & MN Statutes 245D</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.75in;
            size: letter portrait;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Hide non-printable elements */
          .print\\:hidden,
          button,
          nav,
          aside,
          .sidebar,
          [data-radix-popper-content-wrapper] {
            display: none !important;
          }

          /* Show print-only elements */
          .print\\:block {
            display: block !important;
          }

          /* Card styling for print */
          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:border {
            border: 1px solid #e2e8f0 !important;
          }

          /* Ensure proper page breaks */
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }

          /* Force background colors to print */
          .bg-slate-50,
          .bg-blue-50,
          .bg-red-50,
          .bg-green-50,
          .bg-yellow-50,
          .bg-orange-50,
          .bg-purple-50 {
            background-color: #f8fafc !important;
          }

          /* Compact spacing for print */
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }

          /* Ensure text is readable */
          * {
            color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}

// Print button component with proper styling
export function PrintButton({ className = "" }: { className?: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 print:hidden ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print / Save PDF
    </button>
  );
}
