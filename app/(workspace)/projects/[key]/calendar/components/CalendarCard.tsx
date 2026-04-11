"use client";

import { Card } from "@/types/board";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CalendarCardProps {
  card: Card;
  onClick: (card: Card) => void;
  showAvatars?: boolean;
  compact?: boolean;
}

export function CalendarCard({
  card,
  onClick,
  showAvatars = true,
  compact = false,
}: CalendarCardProps) {
  const barColor = card.labels[0]?.color || "199 89% 48%";
  const isCompleted = card.completed;

  return (
    <div
      className={`group flex flex-col rounded-md border bg-card hover:shadow-md cursor-pointer transition-shadow ${
        compact ? "min-h-[28px]" : "min-h-[32px]"
      }`}
      onClick={() => onClick(card)}
    >
      {/* Colored label bar */}
      <div
        className="h-1.5 rounded-t-md shrink-0"
        style={{ backgroundColor: `hsl(${barColor})` }}
      />

      {/* Card content */}
      <div className="px-2 py-1.5 flex items-start gap-1.5">
        <span
          className={`text-xs leading-snug flex-1 ${
            isCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {card.title}
        </span>

        {showAvatars && card.assignees.length > 0 && (
          <div className="flex -space-x-1 shrink-0 mt-0.5">
            {card.assignees.slice(0, 3).map((a) => (
              <Avatar key={a.id} className="h-5 w-5 border-2 border-card">
                <AvatarFallback
                  className="text-[8px] text-white font-medium"
                  style={{ backgroundColor: `hsl(${a.color})` }}
                >
                  {a.name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
