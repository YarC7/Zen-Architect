import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { boardKeys } from "@/hooks/useTanstackQuery";

const supabase = createClient();

/**
 * Hook to subscribe to real-time changes for a specific project board.
 * Accepts the project `key` (URL slug), resolves to the internal `id`
 * for foreign-key filtering on the related tables.
 *
 * Uses debounced invalidation (200ms) to prevent refetch races during
 * multi-step mutations (e.g., card upsert + junction table upserts).
 */
export function useBoardRealtime(projectKey: string) {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidateDebounced = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: boardKeys.detail(projectKey),
      });
    }, 200);
  }, [projectKey, queryClient]);

  useEffect(() => {
    if (!projectKey) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Resolve project key to its UUID id for foreign-key filters
    supabase
      .from("projects")
      .select("id")
      .eq("key", projectKey)
      .single()
      .then(({ data: project }: { data: { id: string } | null }) => {
        if (cancelled || !project) return;
        const projectId = project.id;

        channel = supabase
          .channel(`project:${projectKey}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cards",
              filter: `project_id=eq.${projectId}`,
            },
            invalidateDebounced,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "columns",
              filter: `project_id=eq.${projectId}`,
            },
            invalidateDebounced,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "checklist_items",
            },
            invalidateDebounced,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "labels",
              filter: `project_id=eq.${projectId}`,
            },
            invalidateDebounced,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "card_labels",
              filter: `project_id=eq.${projectId}`,
            },
            invalidateDebounced,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "card_assignees",
              filter: `project_id=eq.${projectId}`,
            },
            invalidateDebounced,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "card_comments",
              filter: `project_id=eq.${projectId}`,
            },
            invalidateDebounced,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "activities",
              filter: `project_id=eq.${projectId}`,
            },
            invalidateDebounced,
          )
          .subscribe();
      });

    return () => {
      cancelled = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [projectKey, invalidateDebounced]);
}
