import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, generateR2Key, deleteFromR2 } from "@/utils/r2/client";
import { createClient } from "@supabase/supabase-js";
import { createQueueManager } from "@/utils/queue";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/upload
 * Upload file to Cloudflare R2 and enqueue for processing
 * Body: FormData with file and folder
 */
export async function POST(request: NextRequest) {
  try {
    // Parse FormData from request
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "uploads";

    // Validate file exists
    if (!file || !(file instanceof File)) {
      console.error("Invalid file:", file);
      return NextResponse.json(
        { error: "No file provided or invalid format" },
        { status: 400 },
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 100MB)" },
        { status: 413 },
      );
    }

    // Log for debugging
    console.log("Upload request:", {
      filename: file.name,
      size: file.size,
      type: file.type,
      folder,
    });

    // Generate unique key
    const key = generateR2Key(`${folder}/`, file.name);

    // Upload to R2
    const publicUrl = await uploadToR2(file, key);

    // Enqueue image processing job (thumbnail generation, etc)
    const fileId = uuidv4();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const queueManager = createQueueManager(supabase);

    try {
      await queueManager.enqueue("image_processing", {
        type: "image_processing",
        fileId,
        bucket: folder,
        key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
      console.log(`[Upload] Enqueued image processing for ${file.name}`);
    } catch (queueError) {
      // Log queue error but don't fail the upload
      console.error(`[Upload] Failed to enqueue processing:`, queueError);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key,
      filename: file.name,
      fileId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/upload
 * Delete file from Cloudflare R2
 * Query params: key (file key to delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "No key provided" }, { status: 400 });
    }

    console.log("Delete request:", { key });

    // Delete from R2
    await deleteFromR2(key);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      key,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
