import { Card } from "@/types/board";

/**
 * Gets the start and end dates for a card considering both dueDate and startDate
 */
export function getCardDateRange(card: Card): { start: Date | null; end: Date | null } {
  let start: Date | null = null;
  let end: Date | null = null;

  if (card.startDate) {
    start = new Date(card.startDate);
  }

  if (card.dueDate) {
    end = new Date(card.dueDate);
  } else if (card.startDate) {
    // If there's a start date but no due date, set end to start date
    end = new Date(card.startDate);
  }

  return { start, end };
}

/**
 * Calculates the duration of a card in days
 */
export function getCardDurationInDays(card: Card): number {
  const { start, end } = getCardDateRange(card);

  if (!start || !end) {
    return 0;
  }

  // Calculate difference in days
  const timeDiff = end.getTime() - start.getTime();
  return Math.round(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a card spans a specific date range
 */
export function cardSpansDateRange(card: Card, startDate: Date, endDate: Date): boolean {
  const { start, end } = getCardDateRange(card);

  if (!start || !end) {
    return false;
  }

  // Check if the card's date range overlaps with the given date range
  return start <= endDate && end >= startDate;
}

/**
 * Groups cards by date
 */
export function groupCardsByDate(cards: Card[]): Map<string, Card[]> {
  const grouped = new Map<string, Card[]>();

  cards.forEach(card => {
    const { start, end } = getCardDateRange(card);

    // Use the start date as the grouping key, or due date if start is not available
    const dateKey = start ? formatDateKey(start) : (end ? formatDateKey(end) : null);

    if (dateKey) {
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(card);
    }
  });

  return grouped;
}

/**
 * Formats a date as a YYYY-MM-DD string for consistent key usage
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Checks if a date is in the current week
 */
export function isThisWeek(date: Date): boolean {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneWeekLater = new Date(today);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);

  return date >= oneWeekAgo && date <= oneWeekLater;
}