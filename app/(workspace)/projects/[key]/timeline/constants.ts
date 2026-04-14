// Timeline layout constants
export const DAY_WIDTH = 40;
export const ROW_HEIGHT = 44;
export const SUBTASK_HEIGHT = 32;
export const HEADER_HEIGHT = 56;
export const SCOPE_WIDTH = 420;
export const DRAG_ACTIVATION_DISTANCE = 5;

// Status colors mapping
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  backlog: { bg: "hsl(210 10% 80%)", text: "hsl(210 10% 20%)" },
  "to do": { bg: "hsl(199 89% 48%)", text: "white" },
  "in progress": { bg: "hsl(25 95% 53%)", text: "white" },
  review: { bg: "hsl(262 83% 58%)", text: "white" },
  done: { bg: "hsl(142 71% 45%)", text: "white" },
};

/**
 * Get status style based on column title
 */
export function getStatusStyle(colTitle: string): { bg: string; text: string } {
  const key = colTitle.toLowerCase();
  return STATUS_COLORS[key] || { bg: "hsl(210 40% 60%)", text: "white" };
}
