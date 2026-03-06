import { formatExpirationMinutes } from './format-expiration';

describe('formatExpirationMinutes', () => {
  test('formats minutes with plural', () => {
    expect(formatExpirationMinutes(15 * 60 * 1000)).toBe('15 minutes');
  });

  test('formats 1 minute without plural', () => {
    expect(formatExpirationMinutes(60 * 1000)).toBe('1 minute');
  });

  test('rounds to at least 1 minute', () => {
    expect(formatExpirationMinutes(30 * 1000)).toBe('1 minute');
  });
});
