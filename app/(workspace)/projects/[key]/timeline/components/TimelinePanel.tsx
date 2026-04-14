import { format, getDay, isToday } from "date-fns";
import { useDroppable } from "@dnd-kit/react";
import { Card, BoardState } from "@/types/board";
import { TimelineCardRow } from "./TimelineCardRow";
import {
  DAY_WIDTH,
  ROW_HEIGHT,
  HEADER_HEIGHT,
  getStatusStyle,
} from "../constants";

interface TimelinePanelProps {
  board: BoardState;
  days: Date[];
  totalDays: number;
  minDate: Date;
  expandedCols: Set<string>;
  expandedCards: Set<string>;
  hoveredCardId: string | null;
  hoveredColId: string | null;
  onCardClick: (card: Card) => void;
  onToggleCard: (cardId: string) => void;
  onHoverCard: (cardId: string | null) => void;
  getBarPosition: (card: Card) => { left: number; width: number } | null;
  todayOffset: number;
}

export function TimelinePanel({
  board,
  days,
  totalDays,
  minDate,
  expandedCols,
  expandedCards,
  hoveredCardId,
  hoveredColId,
  onCardClick,
  onToggleCard,
  onHoverCard,
  getBarPosition,
  todayOffset,
}: TimelinePanelProps) {
  return (
    <TimelineDropZone totalDays={totalDays}>
      <TimelineHeaders days={days} />
      <TodayLine todayOffset={todayOffset} />
      <WeekendShading days={days} />
      <CardRows
        board={board}
        expandedCols={expandedCols}
        expandedCards={expandedCards}
        hoveredCardId={hoveredCardId}
        hoveredColId={hoveredColId}
        onCardClick={onCardClick}
        onToggleCard={onToggleCard}
        onHoverCard={onHoverCard}
        minDate={minDate}
        totalDays={totalDays}
        getBarPosition={getBarPosition}
      />
    </TimelineDropZone>
  );
}

interface TimelineDropZoneProps {
  children: React.ReactNode;
  totalDays: number;
}

function TimelineDropZone({ children, totalDays }: TimelineDropZoneProps) {
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

interface TimelineHeadersProps {
  days: Date[];
}

function TimelineHeaders({ days }: TimelineHeadersProps) {
  return (
    <div
      className="sticky top-0 z-20 bg-card border-b border-border"
      style={{ height: HEADER_HEIGHT }}
    >
      <div className="flex" style={{ height: HEADER_HEIGHT / 2 }}>
        {days.map((day, i) => {
          const isFirstOfMonth = i === 0 || day.getDate() === 1;
          if (!isFirstOfMonth) return null;
          return (
            <div
              key={i}
              className="border-r border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground bg-muted/10"
              style={{ width: DAY_WIDTH }}
            >
              {format(day, "MMM")}
            </div>
          );
        })}
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
  );
}

interface TodayLineProps {
  todayOffset: number;
}

function TodayLine({ todayOffset }: TodayLineProps) {
  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-transparent z-10 pointer-events-none border-l border-dashed border-primary/40"
      style={{ left: todayOffset }}
    >
      <div className="absolute top-[3px] -translate-x-1/2 left-0 w-3 h-3 rounded-full bg-primary flex items-center justify-center shadow-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    </div>
  );
}

interface WeekendShadingProps {
  days: Date[];
}

function WeekendShading({ days }: WeekendShadingProps) {
  return (
    <>
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
    </>
  );
}

interface CardRowsProps {
  board: BoardState;
  expandedCols: Set<string>;
  expandedCards: Set<string>;
  hoveredCardId: string | null;
  hoveredColId: string | null;
  onCardClick: (card: Card) => void;
  onToggleCard: (cardId: string) => void;
  onHoverCard: (cardId: string | null) => void;
  minDate: Date;
  totalDays: number;
  getBarPosition: (card: Card) => { left: number; width: number } | null;
}

function CardRows({
  board,
  expandedCols,
  expandedCards,
  hoveredCardId,
  hoveredColId,
  onCardClick,
  onToggleCard,
  onHoverCard,
  minDate,
  totalDays,
  getBarPosition,
}: CardRowsProps) {
  return (
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
            >
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
                    setHoveredCardId={onHoverCard}
                    isExpanded={expandedCards.has(card.id)}
                    onToggleExpand={onToggleCard}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
