-- Enable pgmq extension for message queuing
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create queue for image processing/thumbnail generation
SELECT pgmq.create('image_processing');

-- Create queue for activity logging (non-critical, can batch)
SELECT pgmq.create('activity_logging');

-- Create queue for notifications (non-critical async)
SELECT pgmq.create('notifications');

-- Create a table to track processed queue jobs for observability
CREATE TABLE IF NOT EXISTS queue_jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name TEXT NOT NULL,
  msg_id BIGINT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  error TEXT,
  processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processing_time_ms INT
);

CREATE INDEX idx_queue_jobs_log_status ON queue_jobs_log(status);
CREATE INDEX idx_queue_jobs_log_queue_name ON queue_jobs_log(queue_name);
