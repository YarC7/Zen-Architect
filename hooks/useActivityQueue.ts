import { ActivityLoggingJob } from "@/types/queue";

/**
 * Hook to enqueue activity logging jobs
 * Non-blocking, fires and forgets
 */
export function useActivityQueue() {
  const logActivity = async (
    projectId: string,
    type: "create" | "update" | "delete" | "move" | "comment",
    description: string,
    cardId?: string | null,
  ) => {
    try {
      const payload: ActivityLoggingJob = {
        projectId,
        cardId: cardId || null,
        userId: null, // Can be set from auth context if needed
        type,
        description,
      };

      // Fire and forget - don't wait for response
      fetch("/api/queue/enqueue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queue: "activity_logging",
          payload,
        }),
      }).catch((err) => {
        // Log but don't throw - activity logging should never block user operations
        console.error("[ActivityQueue] Failed to enqueue:", err);
      });
    } catch (error) {
      console.error("[ActivityQueue] Error preparing payload:", error);
    }
  };

  return { logActivity };
}
