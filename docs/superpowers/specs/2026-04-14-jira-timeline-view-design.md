# Jira-Style Timeline View Design

**Date:** 2026-04-14
**Status:** Approved
**Reference:** Image from Trello-style Jira timeline

---

## 1. Overview

We will refactor the existing timeline view to match Jira's Timeline/Gantt design with:
- Swimlane-based task rows with multiple organization modes
- Color-coded task bars with label colors and rounded styling
- Zoom levels (days/weeks/months) with proper date headers
- Today marker line
- Weekend shading
- Full drag-to-move and resize functionality

---

## 2. Data Model

No schema changes required. We use existing Card fields:
- `title`: Task name
- `labels`: Color-coded labels for bar colors
- `assignees`: Avatar display on bars
- `startDate`: Task start date
- `dueDate`: Task end date

Organization modes are computed in the component - no database changes.

---

## 3. Component Architecture

### File Structure

```
timeline/
├── index.tsx                    # Main TimelineView (refactored)
├── components/
│   ├── TimelineHeader.tsx        # Date headers (weeks/months)
│   ├── TimelineSwimlanes.tsx      # Task rows container
│   ├── TimelineRow.tsx           # Individual swimlane
│   ├── TimelineBar.tsx            # Task bar (refactored)
│   ├── TimelineTodayMarker.tsx    # Red today line
│   └── TimelineWeekendShading.tsx # Weekend backgrounds
├── hooks/
│   └── useTimelineOrganization.ts # Organization mode logic
└── utils/
    └── dateUtils.ts               # (existing, may need additions)
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `TimelineView` | Main container, manages zoom state, organization mode, coordinates data |
| `TimelineSwimlanes` | Renders all swimlane rows based on selected organization |
| `TimelineRow` | Single task row with name on left, bar on right |
| `TimelineBar` | Draggable/resizable task bar with Jira styling |
| `TimelineHeader` | Date headers with week/month labels |
| `TimelineTodayMarker` | Red vertical line at current date |
| `TimelineWeekendShading` | Gray background for weekend days |
| `useTimelineOrganization` | Hook for computing swimlane order by different modes |

---

## 4. UI/Visual Specifications

### Layout Dimensions

| Element | Value |
|---------|-------|
| Left panel width | 280px |
| Header height | 48px |
| Row height | 36px |
| Bar height | 24px |
| Bar vertical padding | 6px |
| Column width (days) | 32px |
| Column width (weeks) | 16px |
| Column width (months) | 8px |

### Colors

| Element | Color |
|---------|-------|
| Bar background | First label's HSL color, default to `199 89% 48%` (blue) |
| Bar border-radius | 4px |
| Today line | `#E12D0D`, 2px width |
| Weekend shading | `rgba(0,0,0,0.03)` |
| Header background | `rgb(250,250,250)` |
| Header text | `#5E6C84` (Jira secondary gray) |
| Task name | 13px, regular weight |
| Bar label | 11px, medium weight, white |
| Assignee avatar | 20px circle, 2px white border |

### Visual Details

- Rounded task bars with subtle shadow
- Avatar circles on bars showing assignees
- Today marker with "Today" label above the line
- Weekend columns slightly darker
- Smooth scroll synchronization between panels

---

## 5. Interactions

### Drag to Move
- Click and drag bar body to move entire task
- Snaps to day boundaries
- Updates both startDate and dueDate while preserving duration

### Resize Handles
- Left handle: adjust startDate (minimum 1 day duration)
- Right handle: adjust dueDate (minimum 1 day duration)
- Hit area: 8px wide invisible zone
- Cursor: `ew-resize` on handles

### Zoom Controls
- Three-button toggle: Days | Weeks | Months
- Persists in component state

### Organization Mode Switcher
- Dropdown with options: Alphabetical | By Assignee | By Label | Chronological
- Updates swimlane ordering in real-time

### Scroll Behavior
- Vertical scroll: independent in left/right panels
- Horizontal scroll: synchronized (drag one, other follows)

---

## 6. Organization Modes

| Mode | Logic |
|------|-------|
| Alphabetical | Sort by card.title (A-Z) |
| By Assignee | Group by first assignee, then by start date |
| By Label | Group by first label, then by start date |
| Chronological | Sort by startDate (current behavior) |

---

## 7. Implementation Notes

### Keep from Current Code
- Date calculation utilities in `utils/dateUtils.ts`
- `pixelOffsetToDays` and drag logic in `TimelineBar`
- Basic scroll synchronization

### New Additions
- Weekend detection and shading
- Today marker component
- Organization mode hook
- Updated header rendering with week numbers
- Jira-style visual refinements

### Performance Considerations
- Memoize swimlane ordering computation
- Use `React.memo` on TimelineRow to prevent unnecessary re-renders

---

## 8. Acceptance Criteria

- [ ] Timeline displays tasks in swimlane rows
- [ ] Task bars show with Jira-style rounded corners and label colors
- [ ] Assignee avatars appear on task bars
- [ ] Zoom works: Days/Weeks/Months
- [ ] Date headers show correctly for each zoom level
- [ ] Today marker shows red vertical line
- [ ] Weekend columns have subtle shading
- [ ] Drag to move updates task dates
- [ ] Resize handles adjust task duration
- [ ] Organization modes work: Alphabetical, By Assignee, By Label, Chronological
- [ ] Left panel scrolls independently from timeline
- [ ] Horizontal scroll is synchronized between panels
