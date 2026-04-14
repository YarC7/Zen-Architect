import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  differenceInDays,
  format,
  getDay,
  isToday,
} from "date-fns";
import { TimelineViewType } from "../types";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface MonthInfo {
  label: string;
  days: number;
  startOffset: number;
}

export interface WeekInfo {
  label: string;
  days: number;
  startOffset: number;
}

export interface DayInfo {
  date: Date;
  dayOfWeek: number;
  isWeekend: boolean;
  isToday: boolean;
  label: string;
}

/**
 * Get the date range for a given view type and current date
 */
export function getDateRangeForView(
  currentDate: Date,
  viewType: TimelineViewType
): DateRange {
  const now = new Date();

  switch (viewType) {
    case "day":
      // Show 14 days centered on current date
      return {
        start: subDays(currentDate, 6),
        end: addDays(currentDate, 7),
      };

    case "week":
      // Show 6 weeks centered on current date
      return {
        start: subWeeks(currentDate, 2),
        end: addWeeks(currentDate, 4),
      };

    case "month":
    default:
      // Show 3 months centered on current date
      return {
        start: subMonths(currentDate, 1),
        end: addMonths(currentDate, 1),
      };
  }
}

/**
 * Get all days in a date range
 */
export function getDaysInRange(start: Date, end: Date): DayInfo[] {
  const days: DayInfo[] = [];
  let current = startOfDay(start);
  const endDate = endOfDay(end);

  while (current <= endDate) {
    const dayOfWeek = getDay(current);
    days.push({
      date: current,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: isToday(current),
      label: format(current, "d"),
    });
    current = addDays(current, 1);
  }

  return days;
}

/**
 * Get month information for the date range
 */
export function getMonthsInRange(
  start: Date,
  end: Date
): MonthInfo[] {
  const months: MonthInfo[] = [];
  const allDays = getDaysInRange(start, end);
  const monthsMap = new Map<string, { label: string; days: number; startOffset: number }>();

  allDays.forEach((day, index) => {
    const key = format(day.date, "yyyy-MM");
    if (!monthsMap.has(key)) {
      monthsMap.set(key, {
        label: format(day.date, "MMM yyyy"),
        days: 0,
        startOffset: index,
      });
    }
    monthsMap.get(key)!.days++;
  });

  return Array.from(monthsMap.values());
}

/**
 * Get week information for the date range
 */
export function getWeeksInRange(start: Date, end: Date): WeekInfo[] {
  const days = getDaysInRange(start, end);
  const weeksMap = new Map<string, { label: string; days: number; startOffset: number }>();

  days.forEach((day, index) => {
    // Get week number relative to start
    const weekStart = startOfWeek(day.date, { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-ww");
    if (!weeksMap.has(key)) {
      weeksMap.set(key, {
        label: format(weekStart, "MMM d"),
        days: 0,
        startOffset: index,
      });
    }
    weeksMap.get(key)!.days++;
  });

  return Array.from(weeksMap.values());
}

/**
 * Calculate position for a card bar
 */
export function getBarPosition(
  cardStartDate: string | null,
  cardEndDate: string | null,
  minDate: Date,
  dayWidth: number
): { left: number; width: number } | null {
  if (!cardStartDate && !cardEndDate) return null;

  const start = cardStartDate
    ? new Date(cardStartDate)
    : cardEndDate
      ? addDays(new Date(cardEndDate), -3)
      : new Date();
  const end = cardEndDate
    ? new Date(cardEndDate)
    : cardStartDate
      ? addDays(new Date(cardStartDate), 3)
      : new Date();

  const left = differenceInDays(startOfDay(start), startOfDay(minDate)) * dayWidth;
  const width = Math.max(
    (differenceInDays(endOfDay(end), startOfDay(start)) + 1) * dayWidth,
    dayWidth
  );

  return { left, width };
}

/**
 * Navigate to previous period based on view type
 */
export function getPreviousDate(currentDate: Date, viewType: TimelineViewType): Date {
  switch (viewType) {
    case "day":
      return subDays(currentDate, 7);
    case "week":
      return subWeeks(currentDate, 2);
    case "month":
    default:
      return subMonths(currentDate, 1);
  }
}

/**
 * Navigate to next period based on view type
 */
export function getNextDate(currentDate: Date, viewType: TimelineViewType): Date {
  switch (viewType) {
    case "day":
      return addDays(currentDate, 7);
    case "week":
      return addWeeks(currentDate, 2);
    case "month":
    default:
      return addMonths(currentDate, 1);
  }
}

/**
 * Get the header label for the current view
 */
export function getViewLabel(currentDate: Date, viewType: TimelineViewType): string {
  switch (viewType) {
    case "day":
      return format(currentDate, "MMMM yyyy");
    case "week":
      return format(currentDate, "MMMM yyyy");
    case "month":
    default:
      return format(currentDate, "MMMM yyyy");
  }
}