import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL =
  process.env.FROM_EMAIL || 'AIS Marketplace <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// D-11: user-controlled values (listing names, rejection reasons, recipient
// names) flow into an HTML body and a mail subject header. Escape/sanitize at
// the interpolation sink (not at the data source, so stored data stays clean).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHeaderValue(s: string): string {
  return s.replace(/[\r\n]/g, ' ');
}

type ApprovalEmailType =
  | 'listing_submitted'
  | 'listing_approved'
  | 'listing_rejected';

interface SendApprovalEmailParams {
  to: string;
  recipientName: string;
  type: ApprovalEmailType;
  listingName: string;
  listingId: number;
  rejectionReason?: string;
}

const SUBJECT_MAP: Record<ApprovalEmailType, (name: string) => string> = {
  listing_submitted: (name) => `New listing submitted for review: ${name}`,
  listing_approved: (name) => `Your listing has been approved: ${name}`,
  listing_rejected: (name) => `Your listing needs changes: ${name}`,
};

const CTA_LABEL_MAP: Record<ApprovalEmailType, string> = {
  listing_submitted: 'Review Listing',
  listing_approved: 'View Listing',
  listing_rejected: 'Edit Listing',
};

const BODY_TEXT_MAP: Record<
  ApprovalEmailType,
  (name: string, reason?: string) => string
> = {
  listing_submitted: (name) =>
    `A new listing "<strong>${escapeHtml(name)}</strong>" has been submitted and is awaiting your review.`,
  listing_approved: (name) =>
    `Great news! Your listing "<strong>${escapeHtml(name)}</strong>" has been approved and is now active on the marketplace.`,
  listing_rejected: (name, reason) =>
    `Your listing "<strong>${escapeHtml(name)}</strong>" needs some changes before it can be approved.<br><br><strong>Reason:</strong> ${reason ? escapeHtml(reason) : 'No reason provided.'}`,
};

function buildEmailHtml(params: SendApprovalEmailParams): string {
  const { recipientName, type, listingName, listingId, rejectionReason } =
    params;
  const ctaUrl = `${FRONTEND_URL}/manage/listings/${listingId}/edit`;
  const ctaLabel = CTA_LABEL_MAP[type];
  const bodyText = BODY_TEXT_MAP[type](listingName, rejectionReason);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e293b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">AIS Marketplace</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">
                Hi ${escapeHtml(recipientName)},
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.5;">
                ${bodyText}
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#6366f1;border-radius:6px;padding:12px 24px;">
                    <a href="${ctaUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated notification from AIS Marketplace.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function sendApprovalEmail(
  params: SendApprovalEmailParams,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn(
      '[email] RESEND_API_KEY not set -- skipping email send for:',
      params.type,
    );
    return;
  }

  try {
    const subject = SUBJECT_MAP[params.type](
      sanitizeHeaderValue(params.listingName),
    );
    const html = buildEmailHtml(params);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html,
    });
  } catch (error) {
    console.error('[email] Failed to send approval email:', error);
    // Do NOT throw -- email failure must not block approval actions
  }
}
