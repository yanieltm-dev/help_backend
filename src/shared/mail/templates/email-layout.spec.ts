import { buildEmailLayout, escapeHtml } from './email-layout';

describe('email-layout', () => {
  describe('buildEmailLayout', () => {
    test('includes title, appName and bodyHtml in output', () => {
      const html = buildEmailLayout({
        appName: 'Help',
        title: 'Test Title',
        bodyHtml: '<p>Hello world</p>',
      });

      expect(html).toContain('Test Title');
      expect(html).toContain('Help');
      expect(html).toContain('<p>Hello world</p>');
    });

    test('includes logo image when logoUrl is provided', () => {
      const html = buildEmailLayout({
        appName: 'Help',
        logoUrl: 'https://example.com/assets/logo.png',
        title: 'Title',
        bodyHtml: '<p>Body</p>',
      });

      expect(html).toContain('https://example.com/assets/logo.png');
      expect(html).toContain('<img');
      expect(html).toContain('alt="Help"');
    });

    test('includes appName as text when logoUrl is not provided', () => {
      const html = buildEmailLayout({
        appName: 'MyApp',
        title: 'Title',
        bodyHtml: '<p>Body</p>',
      });

      expect(html).not.toContain('<img');
      expect(html).toContain('MyApp');
    });

    test('includes preheader when provided', () => {
      const html = buildEmailLayout({
        appName: 'Help',
        title: 'Title',
        bodyHtml: '<p>Body</p>',
        preheader: 'Preview text',
      });

      expect(html).toContain('Preview text');
      expect(html).toContain('display:none');
    });

    test('uses table-based layout for email client compatibility', () => {
      const html = buildEmailLayout({
        appName: 'Help',
        title: 'Title',
        bodyHtml: '<p>Body</p>',
      });

      expect(html).toContain('<table');
      expect(html).toContain('role="presentation"');
    });
  });

  describe('escapeHtml', () => {
    test('escapes ampersand, angle brackets and quotes', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
      expect(escapeHtml("'apos'")).toBe('&#039;apos&#039;');
    });

    test('returns empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });
  });
});
