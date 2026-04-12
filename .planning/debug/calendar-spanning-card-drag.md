---
status: verifying
trigger: "Calendar spanning card - first week segment not draggable, opens dialog instead"
created: "2026-04-12T00:00:00.000Z"
updated: "2026-04-12T00:20:00.000Z"
---

## Current Focus
hypothesis: FIXED - duplicate dnd-kit IDs caused first segment to lose drag registration. Now each segment has unique id `seg-${card.id}-${weekKey}`. onClick prevented during drag via isDragSource check.

test: Build the project and verify no TypeScript errors. Test drag behavior on both segments.

expecting: Build succeeds, both segments draggable, drag doesn't open dialog

next_action: run build to verify no compilation errors

## Symptoms

expected: Spanning cards should be draggable from any segment (first week, continuation week, etc.). Dragging should NOT trigger the onClick event that opens the card detail dialog.

actual:
1. The first week's portion of a spanning card cannot be dragged - cursor shows a globe icon instead of grab cursor, and drag/pick/drop doesn't work
2. Only the continuation portion (next week's segment) is draggable
3. Click-and-hold on the non-draggable segment fires the onClick event, opening the card detail dialog instead of initiating a drag

timeline: Issue was introduced during the dnd-kit migration for calendar drag-and-drop
reproduction: Create a card that spans from one week to the next. Try to drag the first week's segment. Try to drag the continuation week's segment. Compare behavior.

## Eliminated

- hypothesis: CSS pointer-events issue (pointer-events-auto on outer div, pointer-events-none on parent DroppableDayCell causing z-order conflicts)
  evidence: Both MonthView and WeekView DraggableSpanningCard have pointer-events-auto on outer div. The parent of spanning cards is the WeekRow grid, NOT a pointer-events-none cell. So pointer-events is not the issue.
  timestamp: "2026-04-12T00:05:00.000Z"

## Evidence

- timestamp: "2026-04-12T00:03:00.000Z"
  checked: MonthView.tsx DraggableSpanningCard (line 298)
  found: useDraggable({ id: card.id, ... }) - uses raw card.id as the draggable id
  implication: If same card appears in multiple WeekRow components, multiple useDraggable calls share the same id

- timestamp: "2026-04-12T00:04:00.000Z"
  checked: WeekView.tsx DraggableSpanningCard (line 241)
  found: useDraggable({ id: card.id, ... }) - same pattern, uses raw card.id
  implication: Same duplicate id problem if card spans across view boundaries

- timestamp: "2026-04-12T00:06:00.000Z"
  checked: MonthView.tsx WeekRow logic (lines 130-154)
  found: Each week classifies cards as spanning if cardEnd >= weekStart AND cardStart <= weekEnd
  implication: A card spanning April 3-18 will be in Week 1, Week 2, AND Week 3. Each renders DraggableSpanningCard with same id: card.id

- timestamp: "2026-04-12T00:07:00.000Z"
  checked: MonthView.tsx MonthView (lines 71-107)
  found: All WeekRow components are within single DragDropProvider
  implication: All DraggableSpanningCard instances across all weeks register under same DragDropProvider, making id collisions real

- timestamp: "2026-04-12T00:08:00.000Z"
  checked: dnd-kit behavior with duplicate ids
  found: dnd-kit expects unique ids for each draggable. When two useDraggable calls share the same id, the last registered one "wins"
  implication: First week's segment loses dnd-kit registration. It becomes a plain div with onClick but no drag. The continuation week's segment (rendered later) "wins" the registration.

- timestamp: "2026-04-12T00:09:00.000Z"
  checked: Why globe cursor on first week segment
  found: First segment's useDraggable registration was overwritten by later segment's registration. The ref still points to the DOM element, but dnd-kit no longer associates it with the draggable.
  implication: Confirms duplicate id is root cause - first segment is "orphaned" from dnd-kit

- timestamp: "2026-04-12T00:15:00.000Z"
  checked: Why onClick fires during drag attempt
  found: First segment's drag registration was lost (overwritten by duplicate id). Without dnd-kit handlers, browser treats it as normal click, firing onClick which opens the detail dialog.
  implication: Both bugs (drag not working + dialog opening) have same root cause: duplicate id

- timestamp: "2026-04-12T00:20:00.000Z"
  checked: Fix applied to MonthView.tsx and WeekView.tsx
  found: 1) segmentId uses `seg-${card.id}-${weekKey}` for uniqueness. 2) onClick checks isDragSource to prevent click during drag.
  implication: Fix addresses both issues

## Resolution

root_cause: Two bugs, same root cause: Duplicate dnd-kit draggable IDs.

BUG 1 (Primary - Duplicate IDs): In MonthView, a multi-week card creates DraggableSpanningCard in EACH WeekRow. ALL instances use useDraggable({ id: card.id }) - the SAME id. dnd-kit v7 requires unique ids per draggable. The last registered segment (rendered latest in DOM) "wins" the registration, overwriting earlier segments. First week's segment loses dnd-kit handlers entirely, becoming a plain div.

BUG 2 (Secondary - Click fires during drag): Since first segment's drag registration is lost, clicking it just fires onClick, opening the card detail dialog.

fix:
1. Generate unique segment IDs: `seg-${card.id}-${weekKey}` in DraggableSpanningCard
2. Pass weekKey from MonthView -> WeekRow -> DraggableSpanningCard
3. Pass weekKey from WeekView -> DraggableSpanningCard
4. Use useDraggable's isDragSource return value to prevent onClick during drag: if (isDragSource) { e.stopPropagation(); return; }
5. Wrapped handleDragEnd in useCallback with proper dependencies

verification:
files_changed:
- MonthView.tsx: Added unique segment IDs, isDragSource click guard, useCallback, weekKey prop flow
- WeekView.tsx: Added unique segment IDs, isDragSource click guard, useCallback, weekKey prop
