import { useCallback, useMemo } from "react";
import {
  BoardState,
  Card,
  ASSIGNEE_COLORS,
  BoardBackground,
  Activity,
} from "@/types/board";
import { useBoardQuery, useUpdateBoardMutation } from "./useTanstackQuery";
import { DEFAULT_COLUMN_COLORS } from "@/constants/app";

let idCounter = Date.now();
function genId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

export function useBoardForProject(projectId: string) {
  const { data: board, isLoading } = useBoardQuery(projectId);
  const updateBoardMutation = useUpdateBoardMutation(projectId);

  const setBoard = useCallback(
    (updater: BoardState | ((prev: BoardState) => BoardState)) => {
      if (!board) return;
      const nextBoard =
        typeof updater === "function" ? updater(board) : updater;
      updateBoardMutation.mutate(nextBoard);
    },
    [board, updateBoardMutation],
  );

  const setBoardTitle = useCallback(
    (title: string) => {
      setBoard((prev) => ({ ...prev, title }));
    },
    [setBoard],
  );

  const addColumn = useCallback(
    (title: string) => {
      setBoard((prev) => ({
        ...prev,
        columns: [
          ...prev.columns,
          {
            id: genId("col"),
            title,
            color: DEFAULT_COLUMN_COLORS[prev.columns.length % DEFAULT_COLUMN_COLORS.length],
            cardIds: [],
          },
        ],
      }));
    },
    [setBoard],
  );

  const renameColumn = useCallback(
    (colId: string, title: string) => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === colId ? { ...c, title } : c,
        ),
      }));
    },
    [setBoard],
  );

  const setColumnColor = useCallback(
    (colId: string, color: string) => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === colId ? { ...c, color } : c,
        ),
      }));
    },
    [setBoard],
  );

  const copyColumn = useCallback(
    (colId: string) => {
      setBoard((prev) => {
        const col = prev.columns.find((c) => c.id === colId);
        if (!col) return prev;

        const newColId = genId("col");
        const newCardIds: string[] = [];
        const newCards = { ...prev.cards };

        col.cardIds.forEach((cardId) => {
          const card = prev.cards[cardId];
          if (card) {
            const newCardId = genId("card");
            newCardIds.push(newCardId);
            newCards[newCardId] = { ...card, id: newCardId };
          }
        });

        const newColumn = {
          ...col,
          id: newColId,
          title: `${col.title} (Copy)`,
          cardIds: newCardIds,
        };

        const colIndex = prev.columns.findIndex((c) => c.id === colId);
        const newColumns = [...prev.columns];
        newColumns.splice(colIndex + 1, 0, newColumn);

        return {
          ...prev,
          columns: newColumns,
          cards: newCards,
        };
      });
    },
    [setBoard],
  );

  const moveAllCards = useCallback(
    (fromColId: string, toColId: string) => {
      setBoard((prev) => {
        const fromCol = prev.columns.find((c) => c.id === fromColId);
        if (!fromCol || fromColId === toColId) return prev;

        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === fromColId) {
              return { ...col, cardIds: [] };
            }
            if (col.id === toColId) {
              return { ...col, cardIds: [...col.cardIds, ...fromCol.cardIds] };
            }
            return col;
          }),
        };
      });
    },
    [setBoard],
  );

  const archiveAllCards = useCallback(
    (colId: string) => {
      setBoard((prev) => {
        const col = prev.columns.find((c) => c.id === colId);
        if (!col) return prev;

        const newCards = { ...prev.cards };
        col.cardIds.forEach((id) => delete newCards[id]);

        return {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === colId ? { ...c, cardIds: [] } : c,
          ),
          cards: newCards,
        };
      });
    },
    [setBoard],
  );

  const deleteColumn = useCallback(
    (colId: string) => {
      setBoard((prev) => {
        const col = prev.columns.find((c) => c.id === colId);
        const newCards = { ...prev.cards };
        col?.cardIds.forEach((id) => delete newCards[id]);
        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== colId),
          cards: newCards,
        };
      });
    },
    [setBoard],
  );

  const addCard = useCallback(
    (colId: string, title: string) => {
      const cardId = genId("card");
      const card: Card = {
        id: cardId,
        title,
        description: "",
        labels: [],
        dueDate: null,
        startDate: null,
        dueTime: null,
        startTime: null,
        assignees: [],
        checklist: [],
        completed: false,
      };
      setBoard((prev) => ({
        ...prev,
        cards: { ...prev.cards, [cardId]: card },
        columns: prev.columns.map((c) =>
          c.id === colId ? { ...c, cardIds: [...c.cardIds, cardId] } : c,
        ),
      }));
    },
    [setBoard],
  );

  const updateCard = useCallback(
    (card: Card) => {
      setBoard((prev) => ({
        ...prev,
        cards: { ...prev.cards, [card.id]: card },
      }));
    },
    [setBoard],
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      setBoard((prev) => {
        const newCards = { ...prev.cards };
        delete newCards[cardId];
        return {
          ...prev,
          cards: newCards,
          columns: prev.columns.map((c) => ({
            ...c,
            cardIds: c.cardIds.filter((id) => id !== cardId),
          })),
        };
      });
    },
    [setBoard],
  );

  const addAssignee = useCallback(
    (cardId: string, name: string) => {
      setBoard((prev) => {
        const card = prev.cards[cardId];
        if (!card) return prev;
        const color =
          ASSIGNEE_COLORS[card.assignees.length % ASSIGNEE_COLORS.length];
        return {
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: {
              ...card,
              assignees: [...card.assignees, { id: genId("a"), name, color }],
            },
          },
        };
      });
    },
    [setBoard],
  );

  const moveCard = useCallback(
    (cardId: string, fromColId: string, toColId: string, toIndex: number) => {
      setBoard((prev) => {
        const columns = prev.columns.map((c) => {
          if (c.id === fromColId && fromColId !== toColId) {
            return { ...c, cardIds: c.cardIds.filter((id) => id !== cardId) };
          }
          if (c.id === toColId) {
            const ids = c.cardIds.filter((id) => id !== cardId);
            ids.splice(toIndex, 0, cardId);
            return { ...c, cardIds: ids };
          }
          if (fromColId === toColId && c.id === fromColId) {
            const ids = c.cardIds.filter((id) => id !== cardId);
            ids.splice(toIndex, 0, cardId);
            return { ...c, cardIds: ids };
          }
          return c;
        });
        return { ...prev, columns };
      });
    },
    [setBoard],
  );

  const reorderColumns = useCallback(
    (fromIndex: number, toIndex: number) => {
      setBoard((prev) => {
        const cols = [...prev.columns];
        const [moved] = cols.splice(fromIndex, 1);
        cols.splice(toIndex, 0, moved);
        return { ...prev, columns: cols };
      });
    },
    [setBoard],
  );

  const addLabel = useCallback(
    (name: string, color: string) => {
      const id = genId("label");
      setBoard((prev) => ({
        ...prev,
        labels: [...(prev.labels || []), { id, name, color }],
      }));
      return id;
    },
    [setBoard],
  );

  const updateLabel = useCallback(
    (id: string, name: string, color: string) => {
      const updatedLabel = { id, name, color };
      setBoard((prev) => {
        const newLabels = (prev.labels || []).map((l) =>
          l.id === id ? updatedLabel : l,
        );
        const newCards = { ...prev.cards };
        Object.keys(newCards).forEach((cardId) => {
          const card = newCards[cardId];
          if (card.labels?.some((l) => l.id === id)) {
            newCards[cardId] = {
              ...card,
              labels: card.labels.map((l) => (l.id === id ? updatedLabel : l)),
            };
          }
        });
        return { ...prev, labels: newLabels, cards: newCards };
      });
    },
    [setBoard],
  );

  const deleteLabel = useCallback(
    (labelId: string) => {
      setBoard((prev) => {
        const newLabels = (prev.labels || []).filter((l) => l.id !== labelId);
        const newCards = { ...prev.cards };
        Object.keys(newCards).forEach((cardId) => {
          const card = newCards[cardId];
          if (card.labels?.some((l) => l.id === labelId)) {
            newCards[cardId] = {
              ...card,
              labels: card.labels.filter((l) => l.id !== labelId),
            };
          }
        });
        return { ...prev, labels: newLabels, cards: newCards };
      });
    },
    [setBoard],
  );

  const setBoardBackground = useCallback(
    (background: BoardBackground) => {
      setBoard((prev) => ({ ...prev, background }));
    },
    [setBoard],
  );

  const archiveCard = useCallback(
    (cardId: string) => {
      setBoard((prev) => {
        const card = prev.cards[cardId];
        if (!card) return prev;
        const { [cardId]: _, ...remainingCards } = prev.cards;
        const activity: Activity = {
          id: genId("activity"),
          type: "delete",
          user: "User",
          description: `Archived card "${card.title}"`,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          cards: remainingCards,
          archivedCards: { ...prev.archivedCards, [cardId]: card },
          activities: [...prev.activities, activity],
          columns: prev.columns.map((c) => ({
            ...c,
            cardIds: c.cardIds.filter((id) => id !== cardId),
          })),
        };
      });
    },
    [setBoard],
  );

  const restoreCard = useCallback(
    (cardId: string) => {
      setBoard((prev) => {
        const card = prev.archivedCards[cardId];
        if (!card) return prev;
        const { [cardId]: _, ...remainingArchived } = prev.archivedCards;
        const firstColumn = prev.columns[0];
        const activity: Activity = {
          id: genId("activity"),
          type: "create",
          user: "User",
          description: `Restored card "${card.title}"`,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          cards: { ...prev.cards, [cardId]: card },
          archivedCards: remainingArchived,
          activities: [...prev.activities, activity],
          columns: firstColumn
            ? prev.columns.map((c, i) =>
                i === 0 ? { ...c, cardIds: [...c.cardIds, cardId] } : c,
              )
            : prev.columns,
        };
      });
    },
    [setBoard],
  );

  const deleteArchivedCard = useCallback(
    (cardId: string) => {
      setBoard((prev) => {
        const { [cardId]: _, ...remainingArchived } = prev.archivedCards;
        return { ...prev, archivedCards: remainingArchived };
      });
    },
    [setBoard],
  );

  const addActivity = useCallback(
    (activity: Omit<Activity, "id" | "createdAt">) => {
      setBoard((prev) => ({
        ...prev,
        activities: [
          ...prev.activities,
          {
            ...activity,
            id: genId("activity"),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    [setBoard],
  );

  const labels = useMemo(() => board?.labels || [], [board?.labels]);

  return {
    board: board!,
    isLoading,
    setBoard,
    setBoardTitle,
    addColumn,
    renameColumn,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderColumns,
    addAssignee,
    addLabel,
    updateLabel,
    deleteLabel,
    setColumnColor,
    copyColumn,
    moveAllCards,
    archiveAllCards,
    setBoardBackground,
    archiveCard,
    restoreCard,
    deleteArchivedCard,
    addActivity,
    labels,
  };
}
