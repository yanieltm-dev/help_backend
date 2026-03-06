import { buildEmailLayout, escapeHtml } from '../email-layout';
import { formatExpirationMinutes } from './format-expiration';

export type VerificationOtpTemplateParams = {
  name: string;
  otp: string;
  expiresInMs: number;
  appName?: string;
  logoUrl?: string;
};

export { formatExpirationMinutes };

export function buildVerificationOtpHtml(
  params: VerificationOtpTemplateParams,
): string {
  const { name, otp, expiresInMs, appName = 'Help', logoUrl } = params;
  const expirationText = formatExpirationMinutes(expiresInMs);

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your verification code is:</p>
    <p style="margin:0 0 24px;font-size:24px;font-weight:600;letter-spacing:4px;font-family:ui-monospace,monospace;">${escapeHtml(otp)}</p>
    <p style="margin:0;font-size:14px;color:#666;">This code will expire in ${escapeHtml(expirationText)}.</p>
  `.trim();

  return buildEmailLayout({
    appName,
    logoUrl,
    title: `${appName} – Verify your email`,
    bodyHtml,
    preheader: `Your verification code is ${otp}.`,
  });
}
