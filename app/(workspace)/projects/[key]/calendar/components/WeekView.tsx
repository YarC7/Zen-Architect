"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { Card } from "@/types/board";
import { dateKey } from "../utils/calendarUtils";

interface WeekViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  onUpdateCard: (card: Card) => void;
  currentDate: Date;
  showWeekends: boolean;
}

export function WeekView({
  cards,
  onCardClick,
  onUpdateCard,
  currentDate,
  showWeekends,
}: WeekViewProps) {
  const today = new Date();
  const todayKey = dateKey(today);

  const gridCols = showWeekends ? 7 : 5;

  const colIndex = (di: number) => {
    if (showWeekends) return di;
    if (di === 0 || di === 6) return -1;
    return di - 1;
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - d.getDay() + i);
      return d;
    });
  }, [currentDate]);

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
    const dur =
      card.startDate && card.dueDate
        ? Math.round(
            (new Date(card.dueDate.split("T")[0]).getTime() -
              new Date(card.startDate.split("T")[0]).getTime()) /
              (1000 * 60 * 60 * 24),
          )
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

  const handleDragEnd = useCallback(
    (e: React.PointerEvent) => {
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
    },
    [cards, onCardClick, onUpdateCard],
  );

  // Separate cards
  const { spanning, singleDay } = useMemo(() => {
    const spanning: Card[] = [];
    const singleDay: Card[] = [];
    const weekStartKey = dateKey(weekDays[0]);
    const weekEndKey = dateKey(weekDays[6]);

    cards.forEach((card) => {
      if (!card.dueDate) return;
      const cardEndKey = card.dueDate.split("T")[0];
      const cardStartKey = card.startDate
        ? card.startDate.split("T")[0]
        : cardEndKey;
      const cardEnd = new Date(cardEndKey);
      const cardStart = new Date(cardStartKey);
      const dur = Math.round(
        (cardEnd.getTime() - cardStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (cardEndKey < weekStartKey || cardStartKey > weekEndKey) return;

      if (dur > 0) {
        spanning.push(card);
      } else {
        singleDay.push(card);
      }
    });

    return { spanning, singleDay };
  }, [cards, weekDays]);

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Weekday headers */}
      <div
        className="grid border-b bg-muted/30"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
      >
        {weekDays.map((d, i) => {
          const ci = colIndex(i);
          if (ci < 0) return null;
          const dk = dateKey(d);
          const isToday = dk === todayKey;
          return (
            <div key={i} className="py-2 text-center">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {d.toLocaleDateString("en", { weekday: "short" })}
              </div>
              <div
                className={`text-sm font-medium mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-foreground"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week grid - 2 rows: spanning cards top, day cells bottom */}
      <div
        className="flex-1 grid overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: "auto 1fr",
        }}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        {/* Row 1: Spanning cards */}
        {spanning.map((card) => {
          const startStr = card.startDate!.split("T")[0];
          const endStr = card.dueDate!.split("T")[0];

          let startCol = -1;
          let endCol = -1;

          for (let i = 0; i < 7; i++) {
            const ci = colIndex(i);
            if (ci < 0) continue;
            const dayKey = dateKey(weekDays[i]);
            if (dayKey >= startStr && startCol === -1) {
              startCol = ci + 1;
            }
            if (dayKey <= endStr) {
              endCol = Math.max(endCol, ci + 1);
            }
          }

          if (startCol === -1 || endCol === -1 || endCol < startCol)
            return null;

          const actualStartIdx = showWeekends ? startCol - 1 : startCol;
          const actualEndIdx = showWeekends ? endCol - 1 : endCol;
          const isActualStart = startStr === dateKey(weekDays[actualStartIdx]);
          const isActualEnd = endStr === dateKey(weekDays[actualEndIdx]);

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
                onDragStart={handleDragStart}
                onCardClick={onCardClick}
              />
            </div>
          );
        })}

        {/* Row 2: Day cells */}
        {weekDays.map((d, i) => {
          const ci = colIndex(i);
          if (ci < 0) return null;
          const dk = dateKey(d);
          const isToday = dk === todayKey;
          const isDropTarget = dk === dropTarget;
          const dayCards = singleDayByDate.get(dk) || [];

          return (
            <div
              key={i}
              data-date-key={dk}
              className={`relative border-r last:border-r-0 p-1.5 min-h-[200px] transition-colors ${
                isToday ? "bg-primary/5" : "bg-card"
              } ${isDropTarget ? "ring-2 ring-primary ring-inset" : ""}`}
              style={{ gridColumn: `${ci + 1}`, gridRow: "2" }}
            >
              {/* Single-day cards */}
              <div className="space-y-1">
                {dayCards.map((card) => (
                  <DayCard
                    key={card.id}
                    card={card}
                    isDragging={draggingId === card.id}
                    onDragStart={handleDragStart}
                    onCardClick={onCardClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
        isDragging
          ? "opacity-40 scale-[0.98]"
          : "cursor-grab active:cursor-grabbing"
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
            isCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
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
        isDragging
          ? "opacity-40 scale-[0.98]"
          : "cursor-grab active:cursor-grabbing"
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
            isCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {card.title}
        </span>
      </div>
    </div>
  );
}
