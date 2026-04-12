# Phase 1: Migrate Calendar DnD to @dnd-kit

## Goal
Replace custom pointer-event drag-and-drop in MonthView and WeekView with @dnd-kit, matching the kanban implementation pattern.

## Current State
- MonthView.tsx and WeekView.tsx use custom `onPointerDown`, `onPointerMove`, `onPointerUp` handlers
- Inline `SpanningCard` and `DayCard` components inside MonthView and WeekView
- CalendarCard.tsx exists but is unused (MonthView/WeekView render their own card components)
- Drag logic: `dragRef` tracks card ID, start position, duration; `document.elementFromPoint()` finds drop targets
- Kanban already uses `@dnd-kit/react` with `DragDropProvider` and `move()` from `@dnd-kit/helpers`

## Target State
- MonthView and WeekView wrapped in `@dnd-kit/react` `<DragDropProvider>`
- Calendar cards wrapped with `@dnd-kit/react` `useDraggable`
- Day cells wrapped with `@dnd-kit/react` `useDroppable`
- Drop logic handled via dnd-kit's `onDragOver`/`onDragEnd` callbacks
- No more `elementFromPoint`, `setPointerCapture`, or manual `pointerId` tracking

## Tasks

### Task 1: Create reusable calendar card components
- Extract `CalendarCard` as a single component used across MonthView and WeekView
- Or use inline `SpanningCard`/`DayCard` with `useDraggable` wrapper
- Location: `calendar/components/`

### Task 2: Add @dnd-kit to MonthView
- Replace pointer-event drag with `DragDropProvider`
- Wrap day cells with `useDroppable`
- Make cards draggable via `useDraggable`
- Handle drop via `onDragEnd` callback, computing new start/end dates from drop target
- Preserve existing `onUpdateCard` integration

### Task 3: Add @dnd-kit to WeekView
- Same migration as MonthView
- Handle both spanning cards (multi-day) and single-day cards

### Task 4: Clean up unused code
- Remove `dragRef`, `handleDragStart/Move/End`, `pointerCapture` references
- Remove `elementFromPoint` usage
- Verify no `console.log` introduced

### Task 5: Verify build
- Run `npm run lint` and `npm run build`
- Ensure no TypeScript errors
- Verify drag-and-drop works in both views

## Dependencies
- @dnd-kit packages already installed: @dnd-kit/abstract, @dnd-kit/helpers, @dnd-kit/react

## Success Criteria
- Cards can be dragged between day cells in MonthView and WeekView
- Multi-day spanning cards preserve duration when moved
- Click on a card (without drag) still opens card detail
- Drop target visual feedback (ring highlight) during drag
- Build passes with no errors
