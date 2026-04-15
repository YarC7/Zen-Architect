"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  startOfDay,
  endOfDay,
  addDays,
  differenceInDays,
  addMonths,
  subMonths,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import {
  DragDropManager,
  PointerSensor,
  PointerActivationConstraints,
} from "@dnd-kit/dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, BoardState } from "@/types/board";
import { TimelineViewType } from "./types";
import {
  getDateRangeForView,
  getDaysInRange,
  getMonthsInRange,
  getWeeksInRange,
  getPreviousDate,
  getNextDate,
} from "./utils/timelineUtils";
import { TimelineHeader } from "./components/TimelineHeader";
import { ScopePanel } from "./components/ScopePanel";
import { TimelinePanel } from "./components/TimelinePanel";
import {
  ROW_HEIGHT,
  HEADER_HEIGHT,
  SCOPE_WIDTH,
  DRAG_ACTIVATION_DISTANCE,
  getStatusStyle,
  getDayWidth,
} from "./constants";

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
  // State for expanded columns and cards
  const [expandedCols, setExpandedCols] = useState<Set<string>>(
    () => new Set(board.columns.map((c) => c.id)),
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedUnsetCols, setExpandedUnsetCols] = useState<Set<string>>(
    new Set(),
  );
  const [zoom, setZoom] = useState(1);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredColId, setHoveredColId] = useState<string | null>(null);

  // Drag and drop manager
  const manager = useMemo(
    () =>
      new DragDropManager({
        sensors: [
          PointerSensor.configure({
            activationConstraints: [
              new PointerActivationConstraints.Distance({
                value: DRAG_ACTIVATION_DISTANCE,
              }),
            ],
          }),
        ],
      }),
    [],
  );

  // Date range calculations
  const { minDate, days, totalDays, dayWidth } = useMemo(() => {
    const range = getDateRangeForView(currentDate, viewType);
    const min = startOfDay(range.start);
    const max = endOfDay(range.end);
    const allDays = getDaysInRange(min, max);
    const width = getDayWidth(viewType) * zoom;
    return {
      minDate: min,
      days: allDays.map((d) => d.date),
      totalDays: allDays.length,
      dayWidth: width,
    };
  }, [currentDate, viewType, zoom]);

  const handlePrevious = () => {
    onDateChange?.(getPreviousDate(currentDate, viewType));
  };

  const handleNext = () => {
    onDateChange?.(getNextDate(currentDate, viewType));
  };

  const handleToday = () => {
    onDateChange?.(new Date());
  };

  // Calculate bar position for a card
  const getBarPosition = useCallback(
    (card: Card) => {
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
      const left = differenceInDays(start, minDate) * dayWidth;
      const width = Math.max(
        (differenceInDays(end, start) + 1) * dayWidth,
        dayWidth,
      );
      return { left, width };
    },
    [minDate, dayWidth],
  );

  // Today marker position
  const todayOffset = useMemo(
    () => differenceInDays(new Date(), minDate) * dayWidth + dayWidth / 2,
    [minDate, dayWidth],
  );

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const offset = differenceInDays(new Date(), minDate) * dayWidth;
      const scrollPos =
        offset - scrollRef.current.clientWidth / 2 + dayWidth / 2;
      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });
    }
  }, [minDate, dayWidth]);

  // Sync scroll logic with requestAnimationFrame for maximum performance
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

  // Drag handler
  const handleDragEnd = useCallback(
    (event: any) => {
      const { operation } = event;
      const { source, transform, target } = operation;
      if (!source || !source.data || !source.data.card) return;

      const card = source.data.card as Card;

      // Handle row drop
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
          }
        }
      }

      // Handle time shift
      const daysShift = Math.round(transform.x / dayWidth);
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

  // Toggle handlers
  const toggleCol = useCallback((colId: string) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }, []);

  const toggleCard = useCallback((cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  const toggleUnset = useCallback((colId: string) => {
    setExpandedUnsetCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }, []);

  return (
    <DragDropProvider manager={manager} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-lg bg-card h-full font-sans">
        {/* Unified Global Header */}
        <div className="flex border-b border-border bg-card divide-x divide-border">
          {/* Left Header Partition (Scope Controls) */}
          <div 
            className="flex items-center gap-2 px-3 shrink-0"
            style={{ width: SCOPE_WIDTH, height: HEADER_HEIGHT }}
          >
            <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-md border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-sm hover:bg-background"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                className="h-6 px-2 text-[9px] font-bold uppercase tracking-tighter rounded-sm hover:bg-background"
                onClick={handleToday}
              >
                T
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-sm hover:bg-background"
                onClick={handleNext}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-between ml-1 overflow-hidden">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                Issue
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate hidden sm:inline">
                Status
              </span>
            </div>
          </div>

          {/* Right Header Partition (Timeline Controls) */}
          <div className="flex-1 px-4 flex items-center">
            {onViewTypeChange && (
              <TimelineHeader
                viewType={viewType}
                currentDate={currentDate}
                zoom={zoom}
                onViewTypeChange={onViewTypeChange}
                onZoomChange={setZoom}
              />
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left scope panel */}
          <div
            ref={leftPanelRef}
            className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-all duration-300 ease-in-out"
            onScroll={handleLeftPanelScroll}
          >
            <ScopePanel
              board={board}
              expandedCols={expandedCols}
              expandedCards={expandedCards}
              expandedUnsetCols={expandedUnsetCols}
              hoveredCardId={hoveredCardId}
              hoveredColId={hoveredColId}
              onCardClick={onCardClick}
              onToggleCol={toggleCol}
              onToggleCard={toggleCard}
              onToggleUnset={toggleUnset}
              onHoverCol={setHoveredColId}
              onHoverCard={setHoveredCardId}
            />
          </div>

          {/* Right timeline panel */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto transition-all duration-300 ease-in-out"
          >
            <TimelinePanel
              board={board}
              days={days}
              totalDays={totalDays}
              minDate={minDate}
              dayWidth={dayWidth}
              viewType={viewType}
              expandedCols={expandedCols}
              expandedCards={expandedCards}
              expandedUnsetCols={expandedUnsetCols}
              hoveredCardId={hoveredCardId}
              hoveredColId={hoveredColId}
              onCardClick={onCardClick}
              onToggleCard={toggleCard}
              onHoverCard={setHoveredCardId}
              getBarPosition={getBarPosition}
              todayOffset={todayOffset}
            />
          </div>
        </div>
      </div>

      {/* Drag overlay */}
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
                height: 28,
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
