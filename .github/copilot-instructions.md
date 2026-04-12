# ZenArc Project Guidelines

ZenArc is a project management system built with Next.js 16, React 19, and @dnd-kit. It provides Kanban, List, Timeline, and Calendar views for tasks.

## Code Style & Conventions

- **React & Next.js**: Uses Next.js 16 App Router and React 19. Be aware of breaking changes from earlier versions.
- **Styling**: Tailwind CSS 4 with shadcn/ui. Use `lib/utils.ts` for class merging.
- **Icons**: Lucide React.
- **Dates**: Store as ISO strings in `Card` objects. Use `dateKey()` from `calendar/utils/calendarUtils.ts` for `YYYY-MM-DD` keys.

## Architecture

- **State Management**: The `useBoardForProject` hook in `hooks/useBoardForProject.ts` is the central state manager.
- **Data Model**: Normalized `BoardState` with `columns` (cardIds) and `cards` lookup. See `types/board.ts` for definitions.
- **Drag-and-Drop**: Implemented via `@dnd-kit`. All views must wrap their content in a `DragDropProvider`.
- **Unique Draggable IDs**: For multi-segment cards (e.g., in Calendar), use unique IDs like `seg-${card.id}-${weekKey}` to differentiate segments.

## Build and Test

- **Install**: `pnpm install`
- **Development**: `pnpm dev` (Runs on port 1707)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`

## Key Files

- [State Logic](hooks/useBoardForProject.ts)
- [Data Types](types/board.ts)
- [Main Entry](<app/(workspace)/projects/[key]/page.tsx>)
- [Calendar Utilities](<app/(workspace)/projects/[key]/calendar/utils/calendarUtils.ts>)

For detailed architecture and drag-and-drop logic, see [CLAUDE.md](CLAUDE.md).
