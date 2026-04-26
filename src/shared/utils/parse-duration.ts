const UNITS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error(
      `Invalid duration format: "${value}". Valid formats: 15m, 1h, 7d, 30s`,
    );
  }
  const [, amount, unit] = match;
  const multiplier = UNITS[unit];
  if (!multiplier) {
    throw new Error(`Invalid unit: "${unit}". Valid units: s, m, h, d`);
  }
  return parseInt(amount, 10) * multiplier;
}
