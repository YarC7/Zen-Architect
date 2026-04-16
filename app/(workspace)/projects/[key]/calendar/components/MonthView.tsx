"use client";

import { useCallback, useMemo } from "react";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import {
  DragDropManager,
  PointerSensor,
  PointerActivationConstraints,
} from "@dnd-kit/dom";
import { Card } from "@/types/board";
import { getCalendarDays, dateKey, getWeekDays } from "../utils/calendarUtils";
import { CALENDAR_CARD_HEIGHT, CALENDAR_HEADER_HEIGHT } from "@/constants/app";

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

  const gridColumn = (di: number) => {
    if (showWeekends) return di + 1;
    if (di === 0 || di === 6) return -1;
    return di;
  };

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

  return (
    <DragDropProvider manager={manager} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full overflow-hidden">
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

        <div className="flex-1 grid grid-rows-[repeat(auto-fill,1fr)] overflow-y-auto">
          {weeks.map((week, wi) => {
            const weekKey = dateKey(week[0].date);
            return (
              <WeekRow
                key={wi}
                week={week}
                weekKey={weekKey}
                cards={cards}
                todayKey={todayKey}
                onCardClick={onCardClick}
                gridCols={gridCols}
                gridColumn={gridColumn}
                showWeekends={showWeekends}
              />
            );
          })}
        </div>
      </div>
    </DragDropProvider>
  );
}

