/**
 * Convert a pixel offset to a day delta based on the column width.
 */
export function pixelOffsetToDays(offsetPx: number, columnWidth: number): number {
  return Math.round(offsetPx / columnWidth);
}

/**
 * Convert a day delta to a pixel offset based on the column width.
 */
export function daysToPixelOffset(days: number, columnWidth: number): number {
  return days * columnWidth;
}
