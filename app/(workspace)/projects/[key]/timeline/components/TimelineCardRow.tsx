import { useDroppable } from "@dnd-kit/react";
import { Card } from "@/types/board";
import { TimelineCardBar } from "./TimelineCardBar";
import { DAY_WIDTH, ROW_HEIGHT } from "../constants";

interface TimelineCardRowProps {
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
}

export function TimelineCardRow({
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
}: TimelineCardRowProps) {
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

        <TimelineCardBar
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
              style={{ height: ROW_HEIGHT - 12 }}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
