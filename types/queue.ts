/**
 * Queue Types - pgmq job definitions
 */

export type QueueName =
  | "image_processing"
  | "activity_logging"
  | "notifications";

export interface ImageProcessingJob {
  type: "image_processing";
  fileId: string;
  bucket: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ActivityLoggingJob {
  projectId: string;
  cardId?: string | null;
  userId: string | null;
  type: "create" | "update" | "delete" | "move" | "comment";
  description: string;
}

export interface NotificationJob {
  type: "notifications";
  userId: string;
  title: string;
  message: string;
  link?: string;
}

export type QueueJobPayload =
  | ImageProcessingJob
  | ActivityLoggingJob
  | NotificationJob;

export interface QueueMessage {
  msg_id: bigint;
  read_ct: number;
  enqueued_at: string;
  msg: QueueJobPayload;
}
