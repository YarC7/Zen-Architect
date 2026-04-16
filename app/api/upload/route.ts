import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, generateR2Key, deleteFromR2 } from "@/utils/r2/client";

/**
 * POST /api/upload
 * Upload file to Cloudflare R2
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

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key,
      filename: file.name,
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
