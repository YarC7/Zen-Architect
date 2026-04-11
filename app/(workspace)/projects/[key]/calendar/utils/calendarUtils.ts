export type CalendarView = "month" | "week" | "day";

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function getWeekRange(date: Date): [Date, Date] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return [start, end];
}

export function getCalendarDays(year: number, month: number) {
  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = daysInMonth(prevYear, prevMonth);

  // Previous month trailing days
  const trailing = Array.from({ length: firstDay }, (_, i) => {
    const day = prevMonthDays - firstDay + i + 1;
    const d = new Date(prevYear, prevMonth, day);
    return { day, date: d, isOtherMonth: true };
  });

  // Current month days
  const current = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const d = new Date(year, month, day);
    return { day, date: d, isOtherMonth: false };
  });

  // Next month leading days
  const totalSoFar = trailing.length + current.length;
  const remaining = totalSoFar % 7 === 0 ? 0 : 7 - (totalSoFar % 7);
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const leading = Array.from({ length: remaining }, (_, i) => {
    const day = i + 1;
    const d = new Date(nextYear, nextMonth, day);
    return { day, date: d, isOtherMonth: true };
  });

  const all = [...trailing, ...current, ...leading];
  const weeks: typeof all[] = [];
  for (let i = 0; i < all.length; i += 7) {
    weeks.push(all.slice(i, i + 7));
  }

  return weeks;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isWithinDateRange(
  date: Date,
  start: Date,
  end: Date
): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

export function getWeekDays(): string[] {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}
