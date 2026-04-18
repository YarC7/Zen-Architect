import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BoardState,
  Card,
  Label,
  ASSIGNEE_COLORS,
  BoardBackground,
  Activity,
} from "@/types/board";
import { useBoardQuery, boardKeys } from "./useTanstackQuery";
import { useUser } from "./useUser";
import { DEFAULT_COLUMN_COLORS } from "@/constants/app";
import * as db from "./useBoardMutations";

function genId(): string {
  return uuidv4();
}

/**
 * Granular mutations board hook.
 *
 * Each action:
 * 1. Snapshots current cache (for rollback)
 * 2. Patches cache optimistically (instant UI)
 * 3. Fires targeted DB write(s) in the background
 * 4. On DB error → rollback cache + toast
 *
 * No more debounce. No more full-board save.
 */
export function useBoardForProject(projectKey: string) {
  const queryClient = useQueryClient();
  const { data: board, isLoading, isError, error } = useBoardQuery(projectKey);
  const { profile } = useUser();
  const userName = profile?.full_name || profile?.username || "User";

  // ─── Cache helpers ───────────────────────────────────────────────

  const getBoard = useCallback(
    (): BoardState | undefined =>
      queryClient.getQueryData<BoardState>(boardKeys.detail(projectKey)),
    [queryClient, projectKey],
  );

  const patchBoard = useCallback(
    (updater: (prev: BoardState) => BoardState) => {
      const current = getBoard();
      if (!current) return;
      queryClient.setQueryData(boardKeys.detail(projectKey), updater(current));
    },
    [getBoard, queryClient, projectKey],
  );

  const rollback = useCallback(
    (snapshot: BoardState | undefined) => {
      if (!snapshot) return;
      queryClient.setQueryData(boardKeys.detail(projectKey), snapshot);
      toast.error("Lỗi lưu dữ liệu. Đã hoàn tác thay đổi.");
    },
    [queryClient, projectKey],
  );

  /**
   * Fire-and-forget DB write with auto-rollback.
   * Activities are persisted separately (non-critical).
   */
  const persist = useCallback(
    (
      snapshot: BoardState | undefined,
      fn: () => Promise<void>,
      activities?: Activity[],
    ) => {
      const pid = snapshot?.projectId;
      fn().catch((err) => {
        console.error("DB persist error:", err);
        rollback(snapshot);
      });
      // Activities: fire-and-forget, never rollback on failure
      if (activities && pid) {
        activities.forEach((a) =>
          db
            .dbInsertActivity({
              id: a.id,
              project_id: pid,
              card_id: null,
              type: a.type,
              description: a.description,
              user_id: a.userId || snapshot?.ownerId || "",
              created_at: a.createdAt,
            })
            .catch(() => {}),
        );
      }
    },
    [rollback],
  );

  // ─── setBoard (kept for DnD / external callers) ──────────────────

  const setBoard = useCallback(
    (updater: BoardState | ((prev: BoardState) => BoardState)) => {
      const current = getBoard();
      if (!current) return;
      const next =
        typeof updater === "function" ? updater(current) : updater;
      queryClient.setQueryData(boardKeys.detail(projectKey), next);
    },
    [getBoard, projectKey, queryClient],
  );

  // ─── Project ─────────────────────────────────────────────────────

  const setBoardTitle = useCallback(
    (title: string) => {
      const snap = getBoard();
      patchBoard((b) => ({ ...b, title }));
      persist(snap, () => db.dbUpdateProject(snap!.projectId, { title }));
    },
    [getBoard, patchBoard, persist],
  );

  const setBoardBackground = useCallback(
    (background: BoardBackground) => {
      const snap = getBoard();
      patchBoard((b) => ({ ...b, background }));
      persist(snap, () =>
        db.dbUpdateProject(snap!.projectId, {
          background_type: background.type,
          background_value: background.value,
        }),
      );
    },
    [getBoard, patchBoard, persist],
  );

  // ─── Columns ─────────────────────────────────────────────────────

  const addColumn = useCallback(
    (title: string) => {
      const snap = getBoard();
      if (!snap) return;
      const colId = genId();
      const color =
        DEFAULT_COLUMN_COLORS[
          snap.columns.length % DEFAULT_COLUMN_COLORS.length
        ];
      const position = snap.columns.length;

      patchBoard((b) => ({
        ...b,
        columns: [...b.columns, { id: colId, title, color, cardIds: [] }],
      }));

      persist(snap, () =>
        db.dbInsertColumn({
          id: colId,
          project_id: snap.projectId,
          title,
          color,
          position,
          owner_id: snap.ownerId || "",
        }),
      );
    },
    [getBoard, patchBoard, persist],
  );

  const renameColumn = useCallback(
    (colId: string, title: string) => {
      const snap = getBoard();
      if (!snap) return;
      const oldCol = snap.columns.find((c) => c.id === colId);
      const activity: Activity = {
        id: genId(),
        type: "update",
        user: userName,
        userId: profile?.id,
        description: `Đã đổi tên cột "${oldCol?.title}" thành "${title}"`,
        createdAt: new Date().toISOString(),
      };

      patchBoard((b) => ({
        ...b,
        columns: b.columns.map((c) =>
          c.id === colId ? { ...c, title } : c,
        ),
        activities: [activity, ...(b.activities || [])],
      }));

      persist(
        snap,
        () => db.dbUpdateColumn(colId, { title }),
        [activity],
      );
    },
    [getBoard, patchBoard, persist, userName, profile?.id],
  );

  const setColumnColor = useCallback(
    (colId: string, color: string) => {
      const snap = getBoard();
      patchBoard((b) => ({
        ...b,
        columns: b.columns.map((c) =>
          c.id === colId ? { ...c, color } : c,
        ),
      }));
      persist(snap, () => db.dbUpdateColumn(colId, { color }));
    },
    [getBoard, patchBoard, persist],
  );

  const copyColumn = useCallback(
    (colId: string) => {
      const snap = getBoard();
      if (!snap) return;
      const col = snap.columns.find((c) => c.id === colId);
      if (!col) return;

      const newColId = genId();
      const newCardPairs: { oldId: string; newId: string }[] = [];
      const newCards: Record<string, Card> = {};

      col.cardIds.forEach((cardId) => {
        const card = snap.cards[cardId];
        if (card) {
          const newCardId = genId();
          newCardPairs.push({ oldId: cardId, newId: newCardId });
          newCards[newCardId] = { ...card, id: newCardId };
        }
      });

      const newColumn = {
        ...col,
        id: newColId,
        title: `${col.title} (Copy)`,
        cardIds: newCardPairs.map((p) => p.newId),
      };

      patchBoard((b) => {
        const colIndex = b.columns.findIndex((c) => c.id === colId);
        const cols = [...b.columns];
        cols.splice(colIndex + 1, 0, newColumn);
        return { ...b, columns: cols, cards: { ...b.cards, ...newCards } };
      });

      persist(snap, async () => {
        await db.dbInsertColumn({
          id: newColId,
          project_id: snap.projectId,
          title: newColumn.title,
          color: col.color,
          position: snap.columns.findIndex((c) => c.id === colId) + 1,
          owner_id: snap.ownerId || "",
        });
        // Insert copied cards in parallel
        await Promise.all(
          newCardPairs.map((pair, i) => {
            const srcCard = snap.cards[pair.oldId];
            return db.dbInsertCard({
              id: pair.newId,
              project_id: snap.projectId,
              column_id: newColId,
              title: srcCard.title,
              description: srcCard.description,
              completed: srcCard.completed,
              position: i,
              owner_id: snap.ownerId || "",
            });
          }),
        );
        // Reorder columns after the new one
        const reorders = snap.columns
          .filter(
            (_, i) => i > snap.columns.findIndex((c) => c.id === colId),
          )
          .map((c, i) => ({
            id: c.id,
            position:
              snap.columns.findIndex((col) => col.id === colId) + 2 + i,
          }));
        if (reorders.length > 0) await db.dbReorderColumns(reorders);
      });
    },
    [getBoard, patchBoard, persist],
  );

  const moveAllCards = useCallback(
    (fromColId: string, toColId: string) => {
      const snap = getBoard();
      if (!snap) return;
      const fromCol = snap.columns.find((c) => c.id === fromColId);
      if (!fromCol || fromColId === toColId) return;

      const movedCardIds = fromCol.cardIds;
      const toCol = snap.columns.find((c) => c.id === toColId);
      const basePosition = toCol?.cardIds.length || 0;

      patchBoard((b) => ({
        ...b,
        columns: b.columns.map((col) => {
          if (col.id === fromColId) return { ...col, cardIds: [] };
          if (col.id === toColId)
            return { ...col, cardIds: [...col.cardIds, ...movedCardIds] };
          return col;
        }),
      }));

      persist(snap, () =>
        db.dbBatchUpdateCards(
          movedCardIds.map((id, i) => ({
            id,
            column_id: toColId,
            position: basePosition + i,
          })),
        ),
      );
    },
    [getBoard, patchBoard, persist],
  );

  const archiveAllCards = useCallback(
    (colId: string) => {
      const snap = getBoard();
      if (!snap) return;
      const col = snap.columns.find((c) => c.id === colId);
      if (!col) return;

      const cardIds = col.cardIds;

      patchBoard((b) => {
        const newCards = { ...b.cards };
        const newArchived = { ...b.archivedCards };
        cardIds.forEach((id) => {
          if (newCards[id]) {
            newArchived[id] = { ...newCards[id] };
            delete newCards[id];
          }
        });
        return {
          ...b,
          columns: b.columns.map((c) =>
            c.id === colId ? { ...c, cardIds: [] } : c,
          ),
          cards: newCards,
          archivedCards: newArchived,
        };
      });

      persist(snap, () =>
        db.dbBatchUpdateCards(
          cardIds.map((id) => ({
            id,
            column_id: colId,
            position: 0,
          })),
        ).then(() =>
          Promise.all(
            cardIds.map((id) =>
              db.dbUpdateCard(id, { is_archived: true }),
            ),
          ).then(() => {}),
        ),
      );
    },
    [getBoard, patchBoard, persist],
  );

  const deleteColumn = useCallback(
    (colId: string) => {
      const snap = getBoard();
      if (!snap) return;
      const col = snap.columns.find((c) => c.id === colId);
      const cardIds = col?.cardIds || [];

      patchBoard((b) => {
        const newCards = { ...b.cards };
        cardIds.forEach((id) => delete newCards[id]);
        return {
          ...b,
          columns: b.columns.filter((c) => c.id !== colId),
          cards: newCards,
        };
      });

      persist(snap, async () => {
        await db.dbDeleteColumn(colId);
        if (cardIds.length > 0) await db.dbDeleteCards(cardIds);
      });
    },
    [getBoard, patchBoard, persist],
  );

  // ─── Cards ───────────────────────────────────────────────────────

  const addCard = useCallback(
    (colId: string, title: string) => {
      const snap = getBoard();
      if (!snap) return;

      const cardId = genId();
      const createActivity: Activity = {
        id: genId(),
        type: "create",
        user: userName,
        userId: profile?.id,
        description: `Tạo thẻ "${title}"`,
        createdAt: new Date().toISOString(),
      };
      const boardActivity: Activity = {
        id: genId(),
        type: "create",
        user: userName,
        userId: profile?.id,
        description: `Đã thêm thẻ "${title}" vào cột "${snap.columns.find((c) => c.id === colId)?.title || "Unknown"}"`,
        createdAt: new Date().toISOString(),
      };
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
        activities: [createActivity],
      };

      const position =
        snap.columns.find((c) => c.id === colId)?.cardIds.length ?? 0;

      patchBoard((b) => ({
        ...b,
        cards: { ...b.cards, [cardId]: card },
        columns: b.columns.map((c) =>
          c.id === colId ? { ...c, cardIds: [...c.cardIds, cardId] } : c,
        ),
        activities: [boardActivity, ...(b.activities || [])],
      }));

      persist(
        snap,
        () =>
          db.dbInsertCard({
            id: cardId,
            project_id: snap.projectId,
            column_id: colId,
            title,
            description: "",
            completed: false,
            position,
            owner_id: snap.ownerId || "",
          }),
        [boardActivity],
      );
    },
    [getBoard, patchBoard, persist, userName, profile?.id],
  );

  const updateCard = useCallback(
    (card: Card) => {
      const snap = getBoard();
      if (!snap) return;
      const oldCard = snap.cards[card.id];
      if (!oldCard) return;

      // ─── Activity generation (same logic as before) ───────────
      const generatedActivities: Activity[] = [];

      // Comment
      if ((card.comments?.length || 0) > (oldCard.comments?.length || 0)) {
        const newComment = card.comments![card.comments!.length - 1];
        generatedActivities.push({
          id: genId(),
          type: "comment",
          user: userName,
          userId: profile?.id,
          description: `đã bình luận trên "${card.title}": ${newComment.text}`,
          createdAt: new Date().toISOString(),
        });
      }

      // Completion toggle
      if (card.completed !== oldCard.completed) {
        generatedActivities.push({
          id: genId(),
          type: "update",
          user: userName,
          userId: profile?.id,
          description: card.completed
            ? `đã hoàn thành thẻ "${card.title}"`
            : `đã mở lại thẻ "${card.title}"`,
          createdAt: new Date().toISOString(),
        });
      }

      // Label changes
      const addedLabel = card.labels.find(
        (l) => !oldCard.labels.some((ol) => ol.id === l.id),
      );
      const removedLabel = oldCard.labels.find(
        (ol) => !card.labels.some((l) => l.id === ol.id),
      );
      if (addedLabel || removedLabel) {
        generatedActivities.push({
          id: genId(),
          type: "update",
          user: userName,
          userId: profile?.id,
          description: addedLabel
            ? `đã thêm nhãn "${addedLabel.name}" vào "${card.title}"`
            : `đã xóa nhãn "${removedLabel?.name}" khỏi "${card.title}"`,
          createdAt: new Date().toISOString(),
        });
      }

      // Checklist changes
      const addedCheckItem = card.checklist.find(
        (item) => !oldCard.checklist?.some((oi) => oi.id === item.id),
      );
      const removedCheckItem = oldCard.checklist?.find(
        (oi) => !card.checklist.some((item) => item.id === oi.id),
      );
      const completionChangedItem = card.checklist.find((item) => {
        const oldItem = oldCard.checklist?.find((oi) => oi.id === item.id);
        return oldItem && oldItem.checked !== item.checked;
      });
      if (addedCheckItem || removedCheckItem || completionChangedItem) {
        let desc = "";
        if (addedCheckItem)
          desc = `đã thêm tác vụ "${addedCheckItem.text}" vào danh sách việc cần làm của "${card.title}"`;
        else if (removedCheckItem)
          desc = `đã xóa tác vụ "${removedCheckItem.text}" khỏi "${card.title}"`;
        else if (completionChangedItem)
          desc = completionChangedItem.checked
            ? `đã hoàn thành tác vụ "${completionChangedItem.text}" trong "${card.title}"`
            : `đã mở lại tác vụ "${completionChangedItem.text}" trong "${card.title}"`;
        generatedActivities.push({
          id: genId(),
          type: "update",
          user: userName,
          userId: profile?.id,
          description: desc,
          createdAt: new Date().toISOString(),
        });
      }

      // Assignee changes
      const addedAssignee = card.assignees.find(
        (a) => !oldCard.assignees?.some((oa) => oa.id === a.id),
      );
      const removedAssignee = oldCard.assignees?.find(
        (oa) => !card.assignees.some((a) => a.id === oa.id),
      );
      if (addedAssignee || removedAssignee) {
        generatedActivities.push({
          id: genId(),
          type: "update",
          user: userName,
          userId: profile?.id,
          description: addedAssignee
            ? `đã chỉ định ${addedAssignee.name} vào "${card.title}"`
            : `đã gỡ ${removedAssignee?.name} khỏi "${card.title}"`,
          createdAt: new Date().toISOString(),
        });
      }

      // Date changes
      if (card.dueDate !== oldCard.dueDate || card.startDate !== oldCard.startDate) {
        let desc = "";
        if (card.dueDate !== oldCard.dueDate && card.dueDate)
          desc = `đã đặt ngày hạn cho "${card.title}" là ${card.dueDate}`;
        else if (card.dueDate !== oldCard.dueDate && !card.dueDate)
          desc = `đã gỡ ngày hạn khỏi "${card.title}"`;
        else if (card.startDate !== oldCard.startDate && card.startDate)
          desc = `đã đặt ngày bắt đầu cho "${card.title}" là ${card.startDate}`;
        else if (card.startDate !== oldCard.startDate && !card.startDate)
          desc = `đã gỡ ngày bắt đầu khỏi "${card.title}"`;
        if (desc) {
          generatedActivities.push({
            id: genId(),
            type: "update",
            user: userName,
            userId: profile?.id,
            description: desc,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // ─── Optimistic update ────────────────────────────────────
      const allCardActivities = [
        ...generatedActivities,
        ...(card.activities ?? oldCard.activities ?? []),
      ];

      patchBoard((b) => ({
        ...b,
        cards: {
          ...b.cards,
          [card.id]: { ...card, activities: allCardActivities },
        },
        activities: [...generatedActivities, ...(b.activities || [])],
      }));

      // ─── Granular DB writes ───────────────────────────────────
      const promises: Promise<void>[] = [];

      // 1. Core card fields — always update
      promises.push(
        db.dbUpdateCard(card.id, {
          title: card.title,
          description: card.description,
          completed: card.completed,
          start_date: card.startDate,
          due_date: card.dueDate,
          start_time: card.startTime,
          due_time: card.dueTime,
        }),
      );

      // 2. Labels — only if changed
      const labelsChanged =
        card.labels.length !== oldCard.labels.length ||
        card.labels.some((l) => !oldCard.labels.some((ol) => ol.id === l.id));
      if (labelsChanged) {
        promises.push(
          db.dbSyncCardLabels(
            card.id,
            card.labels.map((l) => l.id),
          ),
        );
      }

      // 3. Assignees — only if changed
      const assigneesChanged =
        card.assignees.length !== oldCard.assignees.length ||
        card.assignees.some(
          (a) => !oldCard.assignees.some((oa) => oa.id === a.id),
        );
      if (assigneesChanged) {
        promises.push(
          db.dbSyncCardAssignees(
            card.id,
            card.assignees.map((a) => a.id),
          ),
        );
      }

      // 4. Checklist — only if changed
      const checklistChanged =
        card.checklist.length !== (oldCard.checklist?.length || 0) ||
        card.checklist.some((item) => {
          const old = oldCard.checklist?.find((oi) => oi.id === item.id);
          return !old || old.text !== item.text || old.checked !== item.checked;
        });
      if (checklistChanged) {
        promises.push(
          db.dbSyncChecklistItems(
            card.id,
            card.checklist,
            snap.ownerId || "",
          ),
        );
      }

      // 5. New comment
      if ((card.comments?.length || 0) > (oldCard.comments?.length || 0)) {
        const newComment = card.comments![card.comments!.length - 1];
        promises.push(
          db.dbInsertActivity({
            id: newComment.id,
            project_id: snap.projectId,
            card_id: card.id,
            type: "comment",
            description: newComment.text,
            user_id:
              newComment.authorId || profile?.id || snap.ownerId || "",
            created_at: newComment.createdAt,
          }).then(() => {})
        );
      }

      // 6. Activities (non-critical, card-level)
      generatedActivities.forEach((a) =>
        db
          .dbInsertActivity({
            id: a.id,
            project_id: snap.projectId,
            card_id: card.id,
            type: a.type,
            description: a.description,
            user_id: a.userId || snap.ownerId || "",
            created_at: a.createdAt,
          })
          .catch(() => {}),
      );

      // Fire all critical writes
      Promise.all(promises).catch((err) => {
        console.error("updateCard DB error:", err);
        rollback(snap);
      });
    },
    [getBoard, patchBoard, rollback, userName, profile?.id],
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      const snap = getBoard();
      if (!snap) return;
      const card = snap.cards[cardId];
      const activity: Activity = {
        id: genId(),
        type: "update",
        user: userName,
        userId: profile?.id,
        description: `Đã xóa thẻ "${card?.title || "không tên"}"`,
        createdAt: new Date().toISOString(),
      };

      patchBoard((b) => {
        const { [cardId]: _, ...rest } = b.cards;
        return {
          ...b,
          cards: rest,
          columns: b.columns.map((c) => ({
            ...c,
            cardIds: c.cardIds.filter((id) => id !== cardId),
          })),
          activities: [activity, ...(b.activities || [])],
        };
      });

      persist(snap, () => db.dbDeleteCard(cardId).then(() => {}), [activity]);
    },
    [getBoard, patchBoard, persist, userName, profile?.id],
  );

  const addAssignee = useCallback(
    (cardId: string, name: string) => {
      const snap = getBoard();
      if (!snap) return;
      const card = snap.cards[cardId];
      if (!card) return;

      const color =
        ASSIGNEE_COLORS[card.assignees.length % ASSIGNEE_COLORS.length];
      const assigneeId = genId();

      patchBoard((b) => ({
        ...b,
        cards: {
          ...b.cards,
          [cardId]: {
            ...b.cards[cardId],
            assignees: [
              ...b.cards[cardId].assignees,
              { id: assigneeId, name, color },
            ],
          },
        },
      }));

      persist(snap, () =>
        db.dbSyncCardAssignees(
          cardId,
          [...card.assignees.map((a) => a.id), assigneeId],
        ),
      );
    },
    [getBoard, patchBoard, persist],
  );

  const moveCard = useCallback(
    (cardId: string, fromColId: string, toColId: string, toIndex: number) => {
      const snap = getBoard();
      if (!snap) return;
      const fromCol = snap.columns.find((c) => c.id === fromColId);
      const toCol = snap.columns.find((c) => c.id === toColId);
      const card = snap.cards[cardId];
      if (!fromCol || !toCol || !card) return;

      // Activity for cross-column move
      const activity: Activity | null =
        fromColId !== toColId
          ? {
              id: genId(),
              type: "move" as const,
              user: userName,
              userId: profile?.id,
              description: `đã chuyển "${card.title}" từ "${fromCol.title}" sang "${toCol.title}"`,
              createdAt: new Date().toISOString(),
            }
          : null;

      patchBoard((b) => {
        const newColumns = b.columns.map((c) => {
          if (c.id === fromColId && fromColId !== toColId) {
            return { ...c, cardIds: c.cardIds.filter((id) => id !== cardId) };
          }
          if (c.id === toColId) {
            const ids = c.cardIds.filter((id) => id !== cardId);
            ids.splice(toIndex, 0, cardId);
            return { ...c, cardIds: ids };
          }
          return c;
        });

        return {
          ...b,
          columns: newColumns,
          cards: {
            ...b.cards,
            [cardId]: {
              ...card,
              activities: activity
                ? [activity, ...(card.activities || [])]
                : card.activities || [],
            },
          },
          activities: activity
            ? [activity, ...(b.activities || [])]
            : b.activities || [],
        };
      });

      // Persist: update moved card + reorder positions in affected columns
      const updatedBoard = getBoard();
      if (!updatedBoard) return;

      const positionUpdates: { id: string; column_id: string; position: number }[] = [];
      const affectedColIds = new Set([fromColId, toColId]);
      updatedBoard.columns
        .filter((c) => affectedColIds.has(c.id))
        .forEach((col) => {
          col.cardIds.forEach((id, i) => {
            positionUpdates.push({ id, column_id: col.id, position: i });
          });
        });

      persist(
        snap,
        () => db.dbBatchUpdateCards(positionUpdates),
        activity ? [activity] : undefined,
      );
    },
    [getBoard, patchBoard, persist, userName, profile?.id],
  );

  const reorderColumns = useCallback(
    (fromIndex: number, toIndex: number) => {
      const snap = getBoard();
      if (!snap) return;

      patchBoard((b) => {
        const cols = [...b.columns];
        const [moved] = cols.splice(fromIndex, 1);
        cols.splice(toIndex, 0, moved);
        return { ...b, columns: cols };
      });

      // Persist new positions
      const updatedBoard = getBoard();
      if (!updatedBoard) return;
      const reorders = updatedBoard.columns.map((c, i) => ({
        id: c.id,
        position: i,
      }));

      persist(snap, () => db.dbReorderColumns(reorders));
    },
    [getBoard, patchBoard, persist],
  );

  // ─── Labels ──────────────────────────────────────────────────────

  const addLabel = useCallback(
    (name: string, color: string, cardToAssign?: Card) => {
      const snap = getBoard();
      if (!snap) return "";
      const id = genId();
      const newLabel: Label = { id, name, color };

      patchBoard((b) => {
        let newCards = b.cards;
        if (cardToAssign) {
          const card = b.cards[cardToAssign.id];
          if (card) {
            newCards = {
              ...b.cards,
              [cardToAssign.id]: {
                ...card,
                labels: [...card.labels, newLabel],
              },
            };
          }
        }
        return { ...b, labels: [...(b.labels || []), newLabel], cards: newCards };
      });

      persist(snap, async () => {
        await db.dbInsertLabel({
          id,
          project_id: snap.projectId,
          name,
          color,
          owner_id: snap.ownerId || "",
        });
        if (cardToAssign) {
          const card = snap.cards[cardToAssign.id];
          if (card) {
            await db.dbSyncCardLabels(cardToAssign.id, [
              ...card.labels.map((l) => l.id),
              id,
            ]);
          }
        }
      });

      return id;
    },
    [getBoard, patchBoard, persist],
  );

  const updateLabel = useCallback(
    (id: string, name: string, color: string) => {
      const snap = getBoard();
      const updatedLabel = { id, name, color };

      patchBoard((b) => {
        const newCards = { ...b.cards };
        Object.keys(newCards).forEach((cardId) => {
          const card = newCards[cardId];
          if (card.labels?.some((l) => l.id === id)) {
            newCards[cardId] = {
              ...card,
              labels: card.labels.map((l) => (l.id === id ? updatedLabel : l)),
            };
          }
        });
        return {
          ...b,
          labels: (b.labels || []).map((l) => (l.id === id ? updatedLabel : l)),
          cards: newCards,
        };
      });

      persist(snap, () => db.dbUpdateLabel(id, { name, color }));
    },
    [getBoard, patchBoard, persist],
  );

  const deleteLabel = useCallback(
    (labelId: string) => {
      const snap = getBoard();

      patchBoard((b) => {
        const newCards = { ...b.cards };
        Object.keys(newCards).forEach((cardId) => {
          const card = newCards[cardId];
          if (card.labels?.some((l) => l.id === labelId)) {
            newCards[cardId] = {
              ...card,
              labels: card.labels.filter((l) => l.id !== labelId),
            };
          }
        });
        return {
          ...b,
          labels: (b.labels || []).filter((l) => l.id !== labelId),
          cards: newCards,
        };
      });

      persist(snap, () => db.dbDeleteLabel(labelId).then(() => {}));
    },
    [getBoard, patchBoard, persist],
  );

  // ─── Archive / Restore ───────────────────────────────────────────

  const archiveCard = useCallback(
    (cardId: string) => {
      const snap = getBoard();
      if (!snap) return;
      const card = snap.cards[cardId];
      if (!card) return;
      const activity: Activity = {
        id: genId(),
        type: "delete",
        user: userName,
        userId: profile?.id,
        description: `Archived card "${card.title}"`,
        createdAt: new Date().toISOString(),
      };

      patchBoard((b) => {
        const { [cardId]: removed, ...rest } = b.cards;
        return {
          ...b,
          cards: rest,
          archivedCards: { ...b.archivedCards, [cardId]: card },
          activities: [activity, ...b.activities],
          columns: b.columns.map((c) => ({
            ...c,
            cardIds: c.cardIds.filter((id) => id !== cardId),
          })),
        };
      });

      persist(
        snap,
        () => db.dbUpdateCard(cardId, { is_archived: true }),
        [activity],
      );
    },
    [getBoard, patchBoard, persist, userName, profile?.id],
  );

  const restoreCard = useCallback(
    (cardId: string) => {
      const snap = getBoard();
      if (!snap) return;
      const card = snap.archivedCards[cardId];
      if (!card) return;
      const firstColId = snap.columns[0]?.id;
      const activity: Activity = {
        id: genId(),
        type: "create",
        user: userName,
        userId: profile?.id,
        description: `Restored card "${card.title}"`,
        createdAt: new Date().toISOString(),
      };

      patchBoard((b) => {
        const { [cardId]: _, ...rest } = b.archivedCards;
        return {
          ...b,
          cards: { ...b.cards, [cardId]: card },
          archivedCards: rest,
          activities: [activity, ...b.activities],
          columns: firstColId
            ? b.columns.map((c, i) =>
                i === 0 ? { ...c, cardIds: [...c.cardIds, cardId] } : c,
              )
            : b.columns,
        };
      });

      persist(
        snap,
        () =>
          db.dbUpdateCard(cardId, {
            is_archived: false,
            column_id: firstColId,
            position: snap.columns[0]?.cardIds.length ?? 0,
          }),
        [activity],
      );
    },
    [getBoard, patchBoard, persist, userName, profile?.id],
  );

  const deleteArchivedCard = useCallback(
    (cardId: string) => {
      const snap = getBoard();
      patchBoard((b) => {
        const { [cardId]: _, ...rest } = b.archivedCards;
        return { ...b, archivedCards: rest };
      });
      persist(snap, () => db.dbDeleteCard(cardId).then(() => {}));
    },
    [getBoard, patchBoard, persist],
  );

  // ─── Activity ────────────────────────────────────────────────────

  const addActivity = useCallback(
    (activity: Omit<Activity, "id" | "createdAt">) => {
      const snap = getBoard();
      if (!snap) return;
      const fullActivity: Activity = {
        ...activity,
        id: genId(),
        createdAt: new Date().toISOString(),
      };

      patchBoard((b) => ({
        ...b,
        activities: [fullActivity, ...b.activities],
      }));

      // Non-critical, no rollback
      db.dbInsertActivity({
        id: fullActivity.id,
        project_id: snap.projectId,
        card_id: null,
        type: fullActivity.type,
        description: fullActivity.description,
        user_id: fullActivity.userId || snap.ownerId || "",
        created_at: fullActivity.createdAt,
      }).catch(() => {});
    },
    [getBoard, patchBoard],
  );

  // ─── Return ──────────────────────────────────────────────────────

  const labels = useMemo(() => board?.labels || [], [board?.labels]);

  return {
    board: board!,
    isLoading,
    isError,
    error,
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
