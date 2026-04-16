import { ActivityLoggingJob } from "@/types/queue";

/**
 * Hook to enqueue activity logging jobs
 * Non-blocking, fires and forgets
 */
export function useActivityQueue() {
  const logActivity = async (
    projectId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ) => {
    try {
      const payload: ActivityLoggingJob = {
        type: "activity_logging",
        projectId,
        userId: null, // Can be set from auth context if needed
        action,
        entityType,
        entityId,
        metadata,
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
