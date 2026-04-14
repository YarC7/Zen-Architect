# Jira-Style Timeline View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing timeline view to match Jira's Timeline/Gantt design with swimlanes, color-coded bars, weekend shading, today marker, and multiple organization modes.

**Architecture:** We will refactor existing timeline code while keeping the date calculation utilities and drag logic. New components will be created for header, swimlanes, today marker, and weekend shading. Organization mode logic will be extracted to a custom hook.

**Tech Stack:** Next.js 16, React 19, TypeScript, @dnd-kit for drag-and-drop (optional), CSS modules or Tailwind

---

## File Structure

```
app/(workspace)/projects/[key]/timeline/
├── index.tsx                      # Main TimelineView (refactored)
├── components/
│   ├── TimelineHeader.tsx         # NEW: Date headers (weeks/months)
│   ├── TimelineSwimlanes.tsx      # NEW: Task rows container
│   ├── TimelineRow.tsx            # NEW: Individual swimlane
│   ├── TimelineBar.tsx            # MODIFIED: Jira-style styling
│   ├── TimelineTodayMarker.tsx    # NEW: Red today line
│   └── TimelineWeekendShading.tsx # NEW: Weekend backgrounds
├── hooks/
│   └── useTimelineOrganization.ts # NEW: Organization mode logic
└── utils/
    └── dateUtils.ts               # MODIFIED: Add weekend/week helpers
```

---

## Task 1: Create TimelineHeader Component

**Files:**
- Create: `app/(workspace)/projects/[key]/timeline/components/TimelineHeader.tsx`
- Test: Visual inspection in browser

- [ ] **Step 1: Create TimelineHeader.tsx**

```tsx
"use client";

import { memo } from "react";

interface TimelineHeaderProps {
  headerDates: {
    label: string;
    sublabel?: string;
    span: number;
    offset: number;
    isWeekend?: boolean;
  }[];
  columnWidth: number;
}

export const TimelineHeader = memo(function TimelineHeader({
  headerDates,
  columnWidth,
}: TimelineHeaderProps) {
  return (
    <div className="flex h-12 border-b bg-[rgb(250,250,250)]">
      {headerDates.map((h, i) => (
        <div
          key={i}
          className="border-r flex flex-col items-center justify-center"
          style={{
            width: h.span * columnWidth,
            backgroundColor: h.isWeekend ? "rgba(0,0,0,0.03)" : undefined,
          }}
        >
          {h.sublabel && (
            <span className="text-[9px] text-[#5E6C84]">
              {h.sublabel}
            </span>
          )}
          <span className="text-xs font-medium text-[#5E6C84]">
            {h.label}
          </span>
        </div>
      ))}
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/components/TimelineHeader.tsx
git commit -m "feat(timeline): add TimelineHeader component"
```

---

## Task 2: Create useTimelineOrganization Hook

**Files:**
- Create: `app/(workspace)/projects/[key]/timeline/hooks/useTimelineOrganization.ts`
- Modify: None
- Test: None (logic only)

- [ ] **Step 1: Create useTimelineOrganization.ts**

```ts
import { useMemo } from "react";
import { Card } from "@/types/board";

export type OrganizationMode = "alphabetical" | "assignee" | "label" | "chronological";

interface TimelineCard {
  card: Card;
  start: Date;
  end: Date;
}

export function useTimelineOrganization(
  cards: TimelineCard[],
  mode: OrganizationMode
) {
  return useMemo(() => {
    const sorted = [...cards];

    switch (mode) {
      case "alphabetical":
        return sorted.sort((a, b) =>
          a.card.title.localeCompare(b.card.title)
        );

      case "assignee":
        return sorted.sort((a, b) => {
          const aName = a.card.assignees[0]?.name || "zzz";
          const bName = b.card.assignees[0]?.name || "zzz";
          if (aName !== bName) return aName.localeCompare(bName);
          return a.start.getTime() - b.start.getTime();
        });

      case "label":
        return sorted.sort((a, b) => {
          const aLabel = a.card.labels[0]?.name || "zzz";
          const bLabel = b.card.labels[0]?.name || "zzz";
          if (aLabel !== bLabel) return aLabel.localeCompare(bLabel);
          return a.start.getTime() - b.start.getTime();
        });

      case "chronological":
      default:
        return sorted.sort((a, b) =>
          a.start.getTime() - b.start.getTime()
        );
    }
  }, [cards, mode]);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/hooks/useTimelineOrganization.ts
git commit -m "feat(timeline): add useTimelineOrganization hook"
```

