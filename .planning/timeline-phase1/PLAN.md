# Phase 1: Timeline MVP — Drag & Drop

Transform the static Gantt chart into an interactive Trello-like Timeline where users can adjust dates through drag-and-drop and assign dates to undated cards.

## Features

1. **Bar drag-to-move** — drag a bar horizontally to change its start/end dates
2. **Edge resize** — drag left/right edges to adjust start/end dates independently
3. **Undated card drop** — drag cards from "No date" section onto the timeline to assign dates
4. **All existing functionality preserved** — zoom, today marker, left panel, card click

## Architecture

### Key Decisions

- **Native pointer events** for bar drag/resize (not @dnd-kit sortable) — sortable is designed for reordering, not free-form horizontal positioning
- **@dnd-kit** reserved for cross-container drops (undated cards → timeline rows)
- **startDate** field added to Card type — replaces the "dueDate - 3 days" hack with explicit start dates
- **Persist on drag end only**, not during drag — prevents data races

### File Structure

```
app/(workspace)/projects/[key]/timeline/
├── index.tsx                          # Modified: main view with DragDropProvider
├── components/
│   ├── TimelineBar.tsx                # New: draggable, resizable bar
│   ├── NoDateDropZone.tsx             # New: drop target for undated cards
│   └── UndatedCardDraggable.tsx       # New: draggable undated card
└── utils/
    ├── dateUtils.ts                   # New: extracted date helpers
    └── dragHelpers.ts                 # New: pixel/date conversion

types/
└── board.ts                           # Modified: add startDate to Card
```

## Implementation Steps

### Step 1: Add startDate to Card type
- File: `types/board.ts`
- Add `startDate: string | null; // ISO date string` after `dueDate`
- Existing cards default to null, falling back to current behavior

### Step 2: Extract date utilities
- File: `timeline/utils/dateUtils.ts`
- Extract `addDays`, `daysBetween`, `startOfWeek`, `formatDateShort`
- Pure function extraction, no behavior change

### Step 3: Create drag helpers
- File: `timeline/utils/dragHelpers.ts`
- `pixelOffsetToDays(offset, columnWidth)` and `daysToPixelOffset(days, columnWidth)`
- Simple math conversions

### Step 4: Create TimelineBar component
- File: `timeline/components/TimelineBar.tsx`
- Extract current inline bar into dedicated component
- Add native pointer event handlers for horizontal drag
- On drag end: compute delta → convert to days → call `onDragMove(newDates)`
- Add left/right resize handles (6px-wide, `cursor: ew-resize`)
- Minimum bar width: 1 day

### Step 5: Create NoDateDropZone + UndatedCardDraggable
- File: `timeline/components/NoDateDropZone.tsx`
- File: `timeline/components/UndatedCardDraggable.tsx`
- @dnd-kit sortable for undated cards in left panel
- Drop zone in right panel maps X coordinate → date
- On drop: compute targetDate, set startDate + dueDate (default 3-day duration)

### Step 6: Integrate DragDropProvider in TimelineView
- File: `timeline/index.tsx`
- Wrap in DragDropProvider
- Add onDragOver / onDragEnd handlers
- Pass updateCard to children
- Update timelineCards computation to use startDate

### Step 7: Parent Integration
- File: `page.tsx`
- Pass updateCard to TimelineView

## Testing Checklist

- [ ] Bar drags horizontally and updates dates on release
- [ ] Left edge resize changes start date correctly
- [ ] Right edge resize changes end date correctly
- [ ] Bar cannot shrink below 1-day duration
- [ ] Undated card drags from left panel
- [ ] Dropping undated card onto timeline assigns startDate and dueDate
- [ ] Zoom level changes work correctly after drag
- [ ] Today marker still displays
- [ ] Left panel still clickable
- [ ] Card click on bar opens detail dialog
- [ ] Completed cards display correctly
- [ ] No regression in other views
