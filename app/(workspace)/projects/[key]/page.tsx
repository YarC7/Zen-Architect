"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useBoardForProject } from "@/hooks/useBoardForProject";

import { Card, Assignee } from "@/types/board";
import { LABEL_PRESETS } from "@/types/board";
import { ViewType } from "@/types/project";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Clock,
  CalendarDays,
  Filter,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardHeader } from "./kanban/components/BoardHeader";
import { KanbanColumn } from "./kanban/components/KanbanColumn";
import { AddColumnInline } from "./kanban/components/AddColumnInline";
import { ListView } from "./list";
import { TimelineView } from "./timeline";
import { CalendarView } from "./calendar";
import { CardDetailDialog } from "./kanban/components/CardDetailDialog";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    board,
    setBoard,
    setBoardTitle,
    addColumn,
    renameColumn,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    addAssignee,
    addLabel,
    updateLabel,
    deleteLabel,
  } = useBoardForProject(id!);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("kanban");
  const [newColTitle, setNewColTitle] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);

  const allAssignees = useMemo(() => {
    const map = new Map<string, Assignee>();
    Object.values(board.cards).forEach((c) =>
      c.assignees.forEach((a) => map.set(a.name, a)),
    );
    return Array.from(map.values());
  }, [board.cards]);

  const handleDragOver = useCallback(
    (event: any) => {
      const { source, target } = event.operation;
      if (!source || !target) return;
      if (source.type !== "item") return;

      setBoard((prev) => {
        const currentMap: Record<string, string[]> = {};
        prev.columns.forEach((col) => {
          currentMap[col.id] = [...col.cardIds];
        });

        const newMap = move(currentMap, event);
        if (!newMap) return prev;

        const colIds = new Set(prev.columns.map((c) => c.id));
        for (const key in newMap) {
          newMap[key] = newMap[key].filter((id) => !colIds.has(id));
        }

        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            cardIds: newMap[col.id] || col.cardIds,
          })),
        };
      });
    },
    [setBoard],
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { canceled, source, target } = event.operation;
      if (canceled || !source || !target) return;

      if (source.type === "column" && target.type === "column") {
        setBoard((prev) => {
          const oldIndex = prev.columns.findIndex((c) => c.id === source.id);
          const newIndex = prev.columns.findIndex((c) => c.id === target.id);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
            return prev;
          const cols = [...prev.columns];
          const [moved] = cols.splice(oldIndex, 1);
          cols.splice(newIndex, 0, moved);
          return { ...prev, columns: cols };
        });
      }
    },
    [setBoard],
  );

  const openCard = (card: Card) => {
    setSelectedCard(card);
    setDialogOpen(true);
  };

  const filteredCardIds = useCallback(
    (cardIds: string[]) => {
      return cardIds.filter((id) => {
        const card = board.cards[id];
        if (!card) return false;
        if (filterLabel && !card.labels.some((l) => l.id === filterLabel))
          return false;
        if (
          filterAssignee &&
          !card.assignees.some((a) => a.id === filterAssignee)
        )
          return false;
        return true;
      });
    },
    [board.cards, filterLabel, filterAssignee],
  );

  const liveSelectedCard = selectedCard
    ? board.cards[selectedCard.id] || null
    : null;

  const hasFilter = Boolean(filterLabel || filterAssignee);

  const allCards = useMemo(() => {
    const cards: Card[] = [];
    board.columns.forEach((col) => {
      filteredCardIds(col.cardIds).forEach((id) => {
        const card = board.cards[id];
        if (card) cards.push(card);
      });
    });
    return cards;
  }, [board, filteredCardIds]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center gap-2 px-6 pt-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as ViewType)}
          className="flex-1"
        >
          <div className="flex items-center justify-between w-full">
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="gap-1.5 text-xs px-3">
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5 text-xs px-3">
                <List className="h-3.5 w-3.5" /> List
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5 text-xs px-3">
                <Clock className="h-3.5 w-3.5" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5 text-xs px-3">
                <CalendarDays className="h-3.5 w-3.5" /> Calendar
              </TabsTrigger>
            </TabsList>

            <div className="ml-auto flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={hasFilter ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filter
                    {hasFilter && (
                      <span className="ml-1 rounded-full bg-primary-foreground text-primary h-4 w-4 text-[10px] flex items-center justify-center">
                        {(filterLabel ? 1 : 0) + (filterAssignee ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3" align="end">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      Labels
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {LABEL_PRESETS.map((l) => (
                        <Badge
                          key={l.id}
                          className="cursor-pointer text-[11px]"
                          style={{
                            backgroundColor:
                              filterLabel === l.id
                                ? `hsl(${l.color})`
                                : `hsl(${l.color} / 0.15)`,
                            color:
                              filterLabel === l.id
                                ? "white"
                                : `hsl(${l.color})`,
                          }}
                          onClick={() =>
                            setFilterLabel(filterLabel === l.id ? null : l.id)
                          }
                        >
                          {l.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {allAssignees.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                        Assignees
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {allAssignees.map((a) => (
                          <Badge
                            key={a.id}
                            variant={
                              filterAssignee === a.id ? "default" : "outline"
                            }
                            className="cursor-pointer text-[11px]"
                            onClick={() =>
                              setFilterAssignee(
                                filterAssignee === a.id ? null : a.id,
                              )
                            }
                          >
                            {a.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setFilterLabel(null);
                        setFilterAssignee(null);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" /> Clear filters
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              {showAddCol ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newColTitle.trim()) return;
                    addColumn(newColTitle.trim());
                    setNewColTitle("");
                    setShowAddCol(false);
                  }}
                >
                  <Input
                    autoFocus
                    placeholder="Column name"
                    className="h-8 w-40"
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    onBlur={() => {
                      if (!newColTitle.trim()) setShowAddCol(false);
                    }}
                  />
                  <Button size="sm" type="submit" className="h-8">
                    Add
                  </Button>
                </form>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowAddCol(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Column
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      {activeView === "kanban" && (
        <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 p-4 h-full items-start">
              {board.columns.map((col, colIndex) => {
                const visibleIds = filteredCardIds(col.cardIds);
                const visibleCards = visibleIds
                  .map((id) => board.cards[id])
                  .filter(Boolean);
                return (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    cards={visibleCards}
                    index={colIndex}
                    onCardClick={openCard}
                    onToggleComplete={(cardId) => {
                      const c = board.cards[cardId];
                      if (c) updateCard({ ...c, completed: !c.completed });
                    }}
                    onRename={(title) => renameColumn(col.id, title)}
                    onDelete={() => deleteColumn(col.id)}
                    onAddCard={(title) => addCard(col.id, title)}
                  />
                );
              })}
              <div className="shrink-0">
                <AddColumnInline onAddColumn={addColumn} />
              </div>
            </div>
          </div>
        </DragDropProvider>
      )}

      {activeView === "list" && (
        <div className="flex-1 overflow-auto p-4">
          <ListView
            columns={board.columns}
            cards={board.cards}
            filteredCardIds={filteredCardIds}
            onCardClick={openCard}
            onToggleComplete={(cardId) => {
              const c = board.cards[cardId];
              if (c) updateCard({ ...c, completed: !c.completed });
            }}
          />
        </div>
      )}

      {activeView === "timeline" && (
        <div className="flex-1 overflow-auto p-4">
          <TimelineView
            cards={allCards}
            onCardClick={openCard}
            onUpdateCard={updateCard}
          />
        </div>
      )}

      {activeView === "calendar" && (
        <div className="flex-1 overflow-auto p-4">
          <CalendarView
            cards={allCards}
            onCardClick={openCard}
            onUpdateCard={updateCard}
          />
        </div>
      )}

      <CardDetailDialog
        card={liveSelectedCard}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={updateCard}
        onDelete={deleteCard}
        onAddAssignee={addAssignee}
        onAddLabel={addLabel}
        labels={board.labels}
        onUpdateLabel={updateLabel}
        onDeleteLabel={deleteLabel}
      />
    </div>
  );
}
