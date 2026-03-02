import { v7 as uuidv7 } from 'uuid';

/**
 * Generates a UUID v7 (time-ordered, RFC 9562).
 * Uses the `uuid` library for guaranteed spec compliance.
 *
 * Prefer this over randomUUID() (v4) to get monotonically
 * increasing IDs that reduce B-tree index fragmentation.
 */
export function generateUuidV7(): string {
  return uuidv7();
}
