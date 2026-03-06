import {
  buildVerificationOtpHtml,
  formatExpirationMinutes,
} from './verification-otp';

describe('verification-otp template v1', () => {
  test('includes name, OTP and expiration in minutes', () => {
    const html = buildVerificationOtpHtml({
      name: 'Alice',
      otp: '123456',
      expiresInMs: 10 * 60 * 1000,
      appName: 'Help',
    });

    expect(html).toContain('Alice');
    expect(html).toContain('123456');
    expect(html).toContain(formatExpirationMinutes(10 * 60 * 1000));
    expect(html).toContain('Help');
  });

  test('uses shared layout with DOCTYPE and table structure', () => {
    const html = buildVerificationOtpHtml({
      name: 'Alice',
      otp: '123456',
      expiresInMs: 60000,
      appName: 'Help',
    });

    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toContain('<table');
    expect(html).toContain('Verify your email');
  });

  test('includes logo image when logoUrl is provided', () => {
    const html = buildVerificationOtpHtml({
      name: 'Alice',
      otp: '123456',
      expiresInMs: 60000,
      appName: 'Help',
      logoUrl: 'https://example.com/logo.png',
    });

    expect(html).toContain('https://example.com/logo.png');
    expect(html).toContain('<img');
  });
});
