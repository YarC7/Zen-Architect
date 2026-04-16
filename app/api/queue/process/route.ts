import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createQueueManager } from "@/utils/queue";
import {
  ImageProcessingJob,
  ActivityLoggingJob,
  NotificationJob,
  QueueName,
} from "@/types/queue";

/**
 * POST /api/queue/process
 * Process pending jobs from queues
 * Can be called by cron job, manually, or webhook
 *
 * Optional query params:
 * - queue: specific queue to process (image_processing, activity_logging, notifications)
 * - limit: number of jobs to process per queue (default: 10)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (basic secret check)
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.QUEUE_PROCESSOR_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const specificQueue = searchParams.get("queue") as QueueName | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // max 50 per call

    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const queueManager = createQueueManager(supabase);

    const queues: QueueName[] = specificQueue
      ? [specificQueue]
      : ["image_processing", "activity_logging", "notifications"];

    let totalProcessed = 0;
    const results: Record<QueueName, { processed: number; failed: number }> = {
      image_processing: { processed: 0, failed: 0 },
      activity_logging: { processed: 0, failed: 0 },
      notifications: { processed: 0, failed: 0 },
    };

    // Process each queue
    for (const queueName of queues) {
      try {
        const messages = await queueManager.read(queueName, limit, 60); // 60s visibility timeout

        for (const message of messages) {
          const startTime = Date.now();

          try {
            // Route to appropriate handler based on job type
            const payload = message.msg;

            switch (payload.type) {
              case "image_processing":
                await handleImageProcessing(payload as ImageProcessingJob);
                break;
              case "activity_logging":
                await handleActivityLogging(
                  supabase,
                  payload as ActivityLoggingJob,
                );
                break;
              case "notifications":
                await handleNotifications(payload as NotificationJob);
                break;
            }

            // Log success and delete from queue
            const processingTime = Date.now() - startTime;
            await queueManager.logJobResult(
              queueName,
              message.msg_id,
              payload,
              "completed",
              undefined,
              processingTime,
            );

            // Delete message from queue after successful processing
            await queueManager.delete(queueName, message.msg_id);

            results[queueName].processed++;
            totalProcessed++;

            console.log(
              `[Queue] ✅ Processed ${queueName} job (${processingTime}ms)`,
            );
          } catch (jobError) {
            const processingTime = Date.now() - startTime;
            const errorMsg =
              jobError instanceof Error ? jobError.message : String(jobError);

            // Log failure but don't delete - message will be retried after visibility timeout
            await queueManager.logJobResult(
              queueName,
              message.msg_id,
              message.msg,
              "failed",
              errorMsg,
              processingTime,
            );

            results[queueName].failed++;

            console.error(
              `[Queue] ❌ Failed to process ${queueName} job:`,
              errorMsg,
            );
          }
        }
      } catch (queueError) {
        console.error(`[Queue] Error processing ${queueName}:`, queueError);
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed,
      results,
    });
  } catch (error) {
    console.error("[Queue] Processor error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Queue processing failed",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle image processing jobs (thumbnails, optimization, etc)
 */
async function handleImageProcessing(job: ImageProcessingJob) {
  console.log(`[ImageProcessing] Processing: ${job.fileName}`);

  // TODO: Implement your image processing logic here
  // Examples:
  // - Generate thumbnails
  // - Compress images
  // - Extract metadata
  // - Convert formats
  // - Run OCR, etc.

  // For now, just log it
  console.log(`[ImageProcessing] Completed processing for ${job.fileName}`);
}

/**
 * Handle activity logging jobs (batch write to database)
 */
async function handleActivityLogging(
  supabase: ReturnType<typeof createClient>,
  job: ActivityLoggingJob,
) {
  console.log(`[ActivityLogging] Logging: ${job.action}`);

  // Insert activity log into database
  const { error } = await supabase.from("activities").insert({
    project_id: job.projectId,
    user_id: job.userId,
    action: job.action,
    entity_type: job.entityType,
    entity_id: job.entityId,
    metadata: job.metadata || null,
  });

  if (error) {
    throw new Error(`Failed to log activity: ${error.message}`);
  }

  console.log(`[ActivityLogging] Successfully logged: ${job.action}`);
}

/**
 * Handle notification jobs (send email, push, etc)
 */
async function handleNotifications(job: NotificationJob) {
  console.log(`[Notifications] Sending to user: ${job.userId}`);

  // TODO: Implement your notification logic here
  // Examples:
  // - Send email
  // - Send push notification
  // - Send Slack message
  // - Store in notifications table
  // - etc.

  console.log(`[Notifications] Completed notification for ${job.userId}`);
}
