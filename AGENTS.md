<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# ZenArc Agent Rules

- **Framework**: Next.js 16 (App Router), React 19, TypeScript.
- **State**: Normalized `BoardState` (`columns` and `cards`) with `useBoardForProject` hook.
- **Drag-and-Drop**: `@dnd-kit`. All views must wrap their content in a `DragDropProvider`.
- **Unique Draggable IDs**: Use `seg-${card.id}-${weekKey}` for spanning segments in the Calendar view.
- **Dates**: Store as ISO strings in `Card`. Use `dateKey()` from `calendar/utils/calendarUtils.ts` for consistent `YYYY-MM-DD` mapping.

## Build and Test Commands

- **Install**: `pnpm install`
- **Development**: `pnpm dev` (port 1707)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`

See [.github/copilot-instructions.md](.github/copilot-instructions.md) and [CLAUDE.md](CLAUDE.md) for more detailed guidelines.
