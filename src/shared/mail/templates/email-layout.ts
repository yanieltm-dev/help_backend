export type EmailLayoutParams = {
  appName: string;
  /** Optional. When set, logo image is shown in the header. Use PNG for best email client support. */
  logoUrl?: string;
  title: string;
  /** HTML fragment for the main content (no wrapper needed). */
  bodyHtml: string;
  /** Optional preheader text (hidden preview in some clients). */
  preheader?: string;
};

/**
 * Builds a full HTML email document with shared layout: inline styles for email clients,
 * optional logo header, and minimal footer. Use for all transactional email templates.
 */
export function buildEmailLayout(params: EmailLayoutParams): string {
  const { appName, logoUrl, title, bodyHtml, preheader } = params;

  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>`
    : '';

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(appName)}" width="160" height="64" style="display:block;max-width:160px;height:auto;" />`
    : `<span style="font-size:24px;font-weight:600;color:#1a1a1a;">${escapeHtml(appName)}</span>`;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${preheaderBlock}
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,sans-serif;font-size:16px;line-height:1.5;color:#333;background-color:#f5f5f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:32px 32px 24px;border-bottom:1px solid #eee;">
                ${logoBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #eee;font-size:12px;color:#888;">
                This email was sent by ${escapeHtml(appName)}. If you did not request this, you can safely ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c] ?? c);
}
