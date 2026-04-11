"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Card } from "@/types/board";
import { TimelineBar } from "./components/TimelineBar";
import { UndatedCardDraggable } from "./components/UndatedCardDraggable";
import {
  addDays,
  daysBetween,
  startOfWeek,
  formatDateShort,
  toIsoString,
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

export function TimelineView({
  cards,
  onCardClick,
  onUpdateCard,
}: TimelineViewProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("weeks");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Cards with dates
  const timelineCards = useMemo(() => {
    return cards
      .filter((c) => c.dueDate)
      .map((c) => {
        const end = new Date(c.dueDate!);
        const start = c.startDate ? new Date(c.startDate) : addDays(end, -3);
        return { card: c, start, end };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [cards]);

  const cardsWithoutDates = cards.filter((c) => !c.dueDate);

  // Timeline range
  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (timelineCards.length === 0) {
      const today = new Date();
      const s = addDays(today, -7);
      const e = addDays(today, 21);
      return { rangeStart: s, rangeEnd: e, totalDays: 28 };
    }
    const allStarts = timelineCards.map((c) => c.start.getTime());
    const allEnds = timelineCards.map((c) => c.end.getTime());
    const minDate = new Date(Math.min(...allStarts));
    const maxDate = new Date(Math.max(...allEnds));
    const s = addDays(minDate, -5);
    const e = addDays(maxDate, 7);
    return {
      rangeStart: s,
      rangeEnd: e,
      totalDays: Math.max(daysBetween(s, e), 14),
    };
  }, [timelineCards]);

  const columnWidth = zoom === "days" ? 40 : zoom === "weeks" ? 20 : 8;
  const headerHeight = 52;
  const rowHeight = 44;
  const today = new Date();
  const todayOffset = daysBetween(rangeStart, today);

  // Header dates
  const headerDates = useMemo(() => {
    const dates: {
      label: string;
      sublabel?: string;
      span: number;
      offset: number;
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

  // Global pointer move for ghost
  useEffect(() => {
    if (!dragState || !dragState.active) return;

    const handleMove = (e: PointerEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
    };

    const handleUp = (e: PointerEvent) => {
      if (!dragState) return;

      // Get the drop position relative to the scrollable timeline
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

  // Track scroll position for ghost positioning
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">No cards to display</p>
      </div>
    );
  }

  const totalRows =
    timelineCards.length +
    (cardsWithoutDates.length > 0 ? 1 + cardsWithoutDates.length : 0);
  const contentHeight = totalRows * rowHeight + headerHeight;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
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
        {cardsWithoutDates.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Drag undated cards onto the timeline to assign dates
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        <div className="flex">
          {/* Left panel: card names */}
          <div
            className="shrink-0 w-56 border-r bg-muted/30 z-10 sticky left-0"
            style={{ height: contentHeight }}
          >
            <div
              className="h-[52px] border-b px-3 flex items-center"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Task
              </span>
            </div>
            {timelineCards.map(({ card }) => (
              <div
                key={card.id}
                className="h-[44px] border-b px-3 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
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
            {cardsWithoutDates.length > 0 && (
              <>
                <div className="h-[32px] px-3 flex items-center border-b bg-muted/20">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    No date
                  </span>
                </div>
                {cardsWithoutDates.map((card, i) => (
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

          {/* Right panel: Gantt bars */}
          <div
            className="flex-1 overflow-x-auto"
            ref={timelineScrollRef}
            onScroll={handleScroll}
          >
            <div style={{ width: totalWidth, minWidth: "100%" }}>
              {/* Header */}
              <div className="flex h-[52px] border-b bg-muted/20">
                {headerDates.map((h, i) => (
                  <div
                    key={i}
                    className="border-r flex flex-col items-center justify-center"
                    style={{ width: h.span * columnWidth }}
                  >
                    {h.sublabel && (
                      <span className="text-[9px] text-muted-foreground">
                        {h.sublabel}
                      </span>
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                      {h.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Drop highlight overlay */}
              {dragState?.active && ghostPos && (
                <div
                  className="absolute top-[52px] bottom-0 bg-primary/10 border-t-2 border-primary z-20 pointer-events-none transition-all duration-75"
                  style={{
                    left: 0,
                    right: 0,
                    top: 52,
                  }}
                />
              )}

              {/* Rows */}
              <div className="relative" style={{ minHeight: contentHeight - headerHeight }}>
                {/* Today marker */}
                {todayOffset >= 0 && todayOffset <= totalDays && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-destructive/60 z-10 pointer-events-none"
                    style={{ left: todayOffset * columnWidth }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-destructive" />
                  </div>
                )}

                {/* Grid lines */}
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-r border-border/30 pointer-events-none"
                    style={{ left: i * columnWidth, width: 1 }}
                  />
                ))}

                {/* Card bars */}
                {timelineCards.map(({ card, start, end }) => (
                  <div key={card.id} className="h-[44px] border-b relative">
                    <TimelineBar
                      card={card}
                      barStart={start}
                      barEnd={end}
                      rangeStart={rangeStart}
                      columnWidth={columnWidth}
                      onDragMove={handleBarDragMove}
                      onClick={onCardClick}
                    />
                  </div>
                ))}

                {/* No-date rows */}
                {cardsWithoutDates.length > 0 && (
                  <>
                    <div className="h-[32px] border-b bg-muted/10" />
                    {cardsWithoutDates.map((card) => (
                      <div key={card.id} className="h-[44px] border-b" />
                    ))}
                  </>
                )}
              </div>
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
