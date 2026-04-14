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
import { Card, BoardState } from "@/types/board";
import { TimelineViewType } from "./types";
import {
  getDateRangeForView,
  getDaysInRange,
  getMonthsInRange,
  getWeeksInRange,
} from "./utils/timelineUtils";
import { TimelineHeader } from "./components/TimelineHeader";
import { ScopePanel } from "./components/ScopePanel";
import { TimelinePanel } from "./components/TimelinePanel";
import {
  DAY_WIDTH,
  DRAG_ACTIVATION_DISTANCE,
  getStatusStyle,
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
  const { minDate, days, totalDays } = useMemo(() => {
    const range = getDateRangeForView(currentDate, viewType);
    const min = startOfDay(range.start);
    const max = endOfDay(range.end);
    const allDays = getDaysInRange(min, max);
    return {
      minDate: min,
      days: allDays.map((d) => d.date),
      totalDays: allDays.length,
    };
  }, [currentDate, viewType]);

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
      const left = differenceInDays(start, minDate) * DAY_WIDTH;
      const width = Math.max(
        (differenceInDays(end, start) + 1) * DAY_WIDTH,
        DAY_WIDTH,
      );
      return { left, width };
    },
    [minDate],
  );

  // Today marker position
  const todayOffset = useMemo(
    () => differenceInDays(new Date(), minDate) * DAY_WIDTH + DAY_WIDTH / 2,
    [minDate],
  );

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const offset = differenceInDays(new Date(), minDate) * DAY_WIDTH;
      const scrollPos =
        offset - scrollRef.current.clientWidth / 2 + DAY_WIDTH / 2;
      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });
    }
  }, [minDate]);

  // Synchronized scrolling
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

  return (
    <DragDropProvider manager={manager} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-lg bg-card h-full font-sans">
        {/* Header */}
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

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left scope panel */}
          <div
            ref={leftPanelRef}
            className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={handleLeftPanelScroll}
          >
            <ScopePanel
              board={board}
              expandedCols={expandedCols}
              expandedCards={expandedCards}
              hoveredCardId={hoveredCardId}
              hoveredColId={hoveredColId}
              onCardClick={onCardClick}
              onToggleCol={toggleCol}
              onToggleCard={toggleCard}
              onHoverCol={setHoveredColId}
              onHoverCard={setHoveredCardId}
            />
          </div>

          {/* Right timeline panel */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto"
          >
            <TimelinePanel
              board={board}
              days={days}
              totalDays={totalDays}
              minDate={minDate}
              expandedCols={expandedCols}
              expandedCards={expandedCards}
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
