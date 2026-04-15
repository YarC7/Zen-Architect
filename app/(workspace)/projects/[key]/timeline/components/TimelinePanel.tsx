import { format, getDay, isToday } from "date-fns";
import { useDroppable } from "@dnd-kit/react";
import { Card, BoardState } from "@/types/board";
import { TimelineCardRow } from "./TimelineCardRow";
import {
  ROW_HEIGHT,
  HEADER_HEIGHT,
  getStatusStyle,
} from "../constants";
import { TimelineViewType } from "../types";
import { getMonthsInRange } from "../utils/timelineUtils";

interface TimelinePanelProps {
  board: BoardState;
  days: Date[];
  totalDays: number;
  minDate: Date;
  dayWidth: number;
  viewType: TimelineViewType;
  expandedCols: Set<string>;
  expandedCards: Set<string>;
  expandedUnsetCols: Set<string>;
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
  dayWidth,
  viewType,
  expandedCols,
  expandedCards,
  expandedUnsetCols,
  hoveredCardId,
  hoveredColId,
  onCardClick,
  onToggleCard,
  onHoverCard,
  getBarPosition,
  todayOffset,
}: TimelinePanelProps) {
  return (
    <TimelineDropZone totalDays={totalDays} dayWidth={dayWidth}>
      <TimelineHeaders days={days} dayWidth={dayWidth} />
      <TodayLine todayOffset={todayOffset} />
      <WeekendShading days={days} dayWidth={dayWidth} />
      <CardRows
        board={board}
        expandedCols={expandedCols}
        expandedCards={expandedCards}
        expandedUnsetCols={expandedUnsetCols}
        hoveredCardId={hoveredCardId}
        hoveredColId={hoveredColId}
        onCardClick={onCardClick}
        onToggleCard={onToggleCard}
        onHoverCard={onHoverCard}
        minDate={minDate}
        totalDays={totalDays}
        dayWidth={dayWidth}
        getBarPosition={getBarPosition}
      />
    </TimelineDropZone>
  );
}

interface TimelineDropZoneProps {
  children: React.ReactNode;
  totalDays: number;
  dayWidth: number;
}

function TimelineDropZone({
  children,
  totalDays,
  dayWidth,
}: TimelineDropZoneProps) {
  const { ref, isDropTarget } = useDroppable({
    id: "timeline-drop-zone",
  });

  return (
    <div
      ref={ref}
      style={{ width: totalDays * dayWidth, minHeight: "100%" }}
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
  dayWidth: number;
}

function TimelineHeaders({ days, dayWidth }: TimelineHeadersProps) {
  const months = getMonthsInRange(days[0], days[days.length - 1]);

  return (
    <div
      className="sticky top-0 z-20 bg-card border-b border-border"
      style={{ height: HEADER_HEIGHT }}
    >
      <div className="flex" style={{ height: HEADER_HEIGHT / 2 }}>
        {months.map((month, i) => (
          <div
            key={i}
            className="border-r border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground bg-muted/10 shrink-0"
            style={{ width: month.days * dayWidth }}
          >
            {month.label}
          </div>
        ))}
      </div>
      <div className="flex" style={{ height: HEADER_HEIGHT / 2 }}>
        {days.map((day, i) => {
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;
          const showFullDate = dayWidth > 100;

          return (
            <div
              key={i}
              className={`flex items-center justify-center text-[10px] border-r border-border/40 shrink-0 ${
                isToday(day)
                  ? "bg-primary text-primary-foreground font-bold"
                  : isWeekend
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground"
              }`}
              style={{ width: dayWidth }}
            >
              {showFullDate ? format(day, "EEE d") : format(day, "d")}
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
  dayWidth: number;
}

function WeekendShading({ days, dayWidth }: WeekendShadingProps) {
  return (
    <>
      {days.map((day, i) => {
        if (getDay(day) === 0 || getDay(day) === 6) {
          return (
            <div
              key={`w-${i}`}
              className="absolute top-0 bottom-0 bg-muted/20 pointer-events-none"
              style={{ left: i * dayWidth, width: dayWidth }}
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
  expandedUnsetCols: Set<string>;
  hoveredCardId: string | null;
  hoveredColId: string | null;
  onCardClick: (card: Card) => void;
  onToggleCard: (cardId: string) => void;
  onHoverCard: (cardId: string | null) => void;
  minDate: Date;
  totalDays: number;
  dayWidth: number;
  getBarPosition: (card: Card) => { left: number; width: number } | null;
}

function CardRows({
  board,
  expandedCols,
  expandedCards,
  expandedUnsetCols,
  hoveredCardId,
  hoveredColId,
  onCardClick,
  onToggleCard,
  onHoverCard,
  minDate,
  totalDays,
  dayWidth,
  getBarPosition,
}: CardRowsProps) {
  return (
    <div>
      {board.columns.map((col) => {
        const isExpanded = expandedCols.has(col.id);
        const isUnsetExpanded = expandedUnsetCols.has(col.id);
        const colCards = col.cardIds
          .map((id) => board.cards[id])
          .filter(Boolean);
        const statusStyle = getStatusStyle(col.title);

        const cardsWithDates = colCards.filter(
          (card) => card.startDate || card.dueDate,
        );
        const cardsWithoutDates = colCards.filter(
          (card) => !card.startDate && !card.dueDate,
        );

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
                    className="border-r border-border/20 h-full shrink-0"
                    style={{ width: dayWidth }}
                  />
                ))}
              </div>
            </div>
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
              {isExpanded && (
                <>
                  {cardsWithDates.map((card) => {
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
                        dayWidth={dayWidth}
                        hoveredCardId={hoveredCardId}
                        setHoveredCardId={onHoverCard}
                        isExpanded={expandedCards.has(card.id)}
                        onToggleExpand={onToggleCard}
                      />
                    );
                  })}

                  {/* Spacer for "Chưa thiết lập" section */}
                  {cardsWithoutDates.length > 0 && (
                    <>
                      <div
                        className="border-b border-border/10 bg-muted/5 transition-all duration-300 ease-in-out"
                        style={{ height: ROW_HEIGHT - 8 }}
                      >
                        <div className="flex h-full pointer-events-none opacity-20">
                          {Array.from({ length: totalDays }).map((_, i) => (
                            <div
                              key={i}
                              className="border-r border-border/20 h-full shrink-0"
                              style={{ width: dayWidth }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="overflow-hidden transition-all duration-300 ease-in-out">
                        {isUnsetExpanded &&
                          cardsWithoutDates.map((card) => (
                            <div
                              key={`unset-spacer-${card.id}`}
                              className="border-b border-border/5 bg-muted/5"
                              style={{ height: ROW_HEIGHT }}
                            >
                              <div className="flex h-full pointer-events-none opacity-10">
                                {Array.from({ length: totalDays }).map(
                                  (_, i) => (
                                    <div
                                      key={i}
                                      className="border-r border-border/20 h-full shrink-0"
                                      style={{ width: dayWidth }}
                                    />
                                  ),
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