---

## Task 3: Create TimelineRow Component

**Files:**
- Create: `app/(workspace)/projects/[key]/timeline/components/TimelineRow.tsx`
- Test: Visual inspection in browser

- [ ] **Step 1: Create TimelineRow.tsx**

```tsx
"use client";

import { memo } from "react";
import { Card } from "@/types/board";
import { TimelineBar } from "./TimelineBar";

interface TimelineRowProps {
  card: Card;
  start: Date;
  end: Date;
  rangeStart: Date;
  columnWidth: number;
  onDragMove: (cardId: string, newStart: Date, newEnd: Date) => void;
  onCardClick: (card: Card) => void;
}

export const TimelineRow = memo(function TimelineRow({
  card,
  start,
  end,
  rangeStart,
  columnWidth,
  onDragMove,
  onCardClick,
}: TimelineRowProps) {
  return (
    <div className="h-9 border-b flex items-center relative">
      {/* Left side - Task name */}
      <div className="w-[280px] shrink-0 px-3 flex items-center gap-2 border-r bg-card h-full">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${
            card.completed ? "bg-green-500" : "bg-primary"
          }`}
        />
        <span
          className={`text-sm truncate ${
            card.completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {card.title}
        </span>
      </div>

      {/* Right side - Timeline bar */}
      <div className="flex-1 relative">
        <TimelineBar
          card={card}
          barStart={start}
          barEnd={end}
          rangeStart={rangeStart}
          columnWidth={columnWidth}
          onDragMove={onDragMove}
          onClick={onCardClick}
        />
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/components/TimelineRow.tsx
git commit -m "feat(timeline): add TimelineRow component"
```

---

## Task 4: Create TimelineTodayMarker Component

**Files:**
- Create: `app/(workspace)/projects/[key]/timeline/components/TimelineTodayMarker.tsx`
- Test: Visual inspection in browser

- [ ] **Step 1: Create TimelineTodayMarker.tsx**

```tsx
"use client";

import { memo } from "react";

interface TimelineTodayMarkerProps {
  todayOffset: number;
  columnWidth: number;
}

export const TimelineTodayMarker = memo(function TimelineTodayMarker({
  todayOffset,
  columnWidth,
}: TimelineTodayMarkerProps) {
  if (todayOffset < 0) return null;

  return (
    <div
      className="absolute top-0 bottom-0 z-10 pointer-events-none"
      style={{ left: todayOffset * columnWidth }}
    >
      {/* Red line */}
      <div className="w-px bg-[#E12D0D] h-full" />

      {/* "Today" label at top */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2">
        <span className="text-[10px] font-medium text-[#E12D0D] bg-white px-1 rounded">
          Today
        </span>
      </div>

      {/* Circle at top of line */}
      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-[#E12D0D]" />
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/components/TimelineTodayMarker.tsx
git commit -m "feat(timeline): add TimelineTodayMarker component"
```

---

## Task 5: Create TimelineWeekendShading Component

**Files:**
- Create: `app/(workspace)/projects/[key]/timeline/components/TimelineWeekendShading.tsx`
- Test: Visual inspection in browser

- [ ] **Step 1: Create TimelineWeekendShading.tsx**

```tsx
"use client";

import { memo } from "react";

interface TimelineWeekendShadingProps {
  totalDays: number;
  rangeStart: Date;
  columnWidth: number;
}

export const TimelineWeekendShading = memo(function TimelineWeekendShading({
  totalDays,
  rangeStart,
  columnWidth,
}: TimelineWeekendShadingProps) {
  const weekends: { left: number; width: number }[] = [];
  let i = 0;

  while (i < totalDays) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);

    // Check if this day is Saturday (6) or Sunday (0)
    if (d.getDay() === 0 || d.getDay() === 6) {
      const start = i;
      let width = 1;

      // Find consecutive weekend days
      while (i + width < totalDays) {
        const nextD = new Date(rangeStart);
        nextD.setDate(nextD.getDate() + i + width);
        if (nextD.getDay() === 0 || nextD.getDay() === 6) {
          width++;
        } else {
          break;
        }
      }

      weekends.push({
        left: start * columnWidth,
        width: width * columnWidth,
      });
      i += width;
    } else {
      i++;
    }
  }

  return (
    <>
      {weekends.map((w, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: w.left,
            width: w.width,
            backgroundColor: "rgba(0,0,0,0.03)",
          }}
        />
      ))}
    </>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/components/TimelineWeekendShading.tsx
git commit -m "feat(timeline): add TimelineWeekendShading component"
```

---

## Task 6: Create TimelineSwimlanes Component

**Files:**
- Create: `app/(workspace)/projects/[key]/timeline/components/TimelineSwimlanes.tsx`
- Test: Visual inspection in browser

- [ ] **Step 1: Create TimelineSwimlanes.tsx**

```tsx
"use client";

import { memo } from "react";
import { Card } from "@/types/board";
import { TimelineRow } from "./TimelineRow";
import { TimelineTodayMarker } from "./TimelineTodayMarker";
import { TimelineWeekendShading } from "./TimelineWeekendShading";

interface TimelineCard {
  card: Card;
  start: Date;
  end: Date;
}

interface TimelineSwimlanesProps {
  timelineCards: TimelineCard[];
  rangeStart: Date;
  rangeEnd: Date;
  totalDays: number;
  columnWidth: number;
  todayOffset: number;
  onDragMove: (cardId: string, newStart: Date, newEnd: Date) => void;
  onCardClick: (card: Card) => void;
}

export const TimelineSwimlanes = memo(function TimelineSwimlanes({
  timelineCards,
  rangeStart,
  totalDays,
  columnWidth,
  todayOffset,
  onDragMove,
  onCardClick,
}: TimelineSwimlanesProps) {
  return (
    <div className="relative">
      {/* Weekend shading */}
      <TimelineWeekendShading
        totalDays={totalDays}
        rangeStart={rangeStart}
        columnWidth={columnWidth}
      />

      {/* Today marker */}
      <TimelineTodayMarker
        todayOffset={todayOffset}
        columnWidth={columnWidth}
      />

      {/* Grid lines */}
      {Array.from({ length: totalDays }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-r border-border/30 pointer-events-none"
          style={{ left: i * columnWidth, width: 1 }}
        />
      ))}

      {/* Task rows */}
      {timelineCards.map(({ card, start, end }) => (
        <TimelineRow
          key={card.id}
          card={card}
          start={start}
          end={end}
          rangeStart={rangeStart}
          columnWidth={columnWidth}
          onDragMove={onDragMove}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/components/TimelineSwimlanes.tsx
git commit -m "feat(timeline): add TimelineSwimlanes component"
```

---

## Task 7: Refactor TimelineBar with Jira Styling

**Files:**
- Modify: `app/(workspace)/projects/[key]/timeline/components/TimelineBar.tsx`
- Test: Visual inspection in browser

- [ ] **Step 1: Read current TimelineBar.tsx**

Read the existing file and update it with Jira styling:

```tsx
import { memo, useCallback, useRef } from 'react';
import { Card } from '@/types/board';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { pixelOffsetToDays } from '../utils/dragHelpers';

interface TimelineBarProps {
  card: Card;
  barStart: Date;
  barEnd: Date;
  rangeStart: Date;
  columnWidth: number;
  onDragMove: (cardId: string, newStart: Date, newEnd: Date) => void;
  onClick: (card: Card) => void;
}

const MIN_DURATION_DAYS = 1;
const HANDLE_WIDTH = 8;
const BAR_HEIGHT = 24;

export const TimelineBar = memo(function TimelineBar({
  card, barStart, barEnd, rangeStart, columnWidth, onDragMove, onClick,
}: TimelineBarProps) {
  const dragState = useRef<{ startX: number; origStart: Date; origEnd: Date } | null>(null);

  const startOffset = Math.round((barStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  const duration = Math.max(Math.round((barEnd.getTime() - barStart.getTime()) / (1000 * 60 * 60 * 24)) + 1, MIN_DURATION_DAYS);
  const barLeft = startOffset * columnWidth;
  const barWidth = Math.max(duration * columnWidth, 24);
  const barColor = card.labels[0]?.color || '199 89% 48%';

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, origStart: new Date(barStart), origEnd: new Date(barEnd) };
  }, [barStart, barEnd]);

  const handlePointerMove = useCallback((e: React.PointerEvent, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    if (!dragState.current) return;

    const { startX, origStart, origEnd } = dragState.current;
    const deltaPx = e.clientX - startX;
    const deltaDays = pixelOffsetToDays(deltaPx, columnWidth);

    let newStart: Date;
    let newEnd: Date;

    if (mode === 'move') {
      newStart = new Date(origStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      newEnd = new Date(origEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    } else if (mode === 'resize-start') {
      newStart = new Date(origStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      newEnd = new Date(origEnd);
      const dur = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dur < MIN_DURATION_DAYS) {
        newStart = new Date(newEnd.getTime() - MIN_DURATION_DAYS * 24 * 60 * 60 * 1000);
      }
    } else {
      newStart = new Date(origStart);
      newEnd = new Date(origEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      const dur = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dur < MIN_DURATION_DAYS) {
        newEnd = new Date(newStart.getTime() + MIN_DURATION_DAYS * 24 * 60 * 60 * 1000);
      }
    }

    onDragMove(card.id, newStart, newEnd);
  }, [columnWidth, card.id, onDragMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    dragState.current = null;
  }, []);

  return (
    <div
      className="absolute top-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity flex items-center shadow-sm group/bar"
      style={{
        left: barLeft,
        width: barWidth,
        height: BAR_HEIGHT,
        backgroundColor: `hsl(${barColor})`,
        borderRadius: '4px',
      }}
      onClick={() => onClick(card)}
      title={card.title}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 cursor-ew-resize rounded-l hover:bg-white/20 transition-colors z-10"
        style={{ width: HANDLE_WIDTH }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-start')}
        onPointerMove={(e) => handlePointerMove(e, 'resize-start')}
        onPointerUp={(e) => handlePointerUp(e, 'resize-start')}
      />

      {/* Main draggable area */}
      <div
        className="flex items-center px-2 gap-1.5 w-full h-full"
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={(e) => handlePointerMove(e, 'move')}
        onPointerUp={(e) => handlePointerUp(e, 'move')}
      >
        <span className="text-[11px] font-medium text-white truncate pointer-events-none">
          {card.title}
        </span>
        {card.assignees.length > 0 && (
          <Avatar className="h-5 w-5 shrink-0 border-2 border-white pointer-events-none">
            <AvatarFallback
              className="text-[8px] text-white"
              style={{ backgroundColor: `hsl(${card.assignees[0].color})` }}
            >
              {card.assignees[0].name[0]}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 cursor-ew-resize rounded-r hover:bg-white/20 transition-colors z-10"
        style={{ width: HANDLE_WIDTH }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-end')}
        onPointerMove={(e) => handlePointerMove(e, 'resize-end')}
        onPointerUp={(e) => handlePointerUp(e, 'resize-end')}
      />
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/components/TimelineBar.tsx
git commit -m "refactor(timeline): apply Jira-style styling to TimelineBar"
```

---

## Task 8: Update dateUtils.ts with Weekend Helpers

**Files:**
- Modify: `app/(workspace)/projects/[key]/timeline/utils/dateUtils.ts`
- Test: None (logic only)

- [ ] **Step 1: Update dateUtils.ts**

Add the `isWeekend` function and update `toIsoString` to accept Date:

```ts
export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function formatDateShort(date: Date) {
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function clampDate(date: Date, min: Date, max: Date) {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return new Date(date);
}

export function toIsoString(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/utils/dateUtils.ts
git commit -m "feat(timeline): add weekend and week number helpers to dateUtils"
```

---

## Task 9: Refactor Main TimelineView with All Components

**Files:**
- Modify: `app/(workspace)/projects/[key]/timeline/index.tsx`
- Test: Visual inspection in browser

- [ ] **Step 1: Refactor TimelineView**

Replace the entire file with the new implementation:

```tsx
"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/types/board";
import { TimelineHeader } from "./components/TimelineHeader";
import { TimelineSwimlanes } from "./components/TimelineSwimlanes";
import { UndatedCardDraggable } from "./components/UndatedCardDraggable";
import { useTimelineOrganization, OrganizationMode } from "./hooks/useTimelineOrganization";
import {
  addDays,
  daysBetween,
  formatDateShort,
  toIsoString,
  isWeekend,
} from "./utils/dateUtils";

interface TimelineViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  onUpdateCard: (card: Card) => void;
}

type ZoomLevel = "days" | "weeks" | "months";

interface DragState {
  card: Card;
  startX: number;
  startY: number;
  active: boolean;
}

const COLUMN_WIDTHS = {
  days: 32,
  weeks: 16,
  months: 8,
};

export function TimelineView({
  cards,
  onCardClick,
  onUpdateCard,
}: TimelineViewProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("weeks");
  const [organizationMode, setOrganizationMode] = useState<OrganizationMode>("chronological");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Cards with dates
  const timelineCards = useMemo(() => {
    return cards
      .filter((c) => c.dueDate)
      .map((c) => {
        const end = new Date(c.dueDate!);
        const start = c.startDate ? new Date(c.startDate) : addDays(end, -3);
        return { card: c, start, end };
      });
  }, [cards]);

  const cardsWithoutDates = cards.filter((c) => !c.dueDate);

  // Apply organization mode
  const organizedCards = useTimelineOrganization(timelineCards, organizationMode);

  // Timeline range
  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (organizedCards.length === 0) {
      const today = new Date();
      const s = addDays(today, -7);
      const e = addDays(today, 21);
      return { rangeStart: s, rangeEnd: e, totalDays: 28 };
    }
    const allStarts = organizedCards.map((c) => c.start.getTime());
    const allEnds = organizedCards.map((c) => c.end.getTime());
    const minDate = new Date(Math.min(...allStarts));
    const maxDate = new Date(Math.max(...allEnds));
    const s = addDays(minDate, -5);
    const e = addDays(maxDate, 7);
    return {
      rangeStart: s,
      rangeEnd: e,
      totalDays: Math.max(daysBetween(s, e), 14),
    };
  }, [organizedCards]);

  const columnWidth = COLUMN_WIDTHS[zoom];
  const rowHeight = 36;
  const headerHeight = 48;
  const today = new Date();
  const todayOffset = daysBetween(rangeStart, today);

  // Header dates with weekend info
  const headerDates = useMemo(() => {
    const dates: {
      label: string;
      sublabel?: string;
      span: number;
      offset: number;
      isWeekend?: boolean;
    }[] = [];

    if (zoom === "days") {
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(rangeStart, i);
        dates.push({
          label: String(d.getDate()),
          sublabel:
            i === 0 || d.getDate() === 1
              ? d.toLocaleDateString("en", { month: "short" })
              : undefined,
          span: 1,
          offset: i,
          isWeekend: isWeekend(d),
        });
      }
    } else if (zoom === "weeks") {
      let i = 0;
      while (i < totalDays) {
        const d = addDays(rangeStart, i);
        const weekEnd = Math.min(i + (6 - d.getDay()), totalDays - 1);
        const span = weekEnd - i + 1;
        dates.push({ label: formatDateShort(d), span, offset: i });
        i = weekEnd + 1;
      }
    } else {
      let i = 0;
      while (i < totalDays) {
        const d = addDays(rangeStart, i);
        const daysInMonth = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
        ).getDate();
        const remaining = daysInMonth - d.getDate() + 1;
        const span = Math.min(remaining, totalDays - i);
        dates.push({
          label: d.toLocaleDateString("en", { month: "short", year: "numeric" }),
          span,
          offset: i,
        });
        i += span;
      }
    }
    return dates;
  }, [rangeStart, totalDays, zoom]);

  const totalWidth = totalDays * columnWidth;

  // Bar drag move
  const handleBarDragMove = useCallback(
    (cardId: string, newStart: Date, newEnd: Date) => {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        onUpdateCard({
          ...card,
          startDate: toIsoString(newStart),
          dueDate: toIsoString(newEnd),
        });
      }
    },
    [cards, onUpdateCard],
  );

  // Undated card drag start
  const handleUndatedDragStart = useCallback(
    (card: Card, startX: number, startY: number) => {
      setDragState({ card, startX, startY, active: true });
      setGhostPos({ x: startX, y: startY });
    },
    [],
  );

  // Synchronized horizontal scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }, []);

  // Global pointer move for ghost
  useEffect(() => {
    if (!dragState || !dragState.active) return;

    const handleMove = (e: PointerEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
    };

    const handleUp = (e: PointerEvent) => {
      if (!dragState) return;

      const container = timelineScrollRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const dropX = e.clientX - rect.left + container.scrollLeft;
        const dropDay = Math.round(dropX / columnWidth);
        const targetDate = addDays(rangeStart, dropDay);

        onUpdateCard({
          ...dragState.card,
          startDate: toIsoString(targetDate),
          dueDate: toIsoString(addDays(targetDate, 3)),
        });
      }

      setDragState(null);
      setGhostPos(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragState, rangeStart, columnWidth, onUpdateCard]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">No cards to display</p>
      </div>
    );
  }

  const totalRows =
    organizedCards.length +
    (cardsWithoutDates.length > 0 ? 1 + cardsWithoutDates.length : 0);
  const contentHeight = totalRows * rowHeight + headerHeight;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3">
        {/* Zoom controls */}
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 rounded-none rounded-l-md text-xs ${zoom === "days" ? "bg-muted" : ""}`}
            onClick={() => setZoom("days")}
          >
            Days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 rounded-none text-xs border-x ${zoom === "weeks" ? "bg-muted" : ""}`}
            onClick={() => setZoom("weeks")}
          >
            Weeks
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 rounded-none rounded-r-md text-xs ${zoom === "months" ? "bg-muted" : ""}`}
            onClick={() => setZoom("months")}
          >
            Months
          </Button>
        </div>

        {/* Organization mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Group by:</span>
          <Select value={organizationMode} onValueChange={(v) => setOrganizationMode(v as OrganizationMode)}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chronological">Chronological</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="assignee">By Assignee</SelectItem>
              <SelectItem value="label">By Label</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {cardsWithoutDates.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            Drag undated cards onto the timeline to assign dates
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden border rounded-lg bg-card">
        <div className="flex h-full">
          {/* Left panel: card names */}
          <div
            className="shrink-0 w-[280px] border-r bg-muted/30 z-10"
            style={{ height: contentHeight }}
            ref={leftPanelRef}
          >
            {/* Header */}
            <div className="h-12 border-b px-3 flex items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Task
              </span>
            </div>

            {/* Card rows */}
            {organizedCards.map(({ card }) => (
              <div
                key={card.id}
                className="h-9 border-b px-3 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onCardClick(card)}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${card.completed ? "bg-green-500" : "bg-primary"}`}
                />
                <span
                  className={`text-sm truncate ${card.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {card.title}
                </span>
              </div>
            ))}

            {/* Undated cards section */}
            {cardsWithoutDates.length > 0 && (
              <>
                <div className="h-8 px-3 flex items-center border-b bg-muted/20">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    No date
                  </span>
                </div>
                {cardsWithoutDates.map((card) => (
                  <UndatedCardDraggable
                    key={card.id}
                    card={card}
                    onDragStart={handleUndatedDragStart}
                    onCardClick={onCardClick}
                  />
                ))}
              </>
            )}
          </div>

          {/* Right panel: Timeline bars */}
          <div
            className="flex-1 overflow-auto"
            ref={timelineScrollRef}
            onScroll={handleScroll}
          >
            <div style={{ width: totalWidth, minWidth: "100%" }}>
              {/* Header */}
              <TimelineHeader headerDates={headerDates} columnWidth={columnWidth} />

              {/* Swimlanes */}
              <TimelineSwimlanes
                timelineCards={organizedCards}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                totalDays={totalDays}
                columnWidth={columnWidth}
                todayOffset={todayOffset}
                onDragMove={handleBarDragMove}
                onCardClick={onCardClick}
              />

              {/* Undated rows placeholder */}
              {cardsWithoutDates.length > 0 && (
                <div className="h-8 border-b bg-muted/10" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ghost card for undated drag */}
      {dragState?.active && ghostPos && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg border bg-card p-2 shadow-lg opacity-80"
          style={{
            left: ghostPos.x + 10,
            top: ghostPos.y - 15,
            width: 200,
          }}
        >
          <p className="text-sm font-medium truncate">{dragState.card.title}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(workspace)/projects/[key]/timeline/index.tsx
git commit -m "refactor(timeline): rewrite main TimelineView with Jira-style components"
```

---

## Task 10: Final Verification

**Files:**
- Test: All timeline files
- Verify: All acceptance criteria from spec

- [ ] **Step 1: Run development server**

```bash
cd C:\Users\Cankkun\projects\web\zenarc
pnpm dev
```

- [ ] **Step 2: Verify in browser**

Navigate to a project with timeline view and check:
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

- [ ] **Step 3: Commit any fixes**

```bash
git add .
git commit -m "fix(timeline): address verification findings"
```

---

## Plan Complete

**Summary:** This plan refactors the timeline view into Jira-style components:
1. TimelineHeader - Date headers with weekend shading
2. useTimelineOrganization - Hook for organization modes
3. TimelineRow - Individual swimlane rows
4. TimelineTodayMarker - Red "Today" line
5. TimelineWeekendShading - Weekend background shading
6. TimelineSwimlanes - Container for all rows
7. TimelineBar - Updated with Jira styling
8. dateUtils - Added weekend helpers
9. TimelineView - Main component rewritten with all pieces

Each task produces working code that can be committed independently.
