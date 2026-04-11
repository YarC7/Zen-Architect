export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function formatDateShort(date: Date) {
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function clampDate(date: Date, min: Date, max: Date) {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return new Date(date);
}

export function toIsoString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
