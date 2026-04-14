# Implementation Plan: Timeline View Filters and View Types

## Overview
Add filtering capabilities (by assignee, label, status) and view type switching (day, week, month granularity) to the Timeline view. The Timeline currently shows cards grouped by columns with date bars at a fixed month-level granularity. This plan extends it with the same filter UI pattern used in Kanban/List views and introduces three timeline granularities similar to the Calendar view's approach.

## Requirements
1. Filter by assignee (people assigned to cards)
2. Filter by label (card labels)  
3. Filter by status (column the card is in)
4. View type toggle: day, week, month view with appropriate date range calculations
5. Integrate with existing filter state from page.tsx
6. Maintain drag-and-drop functionality across all view types

## Architecture Changes

### New Files
- `app/(workspace)/projects/[key]/timeline/types.ts` — Timeline-specific types (TimelineViewType)
- `app/(workspace)/projects/[key]/timeline/utils/timelineUtils.ts` — Date range and granularity calculations
- `app/(workspace)/projects/[key]/timeline/components/TimelineHeader.tsx` — View type selector and controls

### Modified Files
- `app/(workspace)/projects/[key]/timeline/index.tsx` — Add filter props, view type state, integrate header
- `app/(workspace)/projects/[key]/page.tsx` — Pass filter state to TimelineView, add view type state

## Implementation Steps

### Phase 1: Types and Utilities (Foundation)

1. **Create Timeline types file** (File: `app/(workspace)/projects/[key]/timeline/types.ts`)
   - Action: Define `TimelineViewType = 'day' | 'week' | 'month'`
   - Why: Establish type safety for view switching, mirror Calendar's CalendarView pattern
   - Dependencies: None
   - Risk: Low

2. **Create timeline utilities** (File: `app/(workspace)/projects/[key]/timeline/utils/timelineUtils.ts`)
   - Action: Implement functions for calculating date ranges based on view type:
     - `getDateRangeForView(currentDate: Date, viewType: TimelineViewType): { start: Date; end: Date }`
     - `getDaysInRange(start: Date, end: Date): Date[]`
     - `getMonthsInRange(start: Date, end: Date): Array<{ label: string; days: number; startOffset: number }>`
     - `getWeeksInRange(start: Date, end: Date): Array<{ label: string; days: number; startOffset: number }>`
   - Why: Encapsulate date logic, reuse across view types, keep TimelineView component clean
   - Dependencies: date-fns library (already imported in TimelineView)
   - Risk: Low — pure functions, easy to test

### Phase 2: Header Component (UI Controls)

3. **Create TimelineHeader component** (File: `app/(workspace)/projects/[key]/timeline/components/TimelineHeader.tsx`)
   - Action: Build header with:
     - View type selector (day/week/month buttons or dropdown)
     - Navigation buttons (prev/next) that respect view type
     - "Today" button to jump to current date
     - Optional: Show current date range label
   - Why: Centralize timeline-specific controls, keep page.tsx clean
   - Dependencies: Step 1 (TimelineViewType), Step 2 (date utilities)
   - Risk: Low — UI-only component

### Phase 3: Filter Integration (State Management)

4. **Update TimelineView props** (File: `app/(workspace)/projects/[key]/timeline/index.tsx`)
   - Action: Add props to TimelineViewProps interface:
     - `filterLabel: string | null`
     - `filterAssignee: string | null`
     - `filterStatus: string | null` (column id)
     - `viewType: TimelineViewType`
     - `currentDate: Date`
     - `onViewTypeChange: (type: TimelineViewType) => void`
     - `onDateChange: (date: Date) => void`
   - Why: Accept filter state from parent (page.tsx), enable view type switching
   - Dependencies: Step 1 (TimelineViewType)
   - Risk: Low — additive change to props

5. **Implement card filtering logic** (File: `app/(workspace)/projects/[key]/timeline/index.tsx`)
   - Action: Create `getFilteredCards()` function that:
     - Filters by label if `filterLabel` is set
     - Filters by assignee if `filterAssignee` is set
     - Filters by status (column) if `filterStatus` is set
     - Returns filtered card array
   - Why: Apply filters consistently across all view types
   - Dependencies: Step 4 (filter props)
   - Risk: Low — mirrors existing filter logic from page.tsx

6. **Update date range calculation** (File: `app/(workspace)/projects/[key]/timeline/index.tsx`)
   - Action: Modify the `useMemo` that calculates `minDate`, `months`, `days`, `totalDays`:
     - Use `getDateRangeForView(currentDate, viewType)` to determine range
     - Use `getMonthsInRange()` or `getWeeksInRange()` based on viewType
     - Recalculate when `viewType` or `currentDate` changes
   - Why: Support different granularities (day shows 1-2 weeks, week shows 4-6 weeks, month shows 2-3 months)
   - Dependencies: Step 2 (utilities), Step 4 (viewType prop)
   - Risk: Medium — affects core layout calculations, needs testing

7. **Integrate TimelineHeader** (File: `app/(workspace)/projects/[key]/timeline/index.tsx`)
   - Action: Render TimelineHeader above the timeline grid:
     - Pass `viewType`, `currentDate`, `onViewTypeChange`, `onDateChange`
     - Position it in the flex layout before the main timeline container
   - Why: Provide user controls for view switching and navigation
   - Dependencies: Step 3 (TimelineHeader component), Step 4 (props)
   - Risk: Low — UI integration

### Phase 4: Parent Component Integration (page.tsx)

