import { NextRequest, NextResponse } from "next/server";
import { listR2Images } from "@/utils/r2/client";

/**
 * GET /api/gallery?prefix=backgrounds
 * List uploaded images from R2
 */
export async function GET(request: NextRequest) {
  try {
    const prefix = request.nextUrl.searchParams.get("prefix") || "backgrounds/";

    const images = await listR2Images(prefix);

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error("Gallery error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list images",
      },
      { status: 500 },
    );
  }
}
