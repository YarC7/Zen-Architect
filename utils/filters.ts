import { Card } from "@/types/board";

export interface FilterParams {
  filterLabel: string | null;
  filterAssignee: string | null;
}

/**
 * Filters cards based on label and assignee filters
 */
export function filterCards(cards: Record<string, Card>, cardIds: string[], filters: FilterParams): string[] {
  const { filterLabel, filterAssignee } = filters;

  return cardIds.filter((id) => {
    const card = cards[id];
    if (!card) return false;

    if (filterLabel && !card.labels.some((l) => l.id === filterLabel)) {
      return false;
    }

    if (filterAssignee && !card.assignees.some((a) => a.id === filterAssignee)) {
      return false;
    }

    return true;
  });
}

/**
 * Gets all unique assignees from a collection of cards
 */
export function getAllAssignees(cards: Record<string, Card>): { id: string; name: string; color: string }[] {
  const map = new Map<string, { id: string; name: string; color: string }>();

  Object.values(cards).forEach((card) => {
    card.assignees.forEach((assignee) => {
      map.set(assignee.name, assignee);
    });
  });

  return Array.from(map.values());
}