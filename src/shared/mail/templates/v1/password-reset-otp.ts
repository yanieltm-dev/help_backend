import { buildEmailLayout, escapeHtml } from '../email-layout';
import { formatExpirationMinutes } from './format-expiration';

export type PasswordResetOtpTemplateParams = {
  name: string;
  otp: string;
  expiresInMs: number;
  appName?: string;
  logoUrl?: string;
};

export { formatExpirationMinutes };

export function buildPasswordResetOtpHtml(
  params: PasswordResetOtpTemplateParams,
): string {
  const { name, otp, expiresInMs, appName = 'Help', logoUrl } = params;
  const expirationText = formatExpirationMinutes(expiresInMs);

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your password reset code is:</p>
    <p style="margin:0 0 24px;font-size:24px;font-weight:600;letter-spacing:4px;font-family:ui-monospace,monospace;">${escapeHtml(otp)}</p>
    <p style="margin:0;font-size:14px;color:#666;">This code will expire in ${escapeHtml(expirationText)}.</p>
  `.trim();

  return buildEmailLayout({
    appName,
    logoUrl,
    title: `${appName} – Reset your password`,
    bodyHtml,
    preheader: `Your password reset code is ${otp}.`,
  });
}
