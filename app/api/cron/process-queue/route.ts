import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/cron/process-queue
 * Cron endpoint for processing queue jobs (Vercel Cron)
 *
 * This endpoint is called automatically by Vercel's Cron system
 * based on the schedule defined in vercel.json
 *
 * Vercel will send an Authorization header with the CRON_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this request came from Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Processing queue jobs...");

    // Call the queue processor endpoint
    const processorUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:1707"}/api/queue/process`;
    const processorSecret = process.env.QUEUE_PROCESSOR_SECRET;

    if (!processorSecret) {
      console.error("[Cron] QUEUE_PROCESSOR_SECRET not configured");
      return NextResponse.json(
        { error: "QUEUE_PROCESSOR_SECRET not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(processorUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${processorSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Queue processor returned ${response.status}`);
    }

    const data = await response.json();

    console.log("[Cron] Queue processing completed", {
      totalProcessed: data.totalProcessed,
      results: data.results,
    });

    return NextResponse.json({
      success: true,
      message: "Queue processed successfully",
      ...data,
    });
  } catch (error) {
    console.error("[Cron] Error processing queue:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process queue",
      },
      { status: 500 },
    );
  }
}

// Optional: GET handler for monitoring/testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "Cron endpoint is active",
    endpoint: "/api/cron/process-queue",
    method: "POST",
    schedule: "Every 5 minutes (configured in vercel.json)",
  });
}