function WeekRow({
  week,
  weekKey,
  cards,
  todayKey,
  onCardClick,
  gridCols,
  gridColumn,
  showWeekends,
}: {
  week: { day: number; date: Date; isOtherMonth: boolean }[];
  weekKey: string;
  cards: Card[];
  todayKey: string;
  onCardClick: (card: Card) => void;
  gridCols: number;
  gridColumn: (di: number) => number;
  showWeekends: boolean;
}) {
  const weekStart = week[0]?.date;
  const weekEnd = week[6]?.date;

  const { spanning, singleDay } = useMemo(() => {
    const spanning: Card[] = [];
    const singleDay: Card[] = [];

    // Limit the number of cards processed to prevent performance issues
    const MAX_CARDS_TO_PROCESS = 500;
    const cardsToProcess = cards.length > MAX_CARDS_TO_PROCESS
      ? cards.slice(0, MAX_CARDS_TO_PROCESS)
      : cards;

    cardsToProcess.forEach((card) => {
      if (!card.dueDate) return;
      const cardEnd = new Date(card.dueDate.split("T")[0]);
      const cardStart = card.startDate
        ? new Date(card.startDate.split("T")[0])
        : cardEnd;
      const dur = Math.round(
        (cardEnd.getTime() - cardStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (cardEnd < weekStart || cardStart > weekEnd) return;

      if (dur > 0) {
        spanning.push(card);
      } else {
        singleDay.push(card);
      }
    });

    return { spanning, singleDay };
  }, [cards, weekStart, weekEnd]);

  const singleDayByDate = useMemo(() => {
    const map = new Map<string, Card[]>();

    // Limit processing for performance
    const MAX_CARDS_TO_PROCESS = 500;
    const cardsToProcess = singleDay.length > MAX_CARDS_TO_PROCESS
      ? singleDay.slice(0, MAX_CARDS_TO_PROCESS)
      : singleDay;

    cardsToProcess.forEach((card) => {
      const dk = card.dueDate!.split("T")[0];
      if (!map.has(dk)) map.set(dk, []);
      map.get(dk)!.push(card);
    });
    return map;
  }, [singleDay]);

  // Layout algorithm: assign each spanning card to a row based on overlap
  // Cards that don't overlap share a row; overlapping cards get separate rows
  const spanningLayout = useMemo(() => {
    interface LayoutCard {
      card: Card;
      row: number;
      startCol: number;
      endCol: number;
      isActualStart: boolean;
      isActualEnd: boolean;
    }

    // Limit the number of cards for layout computation to prevent performance issues
    const MAX_LAYOUT_CARDS = 100;
    const spanningToProcess = spanning.length > MAX_LAYOUT_CARDS
      ? spanning.slice(0, MAX_LAYOUT_CARDS)
      : spanning;

    // First pass: compute column positions for each card
    const cardPositions: LayoutCard[] = spanningToProcess.map((card) => {
      const startStr = card.startDate!.split("T")[0];
      const endStr = card.dueDate!.split("T")[0];

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

      const actualStartIdx = showWeekends ? startCol - 1 : startCol;
      const actualEndIdx = showWeekends ? endCol - 1 : endCol;
      const isActualStart =
        startStr === dateKey(week[actualStartIdx]?.date || week[0].date);
      const isActualEnd =
        endStr === dateKey(week[actualEndIdx]?.date || week[6].date);

      return {
        card,
        row: 0,
        startCol,
        endCol,
        isActualStart,
        isActualEnd,
      };
    }).filter((c) => c.startCol !== -1 && c.endCol !== -1 && c.endCol >= c.startCol);

    // Sort by start column, then by end column (longer cards first)
    cardPositions.sort((a, b) => {
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      return b.endCol - a.endCol;
    });

    // Assign rows using greedy interval coloring
    const rows: number[][] = []; // each row is an array of endCol values
    for (const cp of cardPositions) {
      let assignedRow = -1;
      for (let r = 0; r < rows.length; r++) {
        const rowEnds = rows[r];
        // Check if this card overlaps with any card in this row
        const overlaps = rowEnds.some((end) => end >= cp.startCol);
        if (!overlaps) {
          assignedRow = r;
          break;
        }
      }
      if (assignedRow === -1) {
        assignedRow = rows.length;
        rows.push([]);
      }
      cp.row = assignedRow;
      rows[assignedRow].push(cp.endCol);
    }

    return { layout: cardPositions, totalRows: rows.length };
  }, [spanning, gridColumn, week, showWeekends]);

  const spanningCardRowHeight = 36; // px per spanning card row
  const spanningSectionHeight = Math.max(spanningLayout.totalRows * spanningCardRowHeight, 36);

  return (
    <div
      className="grid border-b"
      style={{
        minHeight: `${CALENDAR_CARD_HEIGHT}px`,
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `${CALENDAR_HEADER_HEIGHT}px ${spanningSectionHeight}px 1fr`,
      }}
    >
      {/* Row 1: Day numbers */}
      {week.map((dayInfo, di) => {
        const ci = gridColumn(di);
        if (ci < 0) return null;

        const dk = dateKey(dayInfo.date);
        const isToday = dk === todayKey;

        return (
          <div
            key={`header-${di}`}
            className={`p-1.5 flex transition-colors ${dayInfo.isOtherMonth
                ? "bg-muted/10"
                : isToday
                  ? "bg-primary/5"
                  : "bg-card"
              } ${ci < gridCols ? "border-r" : ""}`}
            style={{ gridColumn: ci, gridRow: "1" }}
          >
            <div
              className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday
                  ? "bg-primary text-primary-foreground font-bold"
                  : dayInfo.isOtherMonth
                    ? "text-muted-foreground/40"
                    : "text-foreground"
                }`}
            >
              {dayInfo.day}
            </div>
          </div>
        );
      })}

      {/* Row 2: Spanning cards — positioned by computed layout rows */}
      {spanningLayout.layout.map((lc) => {
        return (
          <DraggableSpanningCard
            key={`${lc.card.id}-${weekKey}`}
            card={lc.card}
            isStart={lc.isActualStart}
            isEnd={lc.isActualEnd}
            weekKey={weekKey}
            onCardClick={onCardClick}
            style={{
              gridColumn: `${lc.startCol} / ${lc.endCol + 1}`,
              gridRow: "2",
              marginTop: `${lc.row * spanningCardRowHeight}px`,
              height: `${spanningCardRowHeight - 2}px`,
              paddingLeft: "4px",
              paddingRight: "4px",
            }}
          />
        );
      })}

      {/* Row 3: Day cells (droppable areas and single-day cards) */}
      {week.map((dayInfo, di) => {
        const ci = gridColumn(di);
        if (ci < 0) return null;

        const dk = dateKey(dayInfo.date);
        const isToday = dk === todayKey;
        const dayCards = singleDayByDate.get(dk) || [];

        return (
          <DroppableDayCell
            key={di}
            dateKey={dk}
            dayInfo={dayInfo}
            isToday={isToday}
            cards={dayCards}
            onCardClick={onCardClick}
            gridColumn={ci}
          />
        );
      })}
    </div>
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
      className={`w-full min-w-0 overflow-hidden flex flex-col rounded-md border bg-card/95 hover:shadow-md transition-all select-none pointer-events-auto ${!isStart ? "rounded-l-none border-l-0" : ""
        } ${!isEnd ? "rounded-r-none border-r-0" : ""} cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation();
        onCardClick(card);
      }}
    >
      <div
        className="h-1.5 w-8 rounded-full mt-1 ml-1 shrink-0"
        style={{
          backgroundColor: `hsl(${barColor})`,
        }}
      />
      <div className="min-w-0 px-2 py-1">
        <span
          className={`block min-w-0 truncate text-xs leading-snug ${isCompleted
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
  dayInfo,
  isToday,
  cards,
  onCardClick,
  gridColumn,
}: {
  dateKey: string;
  dayInfo: { day: number; date: Date; isOtherMonth: boolean };
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
      className={`relative z-0 min-w-0 border-r last:border-r-0 p-1.5 transition-colors pointer-events-none ${dayInfo.isOtherMonth
          ? "bg-muted/10"
          : isToday
            ? "bg-primary/5"
            : "bg-card"
        } ${isDropTarget ? "ring-2 ring-primary ring-inset" : ""}`}
      style={{ gridColumn: `${gridColumn}`, gridRow: "3" }}
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
      <div className="min-w-0 px-2 py-1">
        <span
          className={`block min-w-0 truncate text-xs leading-snug ${isCompleted
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
