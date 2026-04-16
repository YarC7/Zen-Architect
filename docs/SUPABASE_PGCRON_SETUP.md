# Supabase pg_cron Setup Guide

Complete zero-cost queue processing using PostgreSQL `pg_cron` extension inside Supabase.

## ✨ Why pg_cron?

- ✅ **Free** - Included with Supabase database
- ✅ **No external services** - Runs inside PostgreSQL
- ✅ **Simple** - No secrets or environment variables needed
- ✅ **Reliable** - Guaranteed execution, built-in retry
- ✅ **Observable** - Full execution history in database

## 🚀 Quick Setup (5 minutes)

### Step 1: Deploy Migration

```bash
npx supabase migration up
```

This creates:

- pgmq extension
- 3 queues: image_processing, activity_logging, notifications
- 3 pg_cron functions to process each queue
- queue_jobs_log audit table

### Step 2: Verify in Supabase Dashboard

Go to **SQL Editor** and run:

```sql
-- Check cron jobs are scheduled
SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'process-%';
```

Expected output:

```
jobname                   | schedule
--------------------------|----------
process-image-queue       | */5 * * * *
process-activity-queue    | */5 * * * *
process-notifications-queue | */5 * * * *
```

### Step 3: Done! ✅

Queue processing is now running every 5 minutes automatically.

---

## 📊 Monitor Queue Status

### Check how many jobs were processed

```sql
SELECT queue_name, status, COUNT(*) as count
FROM queue_jobs_log
GROUP BY queue_name, status;
```

### View recent job executions

```sql
SELECT
  processed_at,
  queue_name,
  status,
  processing_time_ms,
  error
FROM queue_jobs_log
ORDER BY processed_at DESC
LIMIT 10;
```

### View cron execution history

```sql
SELECT
  jobid,
  jobname,
  start_time,
  status,
  return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

---

## 🔧 Adjust Cron Schedule

### Run every 1 minute instead of 5

```sql
-- Stop current schedule
SELECT cron.unschedule('process-image-queue');
SELECT cron.unschedule('process-activity-queue');
SELECT cron.unschedule('process-notifications-queue');

-- Restart with 1-minute schedule
SELECT cron.schedule(
  'process-image-queue',
  '*/1 * * * *',
  'SELECT public.process_image_processing_queue()'
);

SELECT cron.schedule(
  'process-activity-queue',
  '*/1 * * * *',
  'SELECT public.process_activity_logging_queue()'
);

SELECT cron.schedule(
  'process-notifications-queue',
  '*/1 * * * *',
  'SELECT public.process_notifications_queue()'
);
```

### Run once per hour

```sql
-- Change from `*/5 * * * *` to `0 * * * *`
SELECT cron.unschedule('process-image-queue');
SELECT cron.schedule(
  'process-image-queue',
  '0 * * * *',
  'SELECT public.process_image_processing_queue()'
);
```

---

## 📝 Customize Job Handlers

Edit `supabase/migrations/20260416_add_pg_cron_function.sql` to add custom logic.

### Image Processing Example

```sql
-- In process_image_processing_queue() function, after INSERT queue_jobs_log:
BEGIN
  -- Your implementation:
  -- 1. Download image from R2: curl v_msg->>'key'
  -- 2. Generate thumbnail: sharp image.resize(200, 200)
  -- 3. Upload thumbnail: PUT back to R2
  -- 4. Update database with thumbnail URL

  RAISE NOTICE '[ImageProcessing] Generated thumbnail for %', v_msg->>'fileName';
END;
```

### Activity Logging (Already Implemented)

```sql
-- Automatically writes to activities table
INSERT INTO activities (...) VALUES (
  v_msg->>'projectId',
  v_msg->>'userId',
  v_msg->>'action',
  v_msg->>'entityType',
  v_msg->>'entityId',
  v_msg->'metadata'
);
```

### Notifications Example

```sql
-- In process_notifications_queue() function:
BEGIN
  -- Send email
  -- SELECT http_post(
  --   'https://api.sendgrid.com/v3/mail/send',
  --   jsonb_build_object(
  --     'to', ARRAY[jsonb_build_object('email', (SELECT email FROM profiles WHERE id = v_msg->>'userId'))]
  --   )
  -- );

  RAISE NOTICE '[Notifications] Sent to %', v_msg->>'userId';
END;
```

---

## 🧪 Test Manually

Run processors without waiting for schedule:

```sql
-- Test image processing
SELECT * FROM public.process_image_processing_queue();
-- Returns: (processed_count, failed_count)

-- Test activity logging
SELECT * FROM public.process_activity_logging_queue();

-- Test notifications
SELECT * FROM public.process_notifications_queue();

-- Check results were logged
SELECT * FROM queue_jobs_log ORDER BY processed_at DESC LIMIT 5;
```

---

## 🚨 Troubleshooting

### No jobs being processed

1. Check functions exist:

   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name LIKE 'process%queue';
   ```

2. Check cron jobs scheduled:

   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE 'process-%';
   ```

3. Check execution errors:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE status = 'failed'
   ORDER BY start_time DESC LIMIT 5;
   ```

### Check if jobs are in queue

```sql
-- Count pending messages
SELECT
  'image_processing' as queue,
  COUNT(*) as pending
FROM pgmq.q_image_processing

UNION ALL

SELECT 'activity_logging', COUNT(*)
FROM pgmq.q_activity_logging

UNION ALL

SELECT 'notifications', COUNT()
FROM pgmq.q_notifications;
```

### Clear all pending jobs (careful!)

```sql
-- Delete all messages from a queue
SELECT pgmq.purge('image_processing');
SELECT pgmq.purge('activity_logging');
SELECT pgmq.purge('notifications');
```

---

## 🎯 Architecture

```
Client (React)
    ↓
API Enqueue (/api/queue/enqueue)
    ↓
Supabase Database
    ├─ pgmq queue (image_processing, activity_logging, notifications)
    └─ pg_cron scheduler (every 5 minutes)
    ↓
Process Functions (PL/pgSQL)
    ├─ process_image_processing_queue()
    ├─ process_activity_logging_queue()
    └─ process_notifications_queue()
    ↓
database.activities / logs / notifications
```

---

## 📚 Common Cron Schedules

| Schedule      | Meaning                |
| ------------- | ---------------------- |
| `*/5 * * * *` | Every 5 minutes        |
| `*/1 * * * *` | Every minute           |
| `0 * * * *`   | Every hour             |
| `0 0 * * *`   | Daily at midnight      |
| `0 12 * * *`  | Daily at noon          |
| `0 0 * * 1`   | Weekly Monday midnight |

[Full cron syntax reference](https://crontab.guru/)

---

## 🔐 Security

- ✅ No external service calls
- ✅ No API keys/secrets exposed
- ✅ Database-level access control via RLS
- ✅ All operations logged in queue_jobs_log
- ✅ PL/pgSQL functions run with database privileges

---

## Cost

**Total: $0/month** 💰

- Supabase database: $0-25/month (same cost with or without pg_cron)
- No additional services needed
- Unlimited queue jobs
