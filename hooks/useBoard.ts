import { useState, useEffect, useCallback } from 'react';
import { BoardState, Card, Column, DEFAULT_BOARD, ASSIGNEE_COLORS, Label } from '@/types/board';

const STORAGE_KEY = 'trello-board-state';

function loadBoard(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure labels array exists for legacy data
      if (!parsed.labels) parsed.labels = DEFAULT_BOARD.labels;
      return parsed;
    }
  } catch {}
  return DEFAULT_BOARD;
}

function saveBoard(state: BoardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let idCounter = Date.now();
function genId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

export function useBoard() {
  const [board, setBoard] = useState<BoardState>(loadBoard);

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const setBoardTitle = useCallback((title: string) => {
    setBoard(prev => ({ ...prev, title }));
  }, []);

  const addColumn = useCallback((title: string) => {
    const colors = ['199 89% 48%', '25 95% 53%', '262 83% 58%', '142 71% 45%', '330 81% 60%'];
    setBoard(prev => ({
      ...prev,
      columns: [...prev.columns, {
        id: genId('col'),
        title,
        color: colors[prev.columns.length % colors.length],
        cardIds: [],
      }],
    }));
  }, []);

  const renameColumn = useCallback((colId: string, title: string) => {
    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === colId ? { ...c, title } : c),
    }));
  }, []);

  const deleteColumn = useCallback((colId: string) => {
    setBoard(prev => {
      const col = prev.columns.find(c => c.id === colId);
      const newCards = { ...prev.cards };
      col?.cardIds.forEach(id => delete newCards[id]);
      return {
        ...prev,
        columns: prev.columns.filter(c => c.id !== colId),
        cards: newCards,
      };
    });
  }, []);

  const addCard = useCallback((colId: string, title: string) => {
    const cardId = genId('card');
    const card: Card = { id: cardId, title, description: '', labels: [], dueDate: null, startDate: null, dueTime: null, startTime: null, assignees: [], checklist: [], completed: false };
    setBoard(prev => ({
      ...prev,
      cards: { ...prev.cards, [cardId]: card },
      columns: prev.columns.map(c => c.id === colId ? { ...c, cardIds: [...c.cardIds, cardId] } : c),
    }));
  }, []);

  const updateCard = useCallback((card: Card) => {
    setBoard(prev => ({ ...prev, cards: { ...prev.cards, [card.id]: card } }));
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    setBoard(prev => {
      const newCards = { ...prev.cards };
      delete newCards[cardId];
      return {
        ...prev,
        cards: newCards,
        columns: prev.columns.map(c => ({
          ...c,
          cardIds: c.cardIds.filter(id => id !== cardId),
        })),
      };
    });
  }, []);

  const moveCard = useCallback((cardId: string, fromColId: string, toColId: string, toIndex: number) => {
    setBoard(prev => {
      const columns = prev.columns.map(c => {
        if (c.id === fromColId && fromColId !== toColId) {
          return { ...c, cardIds: c.cardIds.filter(id => id !== cardId) };
        }
        if (c.id === toColId) {
          const ids = c.cardIds.filter(id => id !== cardId);
          ids.splice(toIndex, 0, cardId);
          return { ...c, cardIds: ids };
        }
        if (fromColId === toColId && c.id === fromColId) {
          const ids = c.cardIds.filter(id => id !== cardId);
          ids.splice(toIndex, 0, cardId);
          return { ...c, cardIds: ids };
        }
        return c;
      });
      return { ...prev, columns };
    });
  }, []);

  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setBoard(prev => {
      const cols = [...prev.columns];
      const [moved] = cols.splice(fromIndex, 1);
      cols.splice(toIndex, 0, moved);
      return { ...prev, columns: cols };
    });
  }, []);

  const addAssignee = useCallback((cardId: string, name: string) => {
    setBoard(prev => {
      const card = prev.cards[cardId];
      if (!card) return prev;
      const color = ASSIGNEE_COLORS[card.assignees.length % ASSIGNEE_COLORS.length];
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            ...card,
            assignees: [...card.assignees, { id: genId('a'), name, color }],
          },
        },
      };
    });
  }, []);

  const addLabel = useCallback((name: string, color: string) => {
    const id = genId('label');
    setBoard(prev => ({
      ...prev,
      labels: [...(prev.labels || []), { id, name, color }]
    }));
    return id;
  }, []);

  const updateLabel = useCallback((id: string, name: string, color: string) => {
    const updatedLabel = { id, name, color };
    setBoard(prev => {
      const newLabels = (prev.labels || []).map(l => l.id === id ? updatedLabel : l);
      const newCards = { ...prev.cards };
      Object.keys(newCards).forEach(cardId => {
        const card = newCards[cardId];
        if (card.labels?.some(l => l.id === id)) {
          newCards[cardId] = {
            ...card,
            labels: card.labels.map(l => l.id === id ? updatedLabel : l)
          };
        }
      });
      return { ...prev, labels: newLabels, cards: newCards };
    });
  }, []);

  const deleteLabel = useCallback((labelId: string) => {
    setBoard(prev => {
      const newLabels = (prev.labels || []).filter(l => l.id !== labelId);
      const newCards = { ...prev.cards };
      Object.keys(newCards).forEach(cardId => {
        const card = newCards[cardId];
        if (card.labels?.some(l => l.id === labelId)) {
          newCards[cardId] = {
            ...card,
            labels: card.labels.filter(l => l.id !== labelId)
          };
        }
      });
      return { ...prev, labels: newLabels, cards: newCards };
    });
  }, []);

  return {
    board,
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
    labels: board.labels,
  };
}
