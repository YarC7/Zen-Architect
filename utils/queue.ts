import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { QueueJobPayload, QueueName, QueueMessage } from "@/types/queue";

/**
 * Queue utility class for managing pgmq operations
 * Use with server-side code (API routes, Edge Functions, cron jobs)
 */
export class QueueManager {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Enqueue a job to a specific queue
   * @param queueName - Name of the queue (image_processing, activity_logging, notifications)
   * @param payload - Job payload
   * @returns Message ID if successful
   */
  async enqueue(
    queueName: QueueName,
    payload: QueueJobPayload,
  ): Promise<bigint> {
    try {
      const { data, error } = await this.supabase.rpc("pgmq_send", {
        queue_name: queueName,
        msg: payload,
      });

      if (error) {
        throw new Error(`Failed to enqueue job: ${error.message}`);
      }

      console.log(`[Queue] Enqueued job to ${queueName}:`, payload);
      return data as bigint;
    } catch (error) {
      console.error(`[Queue] Error enqueuing to ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Read messages from a queue with visibility timeout
   * @param queueName - Name of the queue
   * @param limit - Number of messages to read (default: 1)
   * @param vt - Visibility timeout in seconds (default: 30)
   * @returns Array of queue messages
   */
  async read(
    queueName: QueueName,
    limit: number = 1,
    vt: number = 30,
  ): Promise<QueueMessage[]> {
    try {
      const { data, error } = await this.supabase.rpc("pgmq_read", {
        queue_name: queueName,
        limit,
        vt,
      });

      if (error) {
        throw new Error(`Failed to read from queue: ${error.message}`);
      }

      return (data || []) as QueueMessage[];
    } catch (error) {
      console.error(`[Queue] Error reading from ${queueName}:`, error);
      return [];
    }
  }

  /**
   * Delete/archive a message from the queue after successful processing
   * @param queueName - Name of the queue
   * @param msgId - Message ID to delete
   */
  async delete(queueName: QueueName, msgId: bigint): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("pgmq_delete", {
        queue_name: queueName,
        msg_id: msgId,
      });

      if (error) {
        throw new Error(`Failed to delete message: ${error.message}`);
      }

      console.log(`[Queue] Deleted message ${msgId} from ${queueName}`);
    } catch (error) {
      console.error(`[Queue] Error deleting message:`, error);
      throw error;
    }
  }

  /**
   * Archive a message (optionally with delay before it can be read again)
   * @param queueName - Name of the queue
   * @param msgId - Message ID to archive
   */
  async archive(queueName: QueueName, msgId: bigint): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("pgmq_archive", {
        queue_name: queueName,
        msg_id: msgId,
      });

      if (error) {
        throw new Error(`Failed to archive message: ${error.message}`);
      }

      console.log(`[Queue] Archived message ${msgId} from ${queueName}`);
    } catch (error) {
      console.error(`[Queue] Error archiving message:`, error);
      throw error;
    }
  }

  /**
   * Log completed or failed job for audit trail
   * @param queueName - Name of the queue
   * @param msgId - Message ID
   * @param payload - Job payload
   * @param status - 'completed' or 'failed'
   * @param error - Error message if failed
   * @param processingTimeMs - Time taken to process
   */
  async logJobResult(
    queueName: QueueName,
    msgId: bigint,
    payload: QueueJobPayload,
    status: "completed" | "failed",
    error?: string,
    processingTimeMs?: number,
  ): Promise<void> {
    try {
      const { error: dbError } = await this.supabase
        .from("queue_jobs_log")
        .insert({
          queue_name: queueName,
          msg_id: Number(msgId),
          payload,
          status,
          error: error || null,
          processing_time_ms: processingTimeMs || null,
        });

      if (dbError) {
        console.error(`[Queue] Error logging job result:`, dbError);
      }
    } catch (err) {
      console.error(`[Queue] Failed to log job result:`, err);
    }
  }

  /**
   * Get queue stats
   */
  async getStats(queueName: QueueName) {
    try {
      const { data, error } = await this.supabase
        .from("queue_jobs_log")
        .select("status")
        .eq("queue_name", queueName);

      if (error) throw error;

      const completed =
        data?.filter((j) => j.status === "completed").length || 0;
      const failed = data?.filter((j) => j.status === "failed").length || 0;

      return { queueName, completed, failed, total: completed + failed };
    } catch (error) {
      console.error(`[Queue] Error getting stats:`, error);
      return null;
    }
  }
}

/**
 * Create a QueueManager instance from a Supabase client
 */
export function createQueueManager(supabase: SupabaseClient<Database>) {
  return new QueueManager(supabase);
}
