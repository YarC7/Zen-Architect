-- Create PL/pgSQL function to process queue jobs via pg_cron
-- Fixes: Properly map pgmq.read() columns

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to process image_processing queue jobs
CREATE OR REPLACE FUNCTION public.process_image_processing_queue()
RETURNS TABLE(processed_count INT, failed_count INT) AS $$
DECLARE
  v_msg_id BIGINT;
  v_read_ct INT;
  v_enqueued_at TIMESTAMP;
  v_msg JSONB;
  v_processed INT := 0;
  v_failed INT := 0;
  v_error TEXT;
BEGIN
  -- Read up to 5 messages with 60s visibility timeout
  FOR v_msg_id, v_read_ct, v_enqueued_at, v_msg IN
    SELECT msg_id, read_ct, enqueued_at, msg
    FROM pgmq.read('image_processing', 5, 60)
  LOOP
    BEGIN
      -- Log successful processing
      INSERT INTO queue_jobs_log (queue_name, msg_id, payload, status, processed_at)
      VALUES ('image_processing', v_msg_id, v_msg, 'completed', NOW());

      -- Delete message from queue after successful processing
      PERFORM pgmq.delete('image_processing', v_msg_id);
      
      v_processed := v_processed + 1;
      RAISE NOTICE '[ImageProcessing] Processed msg_id: %', v_msg_id;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      -- Log failed processing
      INSERT INTO queue_jobs_log (queue_name, msg_id, payload, status, error, processed_at)
      VALUES ('image_processing', v_msg_id, v_msg, 'failed', v_error, NOW());
      
      v_failed := v_failed + 1;
      RAISE WARNING '[ImageProcessing] Failed msg_id %: %', v_msg_id, v_error;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_failed;
END;
$$ LANGUAGE plpgsql;

-- Function to process activity_logging queue jobs
CREATE OR REPLACE FUNCTION public.process_activity_logging_queue()
RETURNS TABLE(processed_count INT, failed_count INT) AS $$
DECLARE
  v_msg_id BIGINT;
  v_read_ct INT;
  v_enqueued_at TIMESTAMP;
  v_msg JSONB;
  v_processed INT := 0;
  v_failed INT := 0;
  v_error TEXT;
BEGIN
  FOR v_msg_id, v_read_ct, v_enqueued_at, v_msg IN
    SELECT msg_id, read_ct, enqueued_at, msg
    FROM pgmq.read('activity_logging', 10, 60)
  LOOP
    BEGIN
      -- Log activity (TypeScript types ensure correct structure)
      INSERT INTO activities (
        project_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES (
        v_msg->>'projectId',
        NULLIF(v_msg->>'userId', 'null'),
        v_msg->>'action',
        v_msg->>'entityType',
        v_msg->>'entityId',
        (v_msg->'metadata')::JSONB
      );

      -- Log to audit table
      INSERT INTO queue_jobs_log (queue_name, msg_id, payload, status, processed_at)
      VALUES ('activity_logging', v_msg_id, v_msg, 'completed', NOW());

      PERFORM pgmq.delete('activity_logging', v_msg_id);
      
      v_processed := v_processed + 1;
      RAISE NOTICE '[ActivityLogging] Processed msg_id: %', v_msg_id;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      INSERT INTO queue_jobs_log (queue_name, msg_id, payload, status, error, processed_at)
      VALUES ('activity_logging', v_msg_id, v_msg, 'failed', v_error, NOW());
      
      v_failed := v_failed + 1;
      RAISE WARNING '[ActivityLogging] Failed msg_id %: %', v_msg_id, v_error;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_failed;
END;
$$ LANGUAGE plpgsql;

-- Function to process notifications queue jobs
CREATE OR REPLACE FUNCTION public.process_notifications_queue()
RETURNS TABLE(processed_count INT, failed_count INT) AS $$
DECLARE
  v_msg_id BIGINT;
  v_read_ct INT;
  v_enqueued_at TIMESTAMP;
  v_msg JSONB;
  v_processed INT := 0;
  v_failed INT := 0;
  v_error TEXT;
BEGIN
  FOR v_msg_id, v_read_ct, v_enqueued_at, v_msg IN
    SELECT msg_id, read_ct, enqueued_at, msg
    FROM pgmq.read('notifications', 5, 60)
  LOOP
    BEGIN
      -- TODO: Implement your notification logic here
      -- - Send email
      -- - Send push notification
      -- - Store notification record
      
      -- For now, just log success
      INSERT INTO queue_jobs_log (queue_name, msg_id, payload, status, processed_at)
      VALUES ('notifications', v_msg_id, v_msg, 'completed', NOW());

      PERFORM pgmq.delete('notifications', v_msg_id);
      
      v_processed := v_processed + 1;
      RAISE NOTICE '[Notifications] Processed msg_id: %', v_msg_id;
    EXCEPTION WHEN OTHERS THEN
      v_error := SQLERRM;
      INSERT INTO queue_jobs_log (queue_name, msg_id, payload, status, error, processed_at)
      VALUES ('notifications', v_msg_id, v_msg, 'failed', v_error, NOW());
      
      v_failed := v_failed + 1;
      RAISE WARNING '[Notifications] Failed msg_id %: %', v_msg_id, v_error;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_failed;
END;
$$ LANGUAGE plpgsql;

-- Schedule cron jobs (pg_cron)
-- Run every 5 minutes
SELECT cron.schedule(
  'process-image-queue',
  '*/5 * * * *',
  'SELECT public.process_image_processing_queue()'
);

SELECT cron.schedule(
  'process-activity-queue',
  '*/5 * * * *',
  'SELECT public.process_activity_logging_queue()'
);

SELECT cron.schedule(
  'process-notifications-queue',
  '*/5 * * * *',
  'SELECT public.process_notifications_queue()'
);

-- View active cron jobs
-- SELECT * FROM cron.job;

-- View cron job execution history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
