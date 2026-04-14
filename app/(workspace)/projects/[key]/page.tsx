"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBoardForProject } from "@/hooks/useBoardForProject";
import { filterCards, getAllAssignees } from "@/utils/filters";
import { getBackgroundStyle } from "@/utils/styles";

import { Card } from "@/types/board";
import { ViewType } from "@/types/project";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiltersPanel } from "@/components/FiltersPanel";
import { ViewTabs } from "@/components/ViewTabs";
import { BoardSettings } from "./kanban/components/BoardSettings";
import { ListView } from "./list";
import { TimelineView } from "./timeline";
import type { TimelineViewType } from "./timeline/types";
import { CalendarView } from "./calendar";
import { CardDetailDialog } from "./kanban/components/CardDetailDialog";
import { KanbanBoard } from "@/components/KanbanBoard";

export default function ProjectDetail() {
  const params = useParams<{ key: string }>();
  const id = params?.key;
  const router = useRouter();

  const {
    board,
    isLoading,
    setBoard,
    setColumnColor,
    copyColumn,
    moveAllCards,
    archiveAllCards,
    addColumn,
    renameColumn,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addAssignee,
    addLabel,
    updateLabel,
    deleteLabel,
    setBoardBackground,
    restoreCard,
    deleteArchivedCard,
    addActivity,
  } = useBoardForProject(id || "");

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("kanban");
  const [timelineViewType, setTimelineViewType] = useState<
    "day" | "week" | "month"
  >("month");
  const [timelineCurrentDate, setTimelineCurrentDate] = useState(new Date());

  const onTimelineDateChange = useCallback((date: Date) => {
    setTimelineCurrentDate(date);
  }, []);

  const [newColTitle, setNewColTitle] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const allAssignees = useMemo(() => {
    if (!board) return [];
    return getAllAssignees(board.cards);
  }, [board]);

  const openCard = useCallback((card: Card) => {
    setSelectedCard(card);
    setDialogOpen(true);
  }, []);

  const filteredCardIds = useCallback(
    (cardIds: string[]) => {
      if (!board) return [];
      return filterCards(board.cards, cardIds, { filterLabel, filterAssignee });
    },
    [board, filterLabel, filterAssignee],
  );

  const liveSelectedCard =
    selectedCard && board ? board.cards[selectedCard.id] || null : null;

  const archivedCount = board?.archivedCards
    ? Object.keys(board.archivedCards).length
    : 0;

  // Get background style
  const backgroundStyle = useMemo(() => {
    return getBackgroundStyle(board);
  }, [board]);

  const allCards = useMemo(() => {
    if (!board) return [];
    const cards: Card[] = [];
    board.columns.forEach((col) => {
      filteredCardIds(col.cardIds).forEach((id) => {
        const card = board.cards[id];
        if (card) cards.push(card);
      });
    });
    return cards;
  }, [board, filteredCardIds]);

  if (isLoading || !board) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={backgroundStyle}>
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
            <ViewTabs activeView={activeView} setActiveView={setActiveView} />

            <div className="ml-auto flex items-center gap-2">
              <FiltersPanel
                filterLabel={filterLabel}
                filterAssignee={filterAssignee}
                allAssignees={allAssignees}
                setFilterLabel={setFilterLabel}
                setFilterAssignee={setFilterAssignee}
              />

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
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
                {archivedCount > 0 && (
                  <span className="ml-1 rounded-full bg-orange-500 text-white h-4 w-4 text-[10px] flex items-center justify-center">
                    {archivedCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </div>

      {activeView === "kanban" && (
        <KanbanBoard
          board={board}
          filteredCardIds={filteredCardIds}
          openCard={openCard}
          updateCard={updateCard}
          setBoard={setBoard}
          renameColumn={renameColumn}
          deleteColumn={deleteColumn}
          addCard={addCard}
          setColumnColor={setColumnColor}
          copyColumn={copyColumn}
          moveAllCards={moveAllCards}
          archiveAllCards={archiveAllCards}
          addColumn={addColumn}
        />
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
            onUpdateCard={updateCard}
          />
        </div>
      )}

      {activeView === "timeline" && (
        <div className="flex-1 overflow-hidden p-4 h-[calc(100vh-96px)]">
          <TimelineView
            board={board}
            onCardClick={openCard}
            onUpdateCard={updateCard}
            onMoveCard={moveCard}
            viewType={timelineViewType as TimelineViewType}
            currentDate={timelineCurrentDate}
            onViewTypeChange={(type) =>
              setTimelineViewType(type as "day" | "week" | "month")
            }
            onDateChange={onTimelineDateChange}
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
        onAddActivity={addActivity}
      />

      <BoardSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        background={board.background}
        onBackgroundChange={setBoardBackground}
        labels={board.labels}
        onAddLabel={addLabel}
        onUpdateLabel={updateLabel}
        onDeleteLabel={deleteLabel}
        archivedCards={board.archivedCards}
        onRestoreCard={restoreCard}
        onDeleteArchivedCard={deleteArchivedCard}
        activities={board.activities}
      />
    </div>
  );
}
