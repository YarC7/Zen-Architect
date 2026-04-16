import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createQueueManager } from "@/utils/queue";
import { ActivityLoggingJob } from "@/types/queue";

/**
 * POST /api/queue/enqueue
 * Enqueue a job to a specific queue
 *
 * Body:
 * {
 *   queue: 'activity_logging' | 'image_processing' | 'notifications',
 *   payload: QueueJobPayload
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queue, payload } = body;

    if (!queue || !payload) {
      return NextResponse.json(
        { error: "Missing queue or payload" },
        { status: 400 },
      );
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
