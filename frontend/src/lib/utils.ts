import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) {
    return 'Arriving now';
  }
  if (minutes < 60) {
    return `~${Math.round(minutes)} min`;
  }
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
  }
  const d = Math.floor(minutes / 1440);
  const remMinutes = minutes % 1440;
  const h = Math.round(remMinutes / 60);
  return h > 0 ? `~${d}d ${h}h` : `~${d}d`;
}
