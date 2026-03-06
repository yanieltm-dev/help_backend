import {
  buildPasswordResetOtpHtml,
  formatExpirationMinutes,
} from './password-reset-otp';

describe('password-reset-otp template v1', () => {
  test('includes name, OTP and expiration in minutes', () => {
    const html = buildPasswordResetOtpHtml({
      name: 'Bob',
      otp: '654321',
      expiresInMs: 15 * 60 * 1000,
      appName: 'Help',
    });

    expect(html).toContain('Bob');
    expect(html).toContain('654321');
    expect(html).toContain(formatExpirationMinutes(15 * 60 * 1000));
    expect(html).toContain('Help');
  });

  test('uses shared layout with DOCTYPE and table structure', () => {
    const html = buildPasswordResetOtpHtml({
      name: 'Bob',
      otp: '654321',
      expiresInMs: 60000,
      appName: 'Help',
    });

    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toContain('<table');
    expect(html).toContain('Reset your password');
  });
});
