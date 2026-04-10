"use client"

import { useCallback, useMemo, useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"
import { move } from "@dnd-kit/helpers"
import { BoardHeader } from "./BoardHeader"
import { KanbanColumn } from "./KanbanColumn"
import { CardDetailDialog } from "./CardDetailDialog"
import { AddColumnInline } from './AddColumnInline';
import { useBoard } from "@/hooks/useBoard"
import { Assignee, Card } from "@/types/board"

export default function Kanban() {
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
  } = useBoard()

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)

  // Collect all unique assignees
  const allAssignees = useMemo(() => {
    const map = new Map<string, Assignee>()
    Object.values(board.cards).forEach((c) =>
      c.assignees.forEach((a) => map.set(a.name, a))
    )
    return Array.from(map.values())
  }, [board.cards])

  // Build items map for dnd-kit move helper: { columnId: cardId[] }
  const itemsMap = useMemo(() => {
    const m: Record<string, string[]> = {}
    board.columns.forEach((col) => {
      m[col.id] = col.cardIds
    })
    return m
  }, [board.columns])

  const handleDragOver = useCallback(
    (event: any) => {
      const { source, target } = event.operation
      if (!source || !target) return

      // Only handle item moves (not column reorder) during dragOver
      if (source.type === "item") {
        setBoard((prev) => {
          const currentMap: Record<string, string[]> = {}
          prev.columns.forEach((col) => {
            currentMap[col.id] = [...col.cardIds]
          })

          const newMap = move(currentMap, event)
          if (!newMap) return prev

          return {
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              cardIds: newMap[col.id] || col.cardIds,
            })),
          }
        })
      }
    },
    [setBoard]
  )

  const handleDragEnd = useCallback(
    (event: any) => {
      const { canceled, source, target } = event.operation
      if (canceled) return

      // Column reorder
      if (source?.type === "column" && target) {
        const { initialIndex, index } = source.sortable
        if (initialIndex !== index) {
          setBoard((prev) => {
            const cols = [...prev.columns]
            const [moved] = cols.splice(initialIndex, 1)
            cols.splice(index, 0, moved)
            return { ...prev, columns: cols }
          })
        }
      }
    },
    [setBoard]
  )

  const openCard = (card: Card) => {
    setSelectedCard(card)
    setDialogOpen(true)
  }

  const filteredCardIds = useCallback(
    (cardIds: string[]) => {
      return cardIds.filter((id) => {
        const card = board.cards[id]
        if (!card) return false
        if (filterLabel && !card.labels.some((l) => l.id === filterLabel))
          return false
        if (
          filterAssignee &&
          !card.assignees.some((a) => a.id === filterAssignee)
        )
          return false
        return true
      })
    },
    [board.cards, filterLabel, filterAssignee]
  )

  // Keep selectedCard in sync with board state
  const liveSelectedCard = selectedCard
    ? board.cards[selectedCard.id] || null
    : null

  return (
    <div className="flex h-screen flex-col bg-background">
      <BoardHeader
        title={board.title}
        onTitleChange={setBoardTitle}
        onAddColumn={addColumn}
        allAssignees={allAssignees}
        filterLabel={filterLabel}
        filterAssignee={filterAssignee}
        onFilterLabel={setFilterLabel}
        onFilterAssignee={setFilterAssignee}
      />

      <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full items-start gap-4 p-6">
            {board.columns.map((col, colIndex) => {
              const visibleIds = filteredCardIds(col.cardIds)
              const visibleCards = visibleIds
                .map((id) => board.cards[id])
                .filter(Boolean)
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
              )
            })}
            <AddColumnInline onAddColumn={addColumn} />
          </div>
        </div>
      </DragDropProvider>

      <CardDetailDialog
        card={liveSelectedCard}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={updateCard}
        onDelete={deleteCard}
        onAddAssignee={addAssignee}
        labels={board.labels}
        onAddLabel={addLabel}
        onUpdateLabel={updateLabel}
        onDeleteLabel={deleteLabel}
      />
    </div>
  )
}
