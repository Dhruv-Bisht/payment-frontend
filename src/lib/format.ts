const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export const money = (n: number) => inr.format(n);

/** The backend sends LocalDateTime with up to 6 fractional digits; JS only guarantees 3. */
export function when(value?: string): string {
  if (!value) return '';
  const d = new Date(value.replace(/(\.\d{3})\d+/, '$1'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export const shortKey = (key: string) => (key.length > 13 ? `${key.slice(0, 8)}…${key.slice(-4)}` : key);

export function bytes(n: number): string {
  if (n < 1024) return `${Math.round(n)} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = n;
  let i = -1;
  do {
    value /= 1024;
    i++;
  } while (value >= 1024 && i < units.length - 1);
  return `${value.toFixed(1)} ${units[i]}`;
}

export function duration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