8. **Add timeline-specific state to page.tsx** (File: `app/(workspace)/projects/[key]/page.tsx`)
   - Action: Add state variables:
     - `const [timelineViewType, setTimelineViewType] = useState<TimelineViewType>('month')`
     - `const [timelineCurrentDate, setTimelineCurrentDate] = useState(new Date())`
   - Why: Manage timeline view state at page level, persist across view switches
   - Dependencies: Step 1 (TimelineViewType)
   - Risk: Low — simple state addition

9. **Pass filter and view state to TimelineView** (File: `app/(workspace)/projects/[key]/page.tsx`)
   - Action: Update TimelineView render call to pass:
     - `filterLabel={filterLabel}`
     - `filterAssignee={filterAssignee}`
     - `filterStatus={selectedStatus}` (optional, or null if not filtering by status)
     - `viewType={timelineViewType}`
     - `currentDate={timelineCurrentDate}`
     - `onViewTypeChange={setTimelineViewType}`
     - `onDateChange={setTimelineCurrentDate}`
   - Why: Connect page-level filter state to TimelineView
   - Dependencies: Step 8 (state), Step 4 (TimelineView props)
   - Risk: Low — straightforward prop passing

10. **Add status filter option to filter popover** (File: `app/(workspace)/projects/[key]/page.tsx`)
    - Action: Add optional status filter section in the filter popover:
      - Show all columns as filter options
      - Allow selecting one column to filter by status
      - Only show when activeView === 'timeline' (or show for all views)
    - Why: Enable filtering by status/column in Timeline (and optionally other views)
    - Dependencies: None (optional enhancement)
    - Risk: Low — additive UI change

### Phase 5: Testing and Refinement

11. **Test filter application** (File: `app/(workspace)/projects/[key]/timeline/index.tsx`)
    - Action: Verify that:
      - Filtering by label hides cards without that label
      - Filtering by assignee hides cards without that assignee
      - Filtering by status hides cards not in that column
      - Multiple filters work together (AND logic)
      - Clearing filters shows all cards
    - Why: Ensure filter logic is correct
    - Dependencies: Steps 4-5 (filter implementation)
    - Risk: Low — unit testable

12. **Test view type switching** (File: `app/(workspace)/projects/[key]/timeline/index.tsx`)
    - Action: Verify that:
      - Day view shows ~7-14 days with appropriate DAY_WIDTH scaling
      - Week view shows ~4-6 weeks with week headers
      - Month view shows ~2-3 months with month headers (current behavior)
      - Navigation buttons (prev/next) work correctly for each view type
      - Today button jumps to current date
      - Drag-and-drop still works in all view types
    - Why: Ensure view switching is smooth and functional
    - Dependencies: Steps 2, 6 (date calculations)
    - Risk: Medium — complex interactions, needs manual testing

13. **Test drag-and-drop across view types** (File: `app/(workspace)/projects/[key]/timeline/index.tsx`)
    - Action: Verify that:
      - Dragging cards updates dates correctly in day/week/month views
      - DAY_WIDTH calculations are consistent
      - Drop zones work in all view types
    - Why: Ensure core functionality isn't broken by view changes
    - Dependencies: Steps 6, 12 (view type implementation)
    - Risk: Medium — drag-and-drop is complex

## Testing Strategy

### Unit Tests
- `timelineUtils.ts`: Test date range calculations for each view type
- Filter logic: Test card filtering with various filter combinations

### Integration Tests
- TimelineView with filters: Render with different filter combinations, verify card visibility
- View type switching: Switch between day/week/month, verify layout changes
- Navigation: Test prev/next buttons in each view type

### E2E Tests (Manual)
- Full user flow: Open timeline, switch view types, apply filters, drag cards, verify dates update
- Edge cases: Filter with no matching cards, drag cards across month boundaries in day view

## Risks & Mitigations

- **Risk**: Date range calculations are incorrect for day/week views
  - Mitigation: Write unit tests for `getDateRangeForView()`, test edge cases (month boundaries, leap years)

- **Risk**: DAY_WIDTH scaling breaks layout in day view (too wide) or week view (too narrow)
  - Mitigation: Consider making DAY_WIDTH dynamic based on viewType, or adjust SCOPE_WIDTH. Test with real data.

- **Risk**: Drag-and-drop calculations break when view type changes
  - Mitigation: Ensure `getBarPosition()` uses consistent date math, test dragging in each view type

- **Risk**: Performance degrades with many cards and frequent view switching
  - Mitigation: Memoize date calculations, profile with React DevTools

- **Risk**: Filter state doesn't persist when switching between views
  - Mitigation: Store filter state at page level (already done), ensure TimelineView receives updated props

## Success Criteria

- [ ] Filters (label, assignee, status) work correctly in Timeline view
- [ ] View type selector renders and switches between day/week/month
- [ ] Date range calculations are correct for each view type
- [ ] Navigation buttons (prev/next/today) work in all view types
- [ ] Drag-and-drop functionality works in all view types
- [ ] Filters persist when switching between views
- [ ] No console errors or TypeScript type errors
- [ ] Layout is responsive and readable in all view types
- [ ] All tests pass with 80%+ coverage

## File Paths Summary

**New files:**
- `app/(workspace)/projects/[key]/timeline/types.ts`
- `app/(workspace)/projects/[key]/timeline/utils/timelineUtils.ts`
- `app/(workspace)/projects/[key]/timeline/components/TimelineHeader.tsx`

**Modified files:**
- `app/(workspace)/projects/[key]/timeline/index.tsx`
- `app/(workspace)/projects/[key]/page.tsx`