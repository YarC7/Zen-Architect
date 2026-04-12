import React, { useState } from "react";
import { Card, Column } from "@/types/board";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CalendarDays,
  ChevronRight,
  ChevronDown,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ListViewProps {
  columns: Column[];
  cards: Record<string, Card>;
  filteredCardIds: (cardIds: string[]) => string[];
  onCardClick: (card: Card) => void;
  onToggleComplete: (cardId: string) => void;
  onUpdateCard: (card: Card) => void;
}

export function ListView({
  columns,
  cards,
  filteredCardIds,
  onCardClick,
  onToggleComplete,
  onUpdateCard,
}: ListViewProps) {
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpand = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedCardIds);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCardIds(newExpanded);
  };

  return (
    <div className="space-y-6 pb-20">
      {columns.map((col) => {
        const visibleIds = filteredCardIds(col.cardIds);
        if (visibleIds.length === 0) return null;
        return (
          <div key={col.id}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${col.color})` }}
              />
              <h3 className="text-sm font-semibold text-foreground">
                {col.title}
              </h3>
              <span className="text-xs text-muted-foreground">
                ({visibleIds.length})
              </span>
            </div>
            <div className="space-y-1">
              {visibleIds.map((id) => {
                const card = cards[id];
                if (!card) return null;
                const isExpanded = expandedCardIds.has(card.id);
                const hasSubtasks = card.checklist && card.checklist.length > 0;
                const completedSubtasks =
                  card.checklist?.filter((i) => i.checked).length || 0;
                const totalSubtasks = card.checklist?.length || 0;
                const progress =
                  totalSubtasks > 0
                    ? (completedSubtasks / totalSubtasks) * 100
                    : 0;

                return (
                  <div key={card.id} className="space-y-1">
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md border bg-card hover:bg-accent/5 cursor-pointer transition-all",
                        isExpanded &&
                          "rounded-b-none border-b-transparent shadow-none",
                      )}
                      onClick={() => onCardClick(card)}
                    >
                      <Checkbox
                        checked={card.completed}
                        onCheckedChange={() => onToggleComplete(card.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />

                      {hasSubtasks ? (
                        <button
                          onClick={(e) => toggleExpand(card.id, e)}
                          className="p-1 hover:bg-muted rounded-sm transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        <div className="w-6" /> // Spacer for alignment
                      )}

                      <span
                        className={cn(
                          "flex-1 text-sm font-medium",
                          card.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {card.title}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasSubtasks && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 text-[10px] font-bold text-muted-foreground">
                            <CheckSquare className="h-3 w-3" />
                            {completedSubtasks}/{totalSubtasks}
                          </div>
                        )}
                        {card.labels.map((l) => (
                          <Badge
                            key={l.id}
                            className="text-[10px] px-1.5 py-0 border-none font-bold"
                            style={{
                              backgroundColor: `hsl(${l.color} / 0.15)`,
                              color: `hsl(${l.color})`,
                            }}
                          >
                            {l.name}
                          </Badge>
                        ))}
                        {card.dueDate && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(card.dueDate).toLocaleDateString("vi", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <div className="flex -space-x-1.5 ml-2">
                          {card.assignees.map((a) => (
                            <Avatar
                              key={a.id}
                              className="h-6 w-6 border-2 border-background ring-0"
                            >
                              <AvatarFallback
                                className="text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: `hsl(${a.color})` }}
                              >
                                {a.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Subtasks Accordion Content */}
                    {isExpanded && hasSubtasks && (
                      <div className="mx-0 p-3 pt-0 border border-t-0 rounded-b-md bg-accent/5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-3 ml-11">
                          <Progress
                            value={progress}
                            className="h-1.5 flex-1 bg-muted"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="space-y-1 ml-11">
                          {card.checklist?.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 py-1.5 group hover:bg-muted/30 px-2 rounded-md transition-colors"
                            >
                              <Checkbox
                                checked={item.checked}
                                onCheckedChange={(checked) => {
                                  const newChecklist = card.checklist.map(
                                    (ci) =>
                                      ci.id === item.id
                                        ? { ...ci, checked: !!checked }
                                        : ci,
                                  );
                                  onUpdateCard({
                                    ...card,
                                    checklist: newChecklist,
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4"
                              />
                              <span
                                className={cn(
                                  "text-xs transition-colors flex-1",
                                  item.checked
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground/80",
                                )}
                              >
                                {item.text}
                              </span>

                              <div className="flex -space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {card.assignees.map((a) => (
                                  <Avatar
                                    key={a.id}
                                    className="h-5 w-5 border-2 border-background shadow-sm"
                                  >
                                    <AvatarFallback
                                      className="text-[8px] font-extrabold text-white"
                                      style={{
                                        backgroundColor: `hsl(${a.color})`,
                                      }}
                                    >
                                      {a.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
