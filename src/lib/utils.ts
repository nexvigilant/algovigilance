import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toDateFromSerialized } from '@/types/academy';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert flexible timestamp types to Date
 * Handles: Firestore Timestamp, serialized timestamps, strings, numbers, Date objects
 */
export function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'object' && value !== null) {
    // Firestore Timestamp with toDate method
    if ('toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
      return toDateFromSerialized(value as { toDate: () => Date });
    }
    // Serialized timestamp with seconds
    if ('seconds' in value) {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
    // Serialized timestamp with _seconds (alternative format)
    if ('_seconds' in value) {
      return new Date((value as { _seconds: number })._seconds * 1000);
    }
  }
  return new Date();
}
