import { Resend } from "resend";

// Initialize Resend client lazily to avoid errors during build
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - email notifications disabled");
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@mercylinkportal.com";
const APP_NAME = "Mercy Link Portal";
const APP_URL = process.env.NEXTAUTH_URL || "https://mercylinkportal.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    return false;
  }

  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      console.error("Failed to send email:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Email template helpers
function wrapInTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  ${preheader ? `<span style="display:none!important;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px;border-bottom:2px solid #2563eb;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:24px;font-weight:bold;color:#0f172a;">MERCY LINK MN, LLC</h1>
                    <p style="margin:4px 0 0;font-size:14px;color:#64748b;">245D Compliance Portal</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                This is an automated message from the Mercy Link 245D Compliance Portal.<br>
                <a href="${APP_URL}/dashboard/settings" style="color:#2563eb;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Notification email types
export interface NotificationEmailData {
  recipientName: string;
  recipientEmail: string;
  notifications: {
    title: string;
    message: string;
    type: string;
    link: string;
  }[];
}

export async function sendDailyDigestEmail(data: NotificationEmailData): Promise<boolean> {
  if (data.notifications.length === 0) return true;

  const overdueItems = data.notifications.filter(n =>
    n.type === "OVERDUE" || n.type === "MEETING_OVERDUE" || n.type === "TASK_OVERDUE"
  );
  const upcomingItems = data.notifications.filter(n =>
    n.type === "DEADLINE_WARNING" || n.type === "MEETING_REMINDER" || n.type === "TASK_DUE_SOON"
  );
  const otherItems = data.notifications.filter(n =>
    !overdueItems.includes(n) && !upcomingItems.includes(n)
  );

  let content = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0f172a;">
      Daily Compliance Summary
    </h2>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">
      Hello ${data.recipientName},<br><br>
      Here's your daily compliance summary with ${data.notifications.length} item${data.notifications.length !== 1 ? "s" : ""} requiring attention.
    </p>
  `;

  // Overdue section
  if (overdueItems.length > 0) {
    content += `
      <div style="margin-bottom:24px;padding:16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#dc2626;">
          ⚠️ Overdue Items (${overdueItems.length})
        </h3>
        ${overdueItems.map(item => `
          <div style="margin-bottom:8px;padding:8px;background-color:#ffffff;border-radius:4px;">
            <p style="margin:0;font-size:14px;font-weight:500;color:#0f172a;">${item.title}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${item.message}</p>
            <a href="${APP_URL}${item.link}" style="display:inline-block;margin-top:8px;font-size:13px;color:#2563eb;">View Details →</a>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Upcoming section
  if (upcomingItems.length > 0) {
    content += `
      <div style="margin-bottom:24px;padding:16px;background-color:#fef9c3;border-left:4px solid #ca8a04;border-radius:4px;">
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#ca8a04;">
          📅 Upcoming Deadlines (${upcomingItems.length})
        </h3>
        ${upcomingItems.map(item => `
          <div style="margin-bottom:8px;padding:8px;background-color:#ffffff;border-radius:4px;">
            <p style="margin:0;font-size:14px;font-weight:500;color:#0f172a;">${item.title}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${item.message}</p>
            <a href="${APP_URL}${item.link}" style="display:inline-block;margin-top:8px;font-size:13px;color:#2563eb;">View Details →</a>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Other notifications
  if (otherItems.length > 0) {
    content += `
      <div style="margin-bottom:24px;padding:16px;background-color:#f0f9ff;border-left:4px solid #2563eb;border-radius:4px;">
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#2563eb;">
          📋 Other Notifications (${otherItems.length})
        </h3>
        ${otherItems.map(item => `
          <div style="margin-bottom:8px;padding:8px;background-color:#ffffff;border-radius:4px;">
            <p style="margin:0;font-size:14px;font-weight:500;color:#0f172a;">${item.title}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${item.message}</p>
            <a href="${APP_URL}${item.link}" style="display:inline-block;margin-top:8px;font-size:13px;color:#2563eb;">View Details →</a>
          </div>
        `).join("")}
      </div>
    `;
  }

  // CTA button
  content += `
    <table role="presentation" width="100%">
      <tr>
        <td align="center">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:500;border-radius:6px;">
            View Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  const subject = overdueItems.length > 0
    ? `⚠️ ${overdueItems.length} Overdue Items - Daily Compliance Summary`
    : `📅 Daily Compliance Summary - ${data.notifications.length} item${data.notifications.length !== 1 ? "s" : ""}`;

  return sendEmail({
    to: data.recipientEmail,
    subject,
    html: wrapInTemplate(content, `${data.notifications.length} compliance items need attention`),
    text: `Daily Compliance Summary\n\nYou have ${data.notifications.length} items requiring attention. Visit ${APP_URL}/dashboard to review.`,
  });
}

// Send corrective action signature request to employee
export interface CorrectiveActionEmailData {
  employeeEmail: string;
  employeeName: string;
  violationDate: string;
  violationCategory: string;
  severityLevel: string;
  pointsAssigned: number;
  issuedByName: string;
  signLink: string;
}

export async function sendCorrectiveActionSignatureRequest(data: CorrectiveActionEmailData): Promise<boolean> {
  const severityColors: Record<string, { bg: string; border: string; text: string }> = {
    MINOR: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
    MODERATE: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
    SERIOUS: { bg: "#fed7aa", border: "#f97316", text: "#9a3412" },
    CRITICAL: { bg: "#fecaca", border: "#ef4444", text: "#991b1b" },
    IMMEDIATE_TERMINATION: { bg: "#fecaca", border: "#dc2626", text: "#7f1d1d" },
  };

  const colors = severityColors[data.severityLevel] || severityColors.MODERATE;

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0f172a;">
      Corrective Action - Signature Required
    </h2>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">
      Hello ${data.employeeName},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">
      A corrective action has been issued and requires your acknowledgment signature.
    </p>

    <div style="margin-bottom:24px;padding:20px;background-color:${colors.bg};border-left:4px solid ${colors.border};border-radius:4px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="140" style="font-size:14px;color:#64748b;padding:4px 0;">Violation Date:</td>
          <td style="font-size:14px;font-weight:500;color:#0f172a;padding:4px 0;">${data.violationDate}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#64748b;padding:4px 0;">Category:</td>
          <td style="font-size:14px;font-weight:500;color:#0f172a;padding:4px 0;">${data.violationCategory}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#64748b;padding:4px 0;">Severity:</td>
          <td style="font-size:14px;font-weight:600;color:${colors.text};padding:4px 0;">${data.severityLevel.replace("_", " ")}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#64748b;padding:4px 0;">Points:</td>
          <td style="font-size:14px;font-weight:500;color:#0f172a;padding:4px 0;">${data.pointsAssigned}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#64748b;padding:4px 0;">Issued By:</td>
          <td style="font-size:14px;font-weight:500;color:#0f172a;padding:4px 0;">${data.issuedByName}</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
      Please review the corrective action details and provide your signature. Your signature indicates acknowledgment of receipt, not necessarily agreement with the findings.
    </p>

    <table role="presentation" width="100%">
      <tr>
        <td align="center">
          <a href="${APP_URL}${data.signLink}" style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;font-size:16px;">
            Review & Sign
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      If you have questions about this corrective action, please contact your supervisor or HR.
    </p>
  `;

  const subject = `⚠️ Action Required: Corrective Action Signature Needed`;

  return sendEmail({
    to: data.employeeEmail,
    subject,
    html: wrapInTemplate(content, `Corrective action issued - your signature is required`),
    text: `Corrective Action - Signature Required\n\nHello ${data.employeeName},\n\nA corrective action has been issued for ${data.violationCategory} (${data.violationDate}).\n\nPlease sign at: ${APP_URL}${data.signLink}`,
  });
}

// Send immediate notification for urgent items
export async function sendUrgentNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  title: string,
  message: string,
  link: string,
  isOverdue: boolean
): Promise<boolean> {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0f172a;">
      ${isOverdue ? "⚠️ " : "📅 "}${title}
    </h2>
    <p style="margin:0 0 24px;font-size:16px;color:#475569;">
      Hello ${recipientName},
    </p>
    <div style="margin-bottom:24px;padding:16px;background-color:${isOverdue ? "#fef2f2" : "#fef9c3"};border-left:4px solid ${isOverdue ? "#dc2626" : "#ca8a04"};border-radius:4px;">
      <p style="margin:0;font-size:16px;color:#0f172a;">${message}</p>
    </div>
    <table role="presentation" width="100%">
      <tr>
        <td align="center">
          <a href="${APP_URL}${link}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:500;border-radius:6px;">
            View Details
          </a>
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${isOverdue ? "⚠️ OVERDUE: " : "📅 "}${title}`,
    html: wrapInTemplate(content, message),
    text: `${title}\n\n${message}\n\nView details: ${APP_URL}${link}`,
  });
}
