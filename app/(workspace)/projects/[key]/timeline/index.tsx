"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  differenceInDays,
  addDays,
  eachDayOfInterval,
  isToday,
  getDay,
} from "date-fns";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import {
  DragDropManager,
  PointerSensor,
  PointerActivationConstraints,
} from "@dnd-kit/dom";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronRight, ChevronDown } from "lucide-react";
import { BoardState, Card } from "@/types/board";

interface TimelineViewProps {
  board: BoardState;
  onCardClick: (card: Card) => void;
  onUpdateCard: (card: Card) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  backlog: { bg: "hsl(210 10% 80%)", text: "hsl(210 10% 20%)" },
  "to do": { bg: "hsl(199 89% 48%)", text: "white" },
  "in progress": { bg: "hsl(25 95% 53%)", text: "white" },
  review: { bg: "hsl(262 83% 58%)", text: "white" },
  done: { bg: "hsl(142 71% 45%)", text: "white" },
};

function getStatusStyle(colTitle: string) {
  const key = colTitle.toLowerCase();
  return STATUS_COLORS[key] || { bg: "hsl(210 40% 60%)", text: "white" };
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 56;
const SCOPE_WIDTH = 420;

function TimelineBar({
  card,
  pos,
  statusStyle,
  onCardClick,
  minDate,
}: {
  card: Card;
  pos: { left: number; width: number };
  statusStyle: { bg: string; text: string };
  onCardClick: (card: Card) => void;
  minDate: Date;
}) {
  const { ref, isDragging } = useDraggable({
    id: `timeline-bar-${card.id}`,
    data: { card, minDate },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={ref}
          className={`absolute top-2 rounded-md cursor-pointer hover:brightness-110 shadow-sm flex items-center px-2 overflow-hidden z-5 ${
            isDragging
              ? "opacity-60 z-50 cursor-grabbing shadow-lg"
              : "transition-all"
          }`}
          style={{
            left: pos.left,
            width: pos.width,
            height: ROW_HEIGHT - 16,
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
            touchAction: "none",
          }}
          onClick={() => {
            onCardClick(card);
          }}
        >
          {pos.width > 60 && (
            <span className="text-[11px] font-medium truncate select-none">
              {card.title}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3">
        <div className="space-y-1.5">
          <p className="font-semibold text-sm leading-tight text-foreground">
            {card.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>
              {card.startDate
                ? format(new Date(card.startDate), "dd MMM yyyy")
                : "No start"}
            </span>
            <span>→</span>
            <span>
              {card.dueDate
                ? format(new Date(card.dueDate), "dd MMM yyyy")
                : "No end"}
            </span>
          </div>
          <Badge
            className="text-[10px] h-5"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
            }}
          >
            {statusStyle.bg === "#E2E8F0"
              ? "To Do"
              : statusStyle.bg === "#DBEAFE"
                ? "In Progress"
                : "Done"}
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function TimelineCardRow({
  card,
  pos,
  statusStyle,
  onCardClick,
  minDate,
  totalDays,
  hoveredCardId,
  setHoveredCardId,
}: {
  card: Card;
  pos: { left: number; width: number };
  statusStyle: { bg: string; text: string };
  onCardClick: (card: Card) => void;
  minDate: Date;
  totalDays: number;
  hoveredCardId: string | null;
  setHoveredCardId: (id: string | null) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `timeline-row-${card.id}`,
    data: { card, minDate },
  });

  return (
    <div
      ref={ref}
      className={`relative border-b border-border/30 group transition-colors ${
        hoveredCardId === card.id ? "bg-accent/50" : ""
      } ${isDropTarget ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""}`}
      style={{ height: ROW_HEIGHT }}
      onMouseEnter={() => setHoveredCardId(card.id)}
      onMouseLeave={() => setHoveredCardId(null)}
    >
      {/* Grid lines for row */}
      <div className="flex h-full absolute inset-0 pointer-events-none">
        {Array.from({ length: totalDays }).map((_, i) => (
          <div
            key={i}
            className="border-r border-border/10 h-full"
            style={{ width: DAY_WIDTH }}
          />
        ))}
      </div>

      <TimelineBar
        card={card}
        pos={pos}
        statusStyle={statusStyle}
        onCardClick={onCardClick}
        minDate={minDate}
      />
    </div>
  );
}

function TimelineDropZone({
  children,
  totalDays,
}: {
  children: React.ReactNode;
  totalDays: number;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: "timeline-drop-zone",
  });

  return (
    <div
      ref={ref}
      style={{ width: totalDays * DAY_WIDTH, minHeight: "100%" }}
      className={`relative transition-colors ${
        isDropTarget ? "bg-primary/5 ring-2 ring-inset ring-primary" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function TimelineView({
  board,
  onCardClick,
  onUpdateCard,
}: TimelineViewProps) {
  const [expandedCols, setExpandedCols] = useState<Set<string>>(
    () => new Set(board.columns.map((c) => c.id)),
  );

  const manager = useMemo(
    () =>
      new DragDropManager({
        sensors: [
          PointerSensor.configure({
            activationConstraints: [
              new PointerActivationConstraints.Distance({ value: 5 }),
            ],
          }),
        ],
      }),
    [],
  );

  // Calculate date range
  const { minDate, months, days, totalDays } = useMemo(() => {
    const dates: Date[] = [];
    Object.values(board.cards).forEach((card) => {
      if (card.startDate) dates.push(new Date(card.startDate));
      if (card.dueDate) dates.push(new Date(card.dueDate));
    });

    if (dates.length === 0) {
      const now = new Date();
      dates.push(subMonths(now, 1), addMonths(now, 2));
    }

    let min = new Date(Math.min(...dates.map((d) => d.getTime())));
    let max = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Pad by 2 weeks on each side
    min = addDays(startOfMonth(min), -14);
    max = addDays(endOfMonth(max), 14);

    const allDays = eachDayOfInterval({ start: min, end: max });
    const totalDaysCount = differenceInDays(max, min) + 1;

    // Get months
    const monthsSet = new Map<
      string,
      { label: string; days: number; startOffset: number }
    >();
    allDays.forEach((day, i) => {
      const key = format(day, "yyyy-MM");
      if (!monthsSet.has(key)) {
        monthsSet.set(key, {
          label: format(day, "MMM yyyy"),
          days: 0,
          startOffset: i,
        });
      }
      monthsSet.get(key)!.days++;
    });

    return {
      minDate: min,
      months: Array.from(monthsSet.values()),
      days: allDays,
      totalDays: totalDaysCount,
    };
  }, [board.cards]);

  const toggleCol = (colId: string) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  const getBarPosition = (card: Card) => {
    if (!card.startDate && !card.dueDate) return null;
    const start = card.startDate
      ? new Date(card.startDate)
      : card.dueDate
        ? addDays(new Date(card.dueDate), -3)
        : new Date();
    const end = card.dueDate
      ? new Date(card.dueDate)
      : card.startDate
        ? addDays(new Date(card.startDate), 3)
        : new Date();
    const left = differenceInDays(start, minDate) * DAY_WIDTH;
    const width = Math.max(
      (differenceInDays(end, start) + 1) * DAY_WIDTH,
      DAY_WIDTH,
    );
    return { left, width };
  };

  // Today marker
  const todayOffset =
    differenceInDays(new Date(), minDate) * DAY_WIDTH + DAY_WIDTH / 2;

  const scrollRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { operation } = event;
      const { source, transform } = operation;
      if (!source || !source.data || !source.data.card) return;

      const card = source.data.card as Card;
      const daysShift = Math.round(transform.x / DAY_WIDTH);

      if (daysShift !== 0) {
        const newStart = card.startDate
          ? addDays(new Date(card.startDate), daysShift)
          : null;
        const newEnd = card.dueDate
          ? addDays(new Date(card.dueDate), daysShift)
          : null;

        onUpdateCard({
          ...card,
          startDate: newStart?.toISOString() || null,
          dueDate: newEnd?.toISOString() || null,
        });
      }
    },
    [onUpdateCard],
  );

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredColId, setHoveredColId] = useState<string | null>(null);

  return (
    <DragDropProvider manager={manager} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-lg bg-card h-full font-sans">
        <div className="flex flex-1 overflow-hidden">
          {/* Left scope panel */}
          <div
            className="shrink-0 border-r border-border bg-card flex flex-col select-none"
            style={{ width: SCOPE_WIDTH }}
          >
            {/* Header */}
            <div
              className="flex items-center border-b border-border px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20"
              style={{ height: HEADER_HEIGHT }}
            >
              <span className="w-8">#</span>
              <span className="flex-1">Issue</span>
              <span className="w-24 text-center">Status</span>
            </div>
            {/* Rows */}
            <div className="overflow-hidden flex-1" ref={leftPanelRef}>
              {board.columns.map((col) => {
                const isExpanded = expandedCols.has(col.id);
                const colCards = col.cardIds
                  .map((id) => board.cards[id])
                  .filter(Boolean);
                const colStatusStyle = getStatusStyle(col.title);
                return (
                  <div key={col.id}>
                    <div
                      className={`flex items-center gap-2 px-3 border-b border-border bg-muted/5 cursor-pointer transition-colors ${
                        hoveredColId === col.id ? "bg-muted/15" : ""
                      }`}
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => toggleCol(col.id)}
                      onMouseEnter={() => setHoveredColId(col.id)}
                      onMouseLeave={() => setHoveredColId(null)}
                    >
                      <span className="text-xs font-semibold text-muted-foreground w-8">
                        {colCards.length}
                      </span>
                      <button className="p-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <span className="text-sm font-semibold truncate flex-1">
                        {col.title}
                      </span>
                      <Badge
                        className="text-[10px] h-5 px-1.5 font-bold uppercase shrink-0"
                        style={{
                          backgroundColor: colStatusStyle.bg,
                          color: colStatusStyle.text,
                        }}
                      >
                        {col.title}
                      </Badge>
                    </div>
                    {isExpanded &&
                      colCards.map((card) => (
                        <div
                          key={card.id}
                          className={`flex items-center gap-2 px-3 border-b border-border/50 cursor-pointer transition-colors ${
                            hoveredCardId === card.id ? "bg-accent/50" : ""
                          }`}
                          style={{ height: ROW_HEIGHT }}
                          onClick={() => onCardClick(card)}
                          onMouseEnter={() => setHoveredCardId(card.id)}
                          onMouseLeave={() => setHoveredCardId(null)}
                        >
                          <span className="text-xs text-muted-foreground w-8 pl-4" />
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {card.labels.length > 0 && (
                              <div
                                className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: `hsl(${card.labels[0].color})`,
                                }}
                              >
                                <span className="text-[8px] font-bold text-white">
                                  {card.labels[0].name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-sm truncate">
                              {card.title}
                            </span>
                          </div>
                          <Badge
                            className="text-[10px] h-5 px-1.5 font-bold uppercase shrink-0"
                            style={{
                              backgroundColor: colStatusStyle.bg,
                              color: colStatusStyle.text,
                            }}
                          >
                            {col.title}
                          </Badge>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right timeline panel */}
          <div
            className="flex-1 overflow-auto"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <TimelineDropZone totalDays={totalDays}>
              {/* Month + Day headers */}
              <div
                className="sticky top-0 z-20 bg-card border-b border-border"
                style={{ height: HEADER_HEIGHT }}
              >
                <div className="flex" style={{ height: HEADER_HEIGHT / 2 }}>
                  {months.map((m, i) => (
                    <div
                      key={i}
                      className="border-r border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground bg-muted/10"
                      style={{ width: m.days * DAY_WIDTH }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
                <div className="flex" style={{ height: HEADER_HEIGHT / 2 }}>
                  {days.map((day, i) => {
                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-center text-[10px] border-r border-border/40 ${
                          isToday(day)
                            ? "bg-primary text-primary-foreground font-bold"
                            : isWeekend
                              ? "text-muted-foreground/50"
                              : "text-muted-foreground"
                        }`}
                        style={{ width: DAY_WIDTH }}
                      >
                        {format(day, "d")}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-transparent z-10 pointer-events-none border-l border-dashed border-primary/40"
                style={{ left: todayOffset }}
              >
                <div className="absolute top-[3px] -translate-x-1/2 left-0 w-3 h-3 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              {/* Weekend shading */}
              {days.map((day, i) => {
                if (getDay(day) === 0 || getDay(day) === 6) {
                  return (
                    <div
                      key={`w-${i}`}
                      className="absolute top-0 bottom-0 bg-muted/20 pointer-events-none"
                      style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                    />
                  );
                }
                return null;
              })}

              {/* Bars */}
              <div>
                {board.columns.map((col) => {
                  const isExpanded = expandedCols.has(col.id);
                  const colCards = col.cardIds
                    .map((id) => board.cards[id])
                    .filter(Boolean);
                  const statusStyle = getStatusStyle(col.title);

                  return (
                    <div key={col.id}>
                      <div
                        className={`border-b border-border bg-muted/5 transition-colors ${
                          hoveredColId === col.id ? "bg-muted/15" : ""
                        }`}
                        style={{ height: ROW_HEIGHT }}
                        onMouseEnter={() => setHoveredColId(col.id)}
                        onMouseLeave={() => setHoveredColId(null)}
                      >
                        {/* Grid lines for col header row */}
                        <div className="flex h-full pointer-events-none">
                          {Array.from({ length: totalDays }).map((_, i) => (
                            <div
                              key={i}
                              className="border-r border-border/20 h-full"
                              style={{ width: DAY_WIDTH }}
                            />
                          ))}
                        </div>
                      </div>

                       {isExpanded &&
                         colCards.map((card) => {
                           const pos = getBarPosition(card);
                           if (!pos) return null;

                           return (
                             <TimelineCardRow
                               key={card.id}
                               card={card}
                               pos={pos}
                               statusStyle={statusStyle}
                               onCardClick={onCardClick}
                               minDate={minDate}
                               totalDays={totalDays}
                               hoveredCardId={hoveredCardId}
                               setHoveredCardId={setHoveredCardId}
                             />
                           );
                         })}
                    </div>
                  );
                })}
              </div>
            </TimelineDropZone>
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
}
