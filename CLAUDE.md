# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

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