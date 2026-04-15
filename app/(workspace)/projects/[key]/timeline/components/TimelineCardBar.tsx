import { useDraggable } from "@dnd-kit/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/types/board";
import { format } from "date-fns";
import { ROW_HEIGHT } from "../constants";

interface TimelineCardBarProps {
  card: Card;
  pos: { left: number; width: number };
  statusStyle: { bg: string; text: string };
  onCardClick: (card: Card) => void;
  minDate: Date;
}

export function TimelineCardBar({
  card,
  pos,
  statusStyle,
  onCardClick,
  minDate,
}: TimelineCardBarProps) {
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
          onClick={() => onCardClick(card)}
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
        className="max-w-[240px] p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white"
        sideOffset={8}
      >
        <div className="flex flex-col">
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: statusStyle.bg }}
          />
          <div className="p-4 space-y-2">
            <h4 className="font-bold text-sm text-black">{card.title}</h4>
            {card.startDate && (
              <p className="text-xs text-muted-foreground">
                Start: {format(new Date(card.startDate), "dd MMM yyyy")}
              </p>
            )}
            {card.dueDate && (
              <p className="text-xs text-muted-foreground">
                Due: {format(new Date(card.dueDate), "dd MMM yyyy")}
              </p>
            )}
            {card.labels.length > 0 && (
              <div className="flex gap-1">
                {card.labels.map((label) => (
                  <Badge
                    key={label.id}
                    className="text-[10px]"
                    style={{ backgroundColor: `hsl(${label.color})` }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
