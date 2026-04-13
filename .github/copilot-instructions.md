# ZenArc Project Guidelines

ZenArc is a project management system built with Next.js 16, React 19, and @dnd-kit. It provides Kanban, List, Timeline, and Calendar views for tasks. This document outlines coding guidelines, architectural decisions, and development practices to maintain code quality and consistency across the project.

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
