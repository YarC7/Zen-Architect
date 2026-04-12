"use client";

import { useCallback, useMemo } from "react";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import {
  DragDropManager,
  PointerSensor,
  PointerActivationConstraints,
} from "@dnd-kit/dom";
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

  const weekKey = dateKey(weekDays[0]);

  const manager = useMemo(
    () =>
      new DragDropManager({
        sensors: [
          PointerSensor.configure({
            activationConstraints: [
              new PointerActivationConstraints.Distance({ value: 8 }),
            ],
          }),
        ],
      }),
    [],
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { canceled, source, target } = event.operation;
      if (canceled || !source || !target) return;
      if (source.data?.type !== "calendar-card") return;

      const targetDateKey = target.data?.dateKey as string | undefined;
      if (!targetDateKey) return;

      const card = cards.find((c) => c.id === source.data?.cardId);
      if (!card) return;

      const origStart = source.data?.startDate as string | null;
      const origEnd = source.data?.dueDate as string | null;
      if (!origEnd) return;

      const duration = origStart
        ? Math.round(
            (new Date(origEnd.split("T")[0]).getTime() -
              new Date(origStart.split("T")[0]).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      const newStart = new Date(targetDateKey);
      const newEnd = new Date(targetDateKey);
      newEnd.setDate(newEnd.getDate() + duration);

      onUpdateCard({
        ...card,
        startDate: duration > 0 ? newStart.toISOString().split("T")[0] : null,
        dueDate: newEnd.toISOString().split("T")[0],
      });
    },
    [cards, onUpdateCard],
  );

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
    <DragDropProvider manager={manager} onDragEnd={handleDragEnd}>
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

        {/* Week grid */}
        <div
          className="flex-1 grid overflow-y-auto"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: "auto 1fr",
          }}
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
            const isActualStart =
              startStr === dateKey(weekDays[actualStartIdx]);
            const isActualEnd = endStr === dateKey(weekDays[actualEndIdx]);

            return (
              <DraggableSpanningCard
                key={`${card.id}-${weekKey}`}
                card={card}
                isStart={isActualStart}
                isEnd={isActualEnd}
                weekKey={weekKey}
                onCardClick={onCardClick}
                style={{
                  gridColumn: `${startCol} / ${endCol + 1}`,
                  gridRow: "1",
                }}
              />
            );
          })}

          {/* Row 2: Day cells */}
          {weekDays.map((d, i) => {
            const ci = colIndex(i);
            if (ci < 0) return null;
            const dk = dateKey(d);
            const isToday = dk === todayKey;
            const dayCards = singleDayByDate.get(dk) || [];

            return (
              <DroppableDayCell
                key={i}
                dateKey={dk}
                isToday={isToday}
                cards={dayCards}
                onCardClick={onCardClick}
                gridColumn={ci + 1}
              />
            );
          })}
        </div>
      </div>
    </DragDropProvider>
  );
}

function DraggableSpanningCard({
  card,
  isStart,
  isEnd,
  weekKey,
  onCardClick,
  style,
}: {
  card: Card;
  isStart: boolean;
  isEnd: boolean;
  weekKey: string;
  onCardClick: (card: Card) => void;
  style?: React.CSSProperties;
}) {
  const barColor = card.labels[0]?.color || "199 89% 48%";
  const isCompleted = card.completed;

  const segmentId = `seg-${card.id}-${weekKey}`;

  const { ref, handleRef, isDragSource } = useDraggable({
    id: segmentId,
    data: {
      cardId: card.id,
      startDate: card.startDate,
      dueDate: card.dueDate,
      type: "calendar-card",
    },
  });

  return (
    <div
      ref={(el) => {
        ref(el);
        handleRef(el);
      }}
      style={{ ...style, zIndex: 10, position: "relative" }}
      className={`w-full min-w-0 overflow-hidden flex flex-col rounded-md border bg-card/95 hover:shadow-md transition-all select-none pointer-events-auto ${
        !isStart ? "rounded-l-none border-l-0" : ""
      } ${!isEnd ? "rounded-r-none border-r-0" : ""} cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation();
        onCardClick(card);
      }}
    >
      <div
        className="h-1.5 w-8 rounded-full mt-1 ml-1"
        style={{
          backgroundColor: `hsl(${barColor})`,
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

function DroppableDayCell({
  dateKey: dk,
  isToday,
  cards,
  onCardClick,
  gridColumn,
}: {
  dateKey: string;
  isToday: boolean;
  cards: Card[];
  onCardClick: (card: Card) => void;
  gridColumn: number;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `day-${dk}`,
    data: { dateKey: dk, type: "day-cell" },
  });

  return (
    <div
      ref={ref}
      data-date-key={dk}
      className={`relative border-r last:border-r-0 p-1.5 min-h-[200px] transition-colors pointer-events-none ${
        isToday ? "bg-primary/5" : "bg-card"
      } ${isDropTarget ? "ring-2 ring-primary ring-inset" : ""}`}
      style={{ gridColumn: `${gridColumn}`, gridRow: "2" }}
    >
      <div className="space-y-1 pointer-events-auto">
        {cards.map((card) => (
          <DraggableDayCard
            key={card.id}
            card={card}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableDayCard({
  card,
  onCardClick,
}: {
  card: Card;
  onCardClick: (card: Card) => void;
}) {
  const barColor = card.labels[0]?.color || "199 89% 48%";
  const isCompleted = card.completed;

  const { ref, handleRef } = useDraggable({
    id: card.id,
    data: {
      cardId: card.id,
      startDate: card.startDate,
      dueDate: card.dueDate,
      type: "calendar-card",
    },
  });

  return (
    <div
      ref={(el) => {
        ref(el);
        handleRef(el);
      }}
      className="w-full min-w-0 overflow-hidden flex flex-col rounded-md border bg-card hover:shadow-md transition-all select-none cursor-pointer pointer-events-auto"
      onClick={(e) => {
        e.stopPropagation();
        onCardClick(card);
      }}
    >
      <div
        className="h-1.5 w-8 rounded-full mt-1 ml-1 shrink-0"
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
