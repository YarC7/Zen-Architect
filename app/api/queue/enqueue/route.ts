import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createQueueManager } from "@/utils/queue";
import { redis } from "@/utils/redis";

/**
 * POST /api/queue/enqueue
 * Enqueue a job to a specific queue
 *
 * Body:
 * {
 *   queue: 'activity_logging' | 'image_processing' | 'notifications',
 *   payload: QueueJobPayload,
 *   idempotencyKey?: string // Provide a UUID to ensure a job is only enqueued once within its TTL
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queue, payload, idempotencyKey } = body;

    if (!queue || !payload) {
      return NextResponse.json(
        { error: "Missing queue or payload" },
        { status: 400 },
      );
    }

    // -- Idempotency Check --
    // Only execute if Redis is configured and an idempotency key is provided.
    if (redis && idempotencyKey) {
      const lockKey = `queue:idempotency:${queue}:${idempotencyKey}`;
      // Set key only if it doesn't exist (nx). Expire in 1 hour (ex).
      const setSuccess = await redis.set(lockKey, "processing", { nx: true, ex: 3600 });
      
      if (!setSuccess) {
        // Task has already been enqueued recently.
        return NextResponse.json({
          success: true,
          msgId: "idempotent-bypassed",
          queue,
          note: "Skipped to prevent duplicate execution"
        });
      }
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const queueManager = createQueueManager(supabase);

    // Enqueue the job
    const msgId = await queueManager.enqueue(queue, payload);

    return NextResponse.json({
      success: true,
      msgId,
      queue,
    });
  } catch (error) {
    console.error("[Queue] Enqueue error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enqueue failed" },
      { status: 500 },
    );
  }
}
