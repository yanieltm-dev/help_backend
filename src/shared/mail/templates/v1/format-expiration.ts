export function formatExpirationMinutes(expiresInMs: number): string {
  const minutes = Math.max(1, Math.round(expiresInMs / 60000));
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}
