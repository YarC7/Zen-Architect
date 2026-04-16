import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";

/**
 * List all images from a specific prefix
 * @param prefix - Prefix path (e.g., "backgrounds/")
 * @returns Array of image metadata
 */
export interface R2Image {
  key: string;
  filename: string;
  size: number;
  lastModified: Date;
  url: string;
}

// Initialize R2 client with Cloudflare credentials
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Upload file to Cloudflare R2
 * @param file - File to upload
 * @param key - S3 key (path in bucket)
 * @returns Public URL of uploaded file
 */
export async function uploadToR2(file: File, key: string): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Return public R2 URL
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2");
  }
}

/**
 * Delete file from Cloudflare R2
 * @param key - S3 key to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error("Failed to delete file from R2");
  }
}

/**
 * Generate unique key for file upload
 * @param prefix - Optional prefix (e.g., "backgrounds/")
 * @param filename - Original filename
 * @returns Unique S3 key
 */
export function generateR2Key(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const ext = filename.split(".").pop();
  return `${prefix}${timestamp}-${random}.${ext}`;
}

/**
 * Get bucket storage stats
 * @returns Total used storage in bytes
 */
export async function getBucketStats(): Promise<number> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
    });

    let totalSize = 0;
    let continuationToken: string | undefined;

    // Paginate through all objects
    while (true) {
      const response = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        totalSize += response.Contents.reduce(
          (sum, obj) => sum + (obj.Size || 0),
          0,
        );
      }

      if (response.IsTruncated && response.NextContinuationToken) {
        continuationToken = response.NextContinuationToken;
      } else {
        break;
      }
    }

    return totalSize;
  } catch (error) {
    console.error("Error getting bucket stats:", error);
    throw new Error("Failed to get bucket stats");
  }
}

/**
 * Get total storage stats across ALL buckets in R2 account
 * @returns Total used storage in bytes across all buckets
 */
export async function getTotalBucketStats(): Promise<number> {
  try {
    // List all buckets
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResponse = await r2Client.send(listBucketsCommand);

    let totalSize = 0;

    // Get stats for each bucket
    if (bucketsResponse.Buckets) {
      for (const bucket of bucketsResponse.Buckets) {
        if (!bucket.Name) continue;

        let continuationToken: string | undefined;

        // Paginate through all objects in this bucket
        while (true) {
          const response = await r2Client.send(
            new ListObjectsV2Command({
              Bucket: bucket.Name,
              ContinuationToken: continuationToken,
            }),
          );

          if (response.Contents) {
            totalSize += response.Contents.reduce(
              (sum, obj) => sum + (obj.Size || 0),
              0,
            );
          }

          if (response.IsTruncated && response.NextContinuationToken) {
            continuationToken = response.NextContinuationToken;
          } else {
            break;
          }
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error("Error getting total bucket stats:", error);
    throw new Error("Failed to get total bucket stats");
  }
}

export async function listR2Images(prefix: string): Promise<R2Image[]> {
  try {
    const images: R2Image[] = [];
    let continuationToken: string | undefined;

    // Paginate through objects with given prefix
    while (true) {
      const response = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        response.Contents.forEach((obj) => {
          if (obj.Key && obj.Size !== undefined) {
            images.push({
              key: obj.Key,
              filename: obj.Key.split("/").pop() || obj.Key,
              size: obj.Size,
              lastModified: obj.LastModified || new Date(),
              url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${obj.Key}`,
            });
          }
        });
      }

      if (response.IsTruncated && response.NextContinuationToken) {
        continuationToken = response.NextContinuationToken;
      } else {
        break;
      }
    }

    // Sort by most recent first
    return images.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
    );
  } catch (error) {
    console.error("Error listing R2 images:", error);
    throw new Error("Failed to list images");
  }
}
