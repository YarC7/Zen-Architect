"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
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
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  DragDropProvider,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/react";
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
import { ChevronRight, ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { BoardState, Card } from "@/types/board";
import { TimelineViewType } from "./types";
import {
  getDateRangeForView,
  getDaysInRange,
  getMonthsInRange,
  getWeeksInRange,
} from "./utils/timelineUtils";
import { TimelineHeader } from "./components/TimelineHeader";

interface TimelineViewProps {
  board: BoardState;
  onCardClick: (card: Card) => void;
  onUpdateCard: (card: Card) => void;
  onMoveCard: (
    cardId: string,
    fromColId: string,
    toColId: string,
    toIndex: number,
  ) => void;
  viewType?: TimelineViewType;
  currentDate?: Date;
  onViewTypeChange?: (type: TimelineViewType) => void;
  onDateChange?: (date: Date) => void;
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
const SUBTASK_HEIGHT = 32;
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
  const { ref, isDragging, isDropping } = useDraggable({
    id: `timeline-bar-${card.id}`,
    data: { card, minDate, type: "card" },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={ref}
          className={`absolute top-2 rounded-md cursor-pointer hover:brightness-105 shadow-sm flex items-center px-3 overflow-hidden z-5 group/bar ${
            isDragging
              ? "opacity-60 z-50 cursor-grabbing shadow-lg scale-[1.02]"
              : !isDropping
                ? "transition-all duration-200"
                : ""
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
          {pos.width > 40 && (
            <span className="text-[12px] font-semibold truncate select-none drop-shadow-sm">
              {card.title}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[240px] p-0 overflow-hidden border-none shadow-2xl rounded-xl animate-in fade-in zoom-in duration-200"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {/* Header/Status Stripe */}
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: statusStyle.bg }}
          />

          <div className="p-4 space-y-4 bg-popover text-popover-foreground">
            {/* Title & Description */}
            <div className="space-y-1">
              <h4 className="font-bold text-base leading-tight">
                {card.title}
              </h4>
              {card.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                  {card.description}
                </p>
              )}
            </div>

            {/* Dates Container */}
            <div className="flex items-center gap-3 py-2 px-3 bg-accent/30 rounded-lg border border-border/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Start
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {card.startDate
                    ? format(new Date(card.startDate), "dd MMM yyyy")
                    : "—"}
                </span>
              </div>
              <div className="h-4 w-px bg-border/60 self-end mb-1" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Due
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {card.dueDate
                    ? format(new Date(card.dueDate), "dd MMM yyyy")
                    : "—"}
                </span>
              </div>
            </div>

            {/* Labels & Assignees */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {card.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className="text-[10px] px-1.5 h-5 font-semibold border-current/20"
                      style={{
                        backgroundColor: `hsl(${label.color})`,
                        color: "white",
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}

              {card.assignees && card.assignees.length > 0 && (
                <div className="flex flex-row-reverse items-center justify-end -space-x-2 space-x-reverse ml-auto">
                  {card.assignees.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      title={user.name}
                      className="w-7 h-7 rounded-full border-2 border-popover flex items-center justify-center text-[11px] font-bold text-black shadow-sm ring-1 ring-border/5"
                      style={{
                        backgroundColor: `hsl(${user.color})`,
                        color: "white",
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                  ))}
                  {card.assignees.length > 3 && (
                    <div className="w-7 h-7 rounded-full border-2 border-popover bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm ring-1 ring-border/5">
                      +{card.assignees.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
  isExpanded,
  onToggleExpand,
}: {
  card: Card;
  pos: { left: number; width: number };
  statusStyle: { bg: string; text: string };
  onCardClick: (card: Card) => void;
  minDate: Date;
  totalDays: number;
  hoveredCardId: string | null;
  setHoveredCardId: (id: string | null) => void;
  isExpanded: boolean;
  onToggleExpand: (cardId: string) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `timeline-row-${card.id}`,
    data: { card, minDate, type: "row" },
  });

  return (
    <div
      ref={ref}
      className={`relative group transition-all ${
        hoveredCardId === card.id ? "bg-accent/50" : ""
      } ${isDropTarget ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""}`}
      onMouseEnter={() => setHoveredCardId(card.id)}
      onMouseLeave={() => setHoveredCardId(null)}
    >
      <div style={{ minHeight: ROW_HEIGHT }} className="relative">
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

      {isExpanded && card.checklist.length > 0 && (
        <div className="bg-muted/5">
          {card.checklist.map((item) => (
            <div
              key={item.id}
              style={{ height: SUBTASK_HEIGHT }}
              className="relative border-t border-border/10"
            >
              {/* Grid lines for subtask */}
              <div className="flex h-full absolute inset-0 pointer-events-none">
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-border/5 h-full"
                    style={{ width: DAY_WIDTH }}
                  />
                ))}
              </div>

              {/* Optional: Subtask bar representation if start/due dates are added to ChecklistItem in future */}
              {/* For now just show item title in grid if within date range? 
                  The request said "hiển thị todo của issue đó ở dưới", usually subtasks share parent date range in timeline or have their own.
                  Since ChecklistItem doesn't have dates, we'll just show them in the scope panel for now.
              */}
            </div>
          ))}
        </div>
      )}
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
  onMoveCard,
  viewType = "month",
  currentDate = new Date(),
  onViewTypeChange,
  onDateChange,
}: TimelineViewProps) {
  const [expandedCols, setExpandedCols] = useState<Set<string>>(
    () => new Set(board.columns.map((c) => c.id)),
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  // Calculate date range based on view type
  const { minDate, months, weeks, days, totalDays, periodLabel } =
    useMemo(() => {
      // Get date range from view type and current date
      const range = getDateRangeForView(currentDate, viewType);
      const min = startOfDay(range.start);
      const max = endOfDay(range.end);

      const allDays = getDaysInRange(min, max);
      const totalDaysCount = allDays.length;

      // Get months (for month view)
      const monthsInfo = getMonthsInRange(min, max);

      // Get weeks (for week view)
      const weeksInfo = getWeeksInRange(min, max);

      return {
        minDate: min,
        months: monthsInfo,
        weeks: weeksInfo,
        days: allDays.map((d) => d.date),
        totalDays: totalDaysCount,
        periodLabel: format(currentDate, "MMMM yyyy"),
      };
    }, [currentDate, viewType, board.cards]);

  // Legacy date range for cards that have dates outside current view
  const {
    minDate: cardMinDate,
    months: cardMonths,
    days: cardDays,
    totalDays: cardTotalDays,
  } = useMemo(() => {
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

  // Check if we should show the header based on view type
  const showMonthsHeader = viewType === "month";
  const showWeeksHeader = viewType === "week";
  const headerData = showMonthsHeader
    ? months
    : showWeeksHeader
      ? weeks
      : months;

  const toggleCol = (colId: string) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
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

  // Auto-scroll to today on mount and when currentDate changes
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const today = new Date();
      const offset = differenceInDays(today, minDate) * DAY_WIDTH;

      // Center today in the view
      const scrollPos =
        offset - scrollContainer.clientWidth / 2 + DAY_WIDTH / 2;

      scrollContainer.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });
    }
  }, [currentDate, minDate]); // Re-run when currentDate (set by Today button) or minDate changes

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }, []);

  const handleLeftPanelScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = e.currentTarget.scrollTop;
      }
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { operation } = event;
      const { source, transform, target } = operation;
      if (!source || !source.data || !source.data.card) return;

      const card = source.data.card as Card;

      // Handle dragging onto a different row/status
      if (target && target.id.startsWith("timeline-row-")) {
        const targetCard = target.data.card as Card;
        if (targetCard.id !== card.id) {
          const fromCol = board.columns.find((col) =>
            col.cardIds.includes(card.id),
          );
          const toCol = board.columns.find((col) =>
            col.cardIds.includes(targetCard.id),
          );

          if (fromCol && toCol) {
            const targetIndex = toCol.cardIds.indexOf(targetCard.id);
            onMoveCard(card.id, fromCol.id, toCol.id, targetIndex);
            // After moving, we don't return, as we might also want to update the time
          }
        }
      }

      // Handle time shift
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
    [onUpdateCard, onMoveCard, board.columns],
  );

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredColId, setHoveredColId] = useState<string | null>(null);

  return (
    <DragDropProvider manager={manager} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-lg bg-card h-full font-sans ">
        {onViewTypeChange && onDateChange && (
          <div className="px-4 pt-4">
            <TimelineHeader
              viewType={viewType}
              currentDate={currentDate}
              onViewTypeChange={onViewTypeChange}
              onDateChange={onDateChange}
            />
          </div>
        )}
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
            <div
              className="overflow-y-auto flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              ref={leftPanelRef}
              onScroll={handleLeftPanelScroll}
            >
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
                      colCards.map((card) => {
                        const isCardExpanded = expandedCards.has(card.id);
                        return (
                          <div key={card.id}>
                            <div
                              className={`flex items-center gap-2 px-3 border-b border-border/50 cursor-pointer transition-colors ${
                                hoveredCardId === card.id ? "bg-accent/50" : ""
                              }`}
                              style={{ height: ROW_HEIGHT }}
                              onClick={() => onCardClick(card)}
                              onMouseEnter={() => setHoveredCardId(card.id)}
                              onMouseLeave={() => setHoveredCardId(null)}
                            >
                              <div className="w-8 pl-4 flex items-center shrink-0">
                                {card.checklist.length > 0 && (
                                  <button
                                    className="p-0.5 hover:bg-accent rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCard(card.id);
                                    }}
                                  >
                                    {isCardExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                )}
                              </div>
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
                                <span className="text-sm truncate font-medium">
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

                            {isCardExpanded &&
                              card.checklist.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 px-3 border-b border-border/20 bg-muted/5"
                                  style={{ height: SUBTASK_HEIGHT }}
                                >
                                  <span className="w-12 shrink-0" />
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {item.checked ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    ) : (
                                      <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <span
                                      className={`text-xs truncate ${item.checked ? "text-muted-foreground line-through" : ""}`}
                                    >
                                      {item.text}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
              {/* Extra spacer to account for horizontal scrollbar in timeline panel */}
              <div
                style={{ height: 20 }}
                className="flex-none bg-transparent"
              />
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
                  {headerData.map((h, i) => (
                    <div
                      key={i}
                      className="border-r border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground bg-muted/10"
                      style={{ width: h.days * DAY_WIDTH }}
                    >
                      {h.label}
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
                              isExpanded={expandedCards.has(card.id)}
                              onToggleExpand={toggleCard}
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
      <DragOverlay dropAnimation={null}>
        {(draggable) => {
          if (!draggable) return null;
          const card = draggable.data?.card as Card;
          if (!card) return null;
          const pos = getBarPosition(card);
          if (!pos) return null;
          const statusStyle = getStatusStyle(
            board.columns.find((col) => col.cardIds.includes(card.id))?.title ||
              "",
          );
          return (
            <div
              className="rounded-md shadow-lg flex items-center px-2 overflow-hidden"
              style={{
                width: pos.width,
                height: ROW_HEIGHT - 16,
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                opacity: 0.9,
              }}
            >
              {pos.width > 60 && (
                <span className="text-[11px] font-medium truncate select-none">
                  {card.title}
                </span>
              )}
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
