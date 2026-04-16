import { useCallback, useMemo } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import {
  DragDropManager,
  PointerSensor,
  PointerActivationConstraints,
} from "@dnd-kit/dom";
import { move } from "@dnd-kit/helpers";
import { Card, BoardState, Column } from "@/types/board";
import { KanbanColumn } from "../app/(workspace)/projects/[key]/kanban/components/KanbanColumn";
import { AddColumnInline } from "../app/(workspace)/projects/[key]/kanban/components/AddColumnInline";
import { DRAG_ACTIVATION_DISTANCE } from "@/constants/app";

interface KanbanBoardProps {
  board: BoardState;
  filteredCardIds: (ids: string[]) => string[];
  openCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  setBoard: (updater: BoardState | ((prev: BoardState) => BoardState)) => void;
  renameColumn: (id: string, title: string) => void;
  deleteColumn: (id: string) => void;
  addCard: (colId: string, title: string) => void;
  setColumnColor: (id: string, color: string) => void;
  copyColumn: (id: string) => void;
  moveAllCards: (fromId: string, toId: string) => void;
  archiveAllCards: (id: string) => void;
  addColumn: (title: string) => void;
}

export function KanbanBoard({
  board,
  filteredCardIds,
  openCard,
  updateCard,
  setBoard,
  renameColumn,
  deleteColumn,
  addCard,
  setColumnColor,
  copyColumn,
  moveAllCards,
  archiveAllCards,
  addColumn,
}: KanbanBoardProps) {
  const manager = useMemo(
    () =>
      new DragDropManager({
        sensors: [
          PointerSensor.configure({
            activationConstraints: [
              new PointerActivationConstraints.Distance({ value: DRAG_ACTIVATION_DISTANCE }),
            ],
          }),
        ],
      }),
    [],
  );

  const handleDragOver = useCallback(
    (event: any) => {
      const { source, target } = event.operation;
      if (!source || !target || !board) return;
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
    [board, setBoard]
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { canceled, source, target } = event.operation;
      if (canceled || !source || !target || !board) return;

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
    [board, setBoard]
  );

  return (
    <DragDropProvider
      manager={manager}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1">
        <div className="flex gap-4 p-4 h-full items-start">
          {board.columns.map((col: Column, colIndex: number) => {
            const visibleIds = filteredCardIds(col.cardIds);
            const visibleCards = visibleIds
              .map((id: string) => board.cards[id])
              .filter(Boolean);
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                cards={visibleCards}
                index={colIndex}
                onCardClick={openCard}
                onToggleComplete={(cardId: string) => {
                  const c = board.cards[cardId];
                  if (c) updateCard({ ...c, completed: !c.completed });
                }}
                onRename={(title: string) => renameColumn(col.id, title)}
                onDelete={() => deleteColumn(col.id)}
                onAddCard={(title: string) => addCard(col.id, title)}
                onSetColor={(color: string) => setColumnColor(col.id, color)}
                onCopy={() => copyColumn(col.id)}
                onMoveAllCards={(toColId: string) => moveAllCards(col.id, toColId)}
                onArchiveAllCards={() => archiveAllCards(col.id)}
                allColumns={board.columns}
              />
            );
          })}
          <div className="shrink-0">
            <AddColumnInline onAddColumn={addColumn} />
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
}