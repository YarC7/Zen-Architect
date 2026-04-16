import { NextResponse } from "next/server";
import { getTotalBucketStats } from "@/utils/r2/client";

/**
 * GET /api/bucket-stats
 * Get R2 bucket storage stats across ALL buckets
 */
export async function GET() {
  try {
    const usedBytes = await getTotalBucketStats();
    const maxBytes = 10 * 1024 * 1024 * 1024; // 10GB for Cloudflare R2

    return NextResponse.json({
      usedBytes,
      maxBytes,
      usedGB: (usedBytes / (1024 * 1024 * 1024)).toFixed(2),
      maxGB: 10,
      remainingGB: ((maxBytes - usedBytes) / (1024 * 1024 * 1024)).toFixed(2),
      percentUsed: ((usedBytes / maxBytes) * 100).toFixed(1),
    });
  } catch (error) {
    console.error("Bucket stats error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get bucket stats",
      },
      { status: 500 },
    );
  }
}
