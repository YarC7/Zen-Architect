import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { boardKeys } from "@/hooks/useTanstackQuery";
import type { BoardState, Card, Column, Label } from "@/types/board";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const supabase = createClient();

type PgPayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

/**
 * Hook to subscribe to real-time changes for a specific project board.
 *
 * Strategy:
 * - Tables WITH project_id (columns, cards, labels): filter server-side
 * - Join tables WITHOUT project_id (card_labels, card_assignees, checklist_items):
 *   filter client-side by checking if relevant card_id belongs to the current board
 * - Instead of invalidateQueries (full refetch), we PATCH the TanStack cache
 *   directly from the realtime payload. Fallback to invalidation only when
 *   the patch cannot be applied cleanly.
 */
export function useBoardRealtime(projectKey: string) {
  const queryClient = useQueryClient();
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Debounced full refetch — only used as a fallback when cache patching
   * is impossible (e.g., INSERT on join tables where we need joined data).
   */
  const invalidateFallback = useCallback(() => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: boardKeys.detail(projectKey),
      });
    }, 500);
  }, [projectKey, queryClient]);

  /**
   * Read the current board from TanStack cache (no network).
   */
  const getBoard = useCallback(
    (): BoardState | undefined =>
      queryClient.getQueryData<BoardState>(boardKeys.detail(projectKey)),
    [projectKey, queryClient],
  );

  /**
   * Write directly to TanStack cache — zero API calls.
   */
  const patchBoard = useCallback(
    (updater: (prev: BoardState) => BoardState) => {
      const current = getBoard();
      if (!current) return;
      queryClient.setQueryData(boardKeys.detail(projectKey), updater(current));
    },
    [getBoard, projectKey, queryClient],
  );

  // ─── Column handlers ──────────────────────────────────────────────
  const handleColumn = useCallback(
    (payload: PgPayload) => {
      const { eventType } = payload;
      const rec = (payload.new ?? payload.old) as Record<string, unknown>;
      if (!rec?.id) return;

      if (eventType === "DELETE" || rec.deleted_at) {
        patchBoard((b) => ({
          ...b,
          columns: b.columns.filter((c) => c.id !== rec.id),
        }));
        return;
      }

      const col: Column = {
        id: rec.id as string,
        title: (rec.title as string) ?? "",
        color: (rec.color as string) ?? "",
        cardIds: [], // will be filled below
      };

      patchBoard((b) => {
        const idx = b.columns.findIndex((c) => c.id === col.id);
        if (idx === -1) {
          // INSERT — new column, append at position
          const pos = (rec.position as number) ?? b.columns.length;
          const cols = [...b.columns];
          cols.splice(pos, 0, { ...col, cardIds: [] });
          return { ...b, columns: cols };
        }
        // UPDATE — keep existing cardIds but update metadata
        const cols = b.columns.map((c) =>
          c.id === col.id ? { ...c, title: col.title, color: col.color } : c,
        );
        return { ...b, columns: cols };
      });
    },
    [patchBoard],
  );

  // ─── Card handlers ─────────────────────────────────────────────────
  const handleCard = useCallback(
    (payload: PgPayload) => {
      const { eventType } = payload;
      const rec = (payload.new ?? payload.old) as Record<string, unknown>;
      if (!rec?.id) return;
      const cardId = rec.id as string;

      // Soft-deleted or hard-deleted
      if (eventType === "DELETE" || rec.deleted_at) {
        patchBoard((b) => {
          const { [cardId]: _, ...rest } = b.cards;
          return {
            ...b,
            cards: rest,
            columns: b.columns.map((c) => ({
              ...c,
              cardIds: c.cardIds.filter((id) => id !== cardId),
            })),
          };
        });
        return;
      }

      patchBoard((b) => {
        const existing = b.cards[cardId];
        const colId = rec.column_id as string;
        const isArchived = rec.is_archived as boolean;

        // Build a partial card from DB payload — preserve client-only fields
        const updatedCard: Card = {
          ...(existing ?? {
            id: cardId,
            labels: [],
            assignees: [],
            checklist: [],
            activities: [],
            comments: [],
          }),
          id: cardId,
          title: (rec.title as string) ?? existing?.title ?? "",
          description:
            (rec.description as string) ?? existing?.description ?? "",
          completed: (rec.completed as boolean) ?? existing?.completed ?? false,
          startDate: (rec.start_date as string | null) ?? null,
          dueDate: (rec.due_date as string | null) ?? null,
          startTime: (rec.start_time as string | null) ?? null,
          dueTime: (rec.due_time as string | null) ?? null,
        };

        let cards = { ...b.cards };
        let archivedCards = { ...b.archivedCards };
        let columns = b.columns;

        if (isArchived) {
          // Move to archived
          delete cards[cardId];
          archivedCards[cardId] = updatedCard;
          columns = columns.map((c) => ({
            ...c,
            cardIds: c.cardIds.filter((id) => id !== cardId),
          }));
        } else {
          // Active card
          delete archivedCards[cardId];
          cards[cardId] = updatedCard;

          // Ensure card is in the correct column
          const pos = (rec.position as number) ?? 0;
          columns = columns.map((c) => {
            const withoutCard = c.cardIds.filter((id) => id !== cardId);
            if (c.id === colId) {
              const ids = [...withoutCard];
              ids.splice(Math.min(pos, ids.length), 0, cardId);
              return { ...c, cardIds: ids };
            }
            return { ...c, cardIds: withoutCard };
          });
        }

        return { ...b, cards, archivedCards, columns };
      });
    },
    [patchBoard],
  );

  // ─── Label handlers ────────────────────────────────────────────────
  const handleLabel = useCallback(
    (payload: PgPayload) => {
      const { eventType } = payload;
      const rec = (payload.new ?? payload.old) as Record<string, unknown>;
      if (!rec?.id) return;

      if (eventType === "DELETE" || rec.deleted_at) {
        const labelId = rec.id as string;
        patchBoard((b) => ({
          ...b,
          labels: b.labels.filter((l) => l.id !== labelId),
          cards: Object.fromEntries(
            Object.entries(b.cards).map(([id, card]) => [
              id,
              {
                ...card,
                labels: card.labels.filter((l) => l.id !== labelId),
              },
            ]),
          ),
        }));
        return;
      }

      const label: Label = {
        id: rec.id as string,
        name: (rec.name as string) ?? "",
        color: (rec.color as string) ?? "",
      };

      patchBoard((b) => {
        const idx = b.labels.findIndex((l) => l.id === label.id);
        const labels =
          idx === -1
            ? [...b.labels, label]
            : b.labels.map((l) => (l.id === label.id ? label : l));

        // Also update label data embedded in cards
        const cards = Object.fromEntries(
          Object.entries(b.cards).map(([id, card]) => [
            id,
            {
              ...card,
              labels: card.labels.map((l) =>
                l.id === label.id ? label : l,
              ),
            },
          ]),
        );

        return { ...b, labels, cards };
      });
    },
    [patchBoard],
  );

  // ─── Join table handlers (no project_id — client-side filter) ──────

  /**
   * For card_labels, card_assignees, checklist_items:
   * We check if the card_id in the payload belongs to the current board.
   * If yes, fallback to invalidation because we need joined data
   * (e.g., profile info for assignees, label info for card_labels).
   */
  const handleJoinTable = useCallback(
    (payload: PgPayload) => {
      const rec = (payload.new ?? payload.old) as Record<string, unknown>;
      const cardId = rec?.card_id as string | undefined;
      if (!cardId) return;

      const board = getBoard();
      if (!board) return;

      // Check if this card belongs to the current project
      const belongsToProject =
        cardId in board.cards || cardId in board.archivedCards;

      if (belongsToProject) {
        invalidateFallback();
      }
      // If card doesn't belong to this project, ignore silently
    },
    [getBoard, invalidateFallback],
  );

  // ─── Subscription setup ────────────────────────────────────────────
  useEffect(() => {
    if (!projectKey) return;

    const abortController = new AbortController();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      // Resolve project key → UUID
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("key", projectKey)
        .single();

      if (abortController.signal.aborted || !project) return;
      const projectId = project.id;

      const channelName = `board:${projectKey}:${Date.now()}`;

      channel = supabase
        .channel(channelName)
        // --- Tables WITH project_id: server-side filter ---
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "columns",
            filter: `project_id=eq.${projectId}`,
          },
          handleColumn,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cards",
            filter: `project_id=eq.${projectId}`,
          },
          handleCard,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "labels",
            filter: `project_id=eq.${projectId}`,
          },
          handleLabel,
        )
        // --- Join tables WITHOUT project_id: client-side filter ---
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "card_labels",
          },
          handleJoinTable,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "card_assignees",
          },
          handleJoinTable,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "checklist_items",
          },
          handleJoinTable,
        )
        .subscribe();
    }

    setup();

    return () => {
      abortController.abort();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [
    projectKey,
    handleColumn,
    handleCard,
    handleLabel,
    handleJoinTable,
    invalidateFallback,
  ]);
}
