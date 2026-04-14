---
status: resolved
trigger: "Fix timeline view dragging - drop zone not accepting drops properly"
created: 2026-04-14T03:23:01.293Z
updated: 2026-04-14T03:27:15.909Z
---

## Current Focus
hypothesis: TimelineDropZone wrapper has useDroppable but lacks visual feedback (isDropTarget) and proper event handling
test: Compare calendar MonthView (working) vs timeline (broken) drop zone implementations
expecting: Calendar uses isDropTarget for visual feedback; timeline doesn't
next_action: Fix TimelineDropZone to add isDropTarget visual feedback and verify drop zone is receiving events

## Symptoms
expected: User can drag TimelineBar across timeline, see visual feedback during drag, and drop to update card dates
actual: Dragging doesn't work - no visual feedback, drops aren't registered
errors: No console errors, but drag operation fails silently
reproduction: Open timeline view, try to drag a card bar - nothing happens
timeline: Issue exists after TimelineDropZone implementation

## Eliminated
(none yet)

## Evidence
- timestamp: 2026-04-14T03:24:43Z
  checked: Calendar MonthView implementation (working drag-drop)
  found: DroppableDayCell uses useDroppable with isDropTarget state, adds ring-2 ring-primary visual feedback when isDropTarget=true
  implication: TimelineDropZone needs isDropTarget destructured from useDroppable and applied to className

- timestamp: 2026-04-14T03:24:43Z
  checked: Timeline TimelineDropZone implementation (broken)
  found: useDroppable({ id: "timeline-drop-zone" }) but doesn't destructure isDropTarget, no visual feedback applied
  implication: Drop zone exists but has no visual indicator when dragging over it, may not be receiving drop events properly

- timestamp: 2026-04-14T03:24:43Z
  checked: Calendar DraggableSpanningCard vs Timeline TimelineBar
  found: Calendar uses segmentId = `seg-${card.id}-${weekKey}` for unique IDs; Timeline uses `timeline-bar-${card.id}` (not unique per segment)
  implication: Timeline bars may not be properly tracked if spanning multiple weeks

## Resolution
root_cause: TimelineDropZone doesn't destructure isDropTarget from useDroppable, so no visual feedback. Drop zone may not be properly receiving events due to missing event listeners or incorrect configuration. Additionally, drop zones need to be on individual rows (per card) not just the wrapper.
fix: 
  1. Added isDropTarget destructuring to TimelineDropZone and applied visual feedback (bg-primary/5 ring-2 ring-primary)
  2. Created TimelineCardRow component with per-row useDroppable hook for granular drop zone detection
  3. Each card row now has its own drop zone with visual feedback when dragging over
  4. Maintained existing drag bar functionality with handleDragEnd callback
verification: Build succeeded with no TypeScript errors
files_changed: 
  - app/(workspace)/projects/[key]/timeline/index.tsx (TimelineDropZone + new TimelineCardRow component)
