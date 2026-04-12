# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZenArc is a comprehensive project management system built with Next.js 16 that provides multiple views for task management: Kanban, List, Timeline, and Calendar. The application uses @dnd-kit for drag-and-drop functionality across all views.

## Architecture

### Directory Structure
- `app/(workspace)/projects/[key]/` - Main application routes and views
  - `kanban/` - Kanban board implementation with columns and cards
  - `list/` - List view for tasks
  - `timeline/` - Timeline view for tasks with date ranges
  - `calendar/` - Calendar view with month, week, and day views
- `components/` - Reusable UI components
- `types/` - Shared TypeScript interfaces (board.ts contains Card, Label, etc.)
- `hooks/` - Custom React hooks for state management
- `utils/` - Utility functions

### Data Model
- **Card**: Contains title, description, labels, dueDate, startDate, assignees, checklist, etc.
- **Label**: Named tags with color properties for categorizing cards
- **BoardState**: Contains columns and cards in a normalized structure

### Views Architecture
The application uses a tabbed interface in `page.tsx` to switch between different views:
- **Kanban**: Drag-and-drop board with columns and cards
- **List**: Table-like view of all cards
- **Timeline**: Gantt-chart style view showing card durations
- **Calendar**: Calendar view with cards appearing on their due/start dates

## Key Technologies

- Next.js 16 with App Router
- React 19
- TypeScript
- @dnd-kit for drag-and-drop functionality
- Tailwind CSS for styling
- Shadcn/ui for component primitives
- Lucide React for icons

## Development Commands

```bash
# Start development server (runs on port 1707)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint
```

## Calendar View Specifics

The calendar view is implemented with:
- MonthView: Shows cards spanning multiple days across a month grid
- WeekView: Shows cards in a weekly view
- DayView: Shows cards for a single day
- DraggableSpanningCard: Handles cards that span multiple days/weeks
- Drag-and-drop functionality that maintains proper start/end date relationships when moving cards

### Calendar Drag-and-Drop Logic
- Cards can span multiple days and appear in multiple weeks/months
- Each segment of a spanning card has a unique draggable ID: `seg-${card.id}-${weekKey}`
- When dragging a card, the drop location becomes the new start date
- The end date is calculated based on the original duration
- Example: Dragging a card from April 5-10 to April 8 results in April 8-13

## Component Structure

### Drag-and-Drop Implementation
- Uses @dnd-kit/react and @dnd-kit/dom
- DragDropProvider wraps each view with appropriate event handlers
- useDraggable and useDroppable hooks for individual elements
- PointerSensor with distance constraint to prevent accidental drags

### State Management
- Custom hook `useBoardForProject` manages board state
- Board state is normalized with columns containing cardIds and cards stored separately
- Each view receives filtered card data based on active filters

### Filtering System
- Supports filtering by labels and assignees
- Filters are applied across all views consistently
- Filter UI is available in the header of the project page

## Common Patterns

### Unique Draggable IDs
For components that may appear multiple times (like spanning cards), use unique IDs that include context:
```typescript
// Instead of just card.id
id: `seg-${card.id}-${weekKey}`
```

### Event Handling
- Click events should be prevented during drag operations using `isDragSource` check
- Always call `e.stopPropagation()` in click handlers to prevent bubbling
- Use `useCallback` for event handlers in components that render frequently

### Date Handling
- Use `dateKey()` utility function to generate consistent date strings
- Dates are stored as ISO strings in the Card interface
- Calendar utilities handle week/month calculations and date ranges

## File Locations

### Calendar Components
- `app/(workspace)/projects/[key]/calendar/index.tsx` - Main calendar view container
- `app/(workspace)/projects/[key]/calendar/components/` - Calendar-specific components
- `app/(workspace)/projects/[key]/calendar/utils/calendarUtils.ts` - Date utilities

### Main Application Logic
- `app/(workspace)/projects/[key]/page.tsx` - Main project view with tabs
- `types/board.ts` - Data type definitions
- `hooks/useBoardForProject.ts` - State management hook