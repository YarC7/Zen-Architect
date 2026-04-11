"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { Card } from "@/types/board";
import { getCalendarDays, dateKey, getWeekDays } from "../utils/calendarUtils";

interface MonthViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  onUpdateCard: (card: Card) => void;
  currentDate: Date;
  showWeekends: boolean;
}

export function MonthView({
  cards,
  onCardClick,
  onUpdateCard,
  currentDate,
  showWeekends,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = getCalendarDays(year, month);
  const today = new Date();
  const todayKey = dateKey(today);

  const gridCols = showWeekends ? 7 : 5;

  // Map day index (0-6, Sun-Sat) to visible grid column (1-based), or -1 if hidden
  const gridColumn = (di: number) => {
    if (showWeekends) return di + 1;
    if (di === 0 || di === 6) return -1;
    return di;
  };

  // Drag state
  const dragRef = useRef<{
    cardId: string;
    startX: number;
    origStart: string | null;
    origEnd: string | null;
    duration: number;
    moved: boolean;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.PointerEvent, card: Card) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const dur = card.startDate && card.dueDate
      ? Math.round((new Date(card.dueDate.split("T")[0]).getTime() - new Date(card.startDate.split("T")[0]).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    dragRef.current = {
      cardId: card.id,
      startX: e.clientX,
      origStart: card.startDate,
      origEnd: card.dueDate,
      duration: dur,
      moved: false,
    };
    setDraggingId(card.id);
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = Math.abs(e.clientX - dragRef.current.startX);
    if (dx < 5) return;
    dragRef.current.moved = true;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest("[data-date-key]") as HTMLElement | null;
    setDropTarget(cell?.dataset.dateKey || null);
  }, []);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { cardId, origStart, origEnd, duration, moved } = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    setDropTarget(null);

    if (!moved) {
      const card = cards.find((c) => c.id === cardId);
      if (card) onCardClick(card);
      return;
    }

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest("[data-date-key]") as HTMLElement | null;
    const targetKey = cell?.dataset.dateKey;

    if (targetKey && origEnd) {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const newEnd = new Date(targetKey);
      const newStart = new Date(targetKey);
      newStart.setDate(newStart.getDate() - duration);

      onUpdateCard({
        ...card,
        startDate: duration > 0 ? newStart.toISOString().split("T")[0] : null,
        dueDate: newEnd.toISOString().split("T")[0],
      });
    }
  }, [cards, onCardClick, onUpdateCard]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Weekday headers */}
      <div
        className="grid border-b bg-muted/30"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
      >
        {getWeekDays().map((d, i) => {
          if (!showWeekends && (i === 0 || i === 6)) return null;
          return (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              {d}
            </div>
          );
        })}
      </div>

      {/* Weeks */}
      <div
        className="flex-1 grid grid-rows-[repeat(auto-fill,1fr)] overflow-y-auto"
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        {weeks.map((week, wi) => (
          <WeekRow
            key={wi}
            week={week}
            cards={cards}
            todayKey={todayKey}
            dropTarget={dropTarget}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onCardClick={onCardClick}
            gridCols={gridCols}
            gridColumn={gridColumn}
            showWeekends={showWeekends}
          />
        ))}
      </div>
    </div>
  );
}

