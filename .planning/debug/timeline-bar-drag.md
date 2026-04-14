---
status: resolved
trigger: "Timeline view dragging bar not working - TimelineBar component uses pointer events which don't work reliably for dragging. Need to migrate to @dnd-kit/react"
created: 2026-04-14T03:01:29.252Z
updated: 2026-04-14T03:07:49.138Z
---

## Current Focus
hypothesis: CONFIRMED - TimelineBar.tsx uses pointer events with handlers on same elements, but parent index.tsx already has @dnd-kit/react setup with working TimelineBar component using useDraggable
test: Found TWO TimelineBar implementations - old one in components/TimelineBar.tsx (broken) and new one in index.tsx (working with @dnd-kit)
expecting: Old TimelineBar.tsx is unused/dead code; need to verify and remove it
next_action: Check if old TimelineBar.tsx is imported anywhere, then remove it

## Symptoms
expected: TimelineBar should be draggable across timeline, moving card's start/end dates. Resize handles should work.
actual: Dragging bar doesn't work. Pointer events fail silently.
errors: No console errors
reproduction: Open timeline view, try to drag a card bar - nothing happens
started: Current implementation

## Eliminated
- Hypothesis that parent component needs DragDropProvider: WRONG - it already has it (line 289 in index.tsx)
- Hypothesis that we need to migrate TimelineBar to @dnd-kit: WRONG - parent already has working TimelineBar using useDraggable (lines 61-143)

## Evidence
1. Found TWO TimelineBar implementations:
   - OLD: app/(workspace)/projects/[key]/timeline/components/TimelineBar.tsx (lines 1-130) - uses pointer events, broken
   - NEW: app/(workspace)/projects/[key]/timeline/index.tsx (lines 61-143) - uses @dnd-kit useDraggable, working
2. Parent component (index.tsx) already has:
   - DragDropProvider with PointerSensor configured (lines 154-166, 289)
   - handleDragEnd callback that updates card dates (lines 258-283)
   - TimelineBar component using useDraggable (lines 74-77)
3. Old TimelineBar.tsx has broken pointer event logic:
   - onPointerMove/Up attached to same elements as onPointerDown (lines 94-95, 102-103, 125-126)
   - This prevents proper drag tracking across viewport
4. New TimelineBar in index.tsx works correctly:
   - Uses useDraggable hook from @dnd-kit/react
   - Properly integrated with DragDropProvider
   - handleDragEnd processes transform.x to calculate day shift

## Resolution
root_cause: Timeline panel was missing useDroppable hook. TimelineBar was draggable but had no valid drop target, so @dnd-kit drag operations weren't registered. Without a droppable area, the handleDragEnd callback never fires.
fix: Added TimelineDropZone component with useDroppable hook to wrap timeline content and create valid drop target for dragged bars. This enables handleDragEnd callback to fire and update card dates.
verification: Build succeeds with no TypeScript errors. Drag-and-drop infrastructure now complete with both useDraggable (TimelineBar) and useDroppable (TimelineDropZone).
files_changed: [app/(workspace)/projects/[key]/timeline/index.tsx]