function WeekRow({
  week,
  cards,
  todayKey,
  dropTarget,
  draggingId,
  onDragStart,
  onCardClick,
  gridCols,
  gridColumn,
  showWeekends,
}: {
  week: { day: number; date: Date; isOtherMonth: boolean }[];
  cards: Card[];
  todayKey: string;
  dropTarget: string | null;
  draggingId: string | null;
  onDragStart: (e: React.PointerEvent, card: Card) => void;
  onCardClick: (card: Card) => void;
  gridCols: number;
  gridColumn: (di: number) => number;
  showWeekends: boolean;
}) {
  const weekStart = week[0]?.date;
  const weekEnd = week[6]?.date;

  // Separate cards into: multi-day spanning cards vs single-day cards
  const { spanning, singleDay } = useMemo(() => {
    const spanning: Card[] = [];
    const singleDay: Card[] = [];

    cards.forEach((card) => {
      if (!card.dueDate) return;
      const cardEnd = new Date(card.dueDate.split("T")[0]);
      const cardStart = card.startDate
        ? new Date(card.startDate.split("T")[0])
        : cardEnd;
      const dur = Math.round((cardEnd.getTime() - cardStart.getTime()) / (1000 * 60 * 60 * 24));

      // Only show cards that overlap this week
      if (cardEnd < weekStart || cardStart > weekEnd) return;

      if (dur > 0) {
        spanning.push(card);
      } else {
        singleDay.push(card);
      }
    });

    return { spanning, singleDay };
  }, [cards, weekStart, weekEnd]);

  // Group single-day cards by their date
  const singleDayByDate = useMemo(() => {
    const map = new Map<string, Card[]>();
    singleDay.forEach((card) => {
      const dk = card.dueDate!.split("T")[0];
      if (!map.has(dk)) map.set(dk, []);
      map.get(dk)!.push(card);
    });
    return map;
  }, [singleDay]);

  return (
    <div
      className="grid border-b min-h-[168px]"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: "auto 1fr",
      }}
    >
      {/* Row 1: Spanning cards across the top */}
      {spanning.map((card) => {
        const startStr = card.startDate!.split("T")[0];
        const endStr = card.dueDate!.split("T")[0];

        // Find visible start and end grid columns using string comparison
        let startCol = -1;
        let endCol = -1;

        for (let i = 0; i < 7; i++) {
          const ci = gridColumn(i);
          if (ci < 0) continue;
          const dayKey = dateKey(week[i].date);
          if (dayKey >= startStr && startCol === -1) {
            startCol = ci;
          }
          if (dayKey <= endStr) {
            endCol = Math.max(endCol, ci);
          }
        }

        if (startCol === -1 || endCol === -1 || endCol < startCol) return null;

        const actualStartIdx = showWeekends ? startCol - 1 : startCol;
        const actualEndIdx = showWeekends ? endCol - 1 : endCol;
        const isActualStart = startStr === dateKey(week[actualStartIdx]?.date || week[0].date);
        const isActualEnd = endStr === dateKey(week[actualEndIdx]?.date || week[6].date);

        return (
          <div
            key={card.id}
            className="pointer-events-auto px-1"
            style={{
              gridColumn: `${startCol} / ${endCol + 1}`,
              gridRow: "1",
            }}
          >
            <SpanningCard
              card={card}
              isDragging={draggingId === card.id}
              isStart={isActualStart}
              isEnd={isActualEnd}
              onDragStart={onDragStart}
              onCardClick={onCardClick}
            />
          </div>
        );
      })}

      {/* Row 2: Day cells with numbers and single-day cards */}
      {week.map((dayInfo, di) => {
        const ci = gridColumn(di);
        if (ci < 0) return null;

        const dk = dateKey(dayInfo.date);
        const isToday = dk === todayKey;
        const isDropTarget = dk === dropTarget;
        const dayCards = singleDayByDate.get(dk) || [];

        return (
          <div
            key={di}
            data-date-key={dk}
            className={`relative border-r last:border-r-0 p-1.5 transition-colors ${
              dayInfo.isOtherMonth
                ? "bg-muted/10"
                : isToday
                  ? "bg-primary/5"
                  : "bg-card"
            } ${isDropTarget ? "ring-2 ring-primary ring-inset" : ""}`}
            style={{ gridColumn: `${ci}`, gridRow: "2" }}
          >
            {/* Day number */}
            <div
              className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                isToday
                  ? "bg-primary text-primary-foreground font-bold"
                  : dayInfo.isOtherMonth
                    ? "text-muted-foreground/40"
                    : "text-foreground"
              }`}
            >
              {dayInfo.day}
            </div>

            {/* Single-day cards */}
            <div className="space-y-1">
              {dayCards.map((card) => (
                <DayCard
                  key={card.id}
                  card={card}
                  isDragging={draggingId === card.id}
                  onDragStart={onDragStart}
                  onCardClick={onCardClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpanningCard({
  card,
  isDragging,
  isStart,
  isEnd,
  onDragStart,
  onCardClick,
}: {
  card: Card;
  isDragging: boolean;
  isStart: boolean;
  isEnd: boolean;
  onDragStart: (e: React.PointerEvent, card: Card) => void;
  onCardClick: (card: Card) => void;
}) {
  const barColor = card.labels[0]?.color || "199 89% 48%";
  const isCompleted = card.completed;

  return (
    <div
      className={`flex flex-col rounded-md border bg-card/95 hover:shadow-md transition-all select-none ${
        !isStart ? "rounded-l-none border-l-0" : ""
      } ${!isEnd ? "rounded-r-none border-r-0" : ""} ${
        isDragging ? "opacity-40 scale-[0.98]" : "cursor-grab active:cursor-grabbing"
      }`}
      onPointerDown={(e) => onDragStart(e, card)}
      onClick={() => onCardClick(card)}
    >
      <div
        className="h-1.5 shrink-0"
        style={{
          backgroundColor: `hsl(${barColor})`,
          borderTopLeftRadius: isStart ? "var(--radius-md)" : 0,
          borderTopRightRadius: isEnd ? "var(--radius-md)" : 0,
        }}
      />
      <div className="px-2 py-1">
        <span
          className={`text-xs leading-snug truncate block ${
            isCompleted ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {card.title}
        </span>
      </div>
    </div>
  );
}

function DayCard({
  card,
  isDragging,
  onDragStart,
  onCardClick,
}: {
  card: Card;
  isDragging: boolean;
  onDragStart: (e: React.PointerEvent, card: Card) => void;
  onCardClick: (card: Card) => void;
}) {
  const barColor = card.labels[0]?.color || "199 89% 48%";
  const isCompleted = card.completed;

  return (
    <div
      className={`flex flex-col rounded-md border bg-card hover:shadow-md transition-all select-none ${
        isDragging ? "opacity-40 scale-[0.98]" : "cursor-grab active:cursor-grabbing"
      }`}
      onPointerDown={(e) => onDragStart(e, card)}
      onClick={() => onCardClick(card)}
    >
      <div
        className="h-1.5 rounded-t-md shrink-0"
        style={{ backgroundColor: `hsl(${barColor})` }}
      />
      <div className="px-2 py-1">
        <span
          className={`text-xs leading-snug truncate block ${
            isCompleted ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {card.title}
        </span>
      </div>
    </div>
  );
}
