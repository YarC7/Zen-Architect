# Supabase Queues (pgmq) Setup Guide

This document explains how to use the pgmq queue system integrated into ZenArc.

## 🚀 Quick Setup

### 1. Environment Variables

No additional environment variables needed! Supabase pg_cron runs directly in the database.

**Local development** (`.env.local`) - Already configured from Supabase project:

```env
# These should already be set
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> ✅ Database cron jobs run directly inside Supabase - no external secrets needed!

### 2. Enable pgmq Extension

The migration file `20260416_enable_pgmq.sql` enables the pgmq extension and creates the necessary queues.

Run this migration:

```bash
npx supabase migration up
```

Or manually execute the SQL in Supabase SQL editor.

### 3. Setup Cron Job for Queue Processing

✅ **Supabase pg_cron** - Runs directly in database, completely free!

**Setup Steps:**

1. **Deploy the migration** (creates pgmq + pg_cron functions):

   ```bash
   npx supabase migration up
   ```

2. **Verify in Supabase Dashboard:**

   SQL Editor → Run:

   ```sql
   -- View all scheduled cron jobs
   SELECT * FROM cron.job;

   -- Expected output: 3 jobs
   -- - process-image-queue (every 5 min)
   -- - process-activity-queue (every 5 min)
   -- - process-notifications-queue (every 5 min)
   ```

3. **Monitor execution history:**

   ```sql
   SELECT * FROM cron.job_run_details
   ORDER BY start_time DESC
   LIMIT 10;
   ```

4. **Check queue processing results:**

   ```sql
   SELECT queue_name, status, COUNT(*) as count
   FROM queue_jobs_log
   GROUP BY queue_name, status;
   ```

**How it works:**

- Database runs cron functions automatically every 5 minutes
- Functions read from pgmq queues and process jobs
- Results logged to `queue_jobs_log` table
- No external service, no secrets, completely managed by Supabase
- Cost: $0 (included with database)

#### Testing Manually

Run processors without waiting for cron:

```sql
-- Test image processing queue
SELECT * FROM public.process_image_processing_queue();

-- Test activity logging queue
SELECT * FROM public.process_activity_logging_queue();

-- Test notifications queue
SELECT * FROM public.process_notifications_queue();
```

---

## 📝 Usage Examples

### 1. Logging Activities (Async)

```typescript
'use client';
import { useActivityQueue } from '@/hooks/useActivityQueue';

export function CardComponent() {
  const { logActivity } = useActivityQueue();

  const handleCardUpdate = async (cardId: string) => {
    // Update card immediately
    await updateCard(cardId, newData);

    // Log activity asynchronously (won't block UI)
    logActivity(
      projectId,
      'card_updated',
      'card',
      cardId,
      { title: newData.title }
    );
  };

  return <button onClick={() => handleCardUpdate('123')}>Update</button>;
}
```

### 2. Uploading Files (with Background Processing)

Files are automatically enqueued for processing in `/api/upload`:

```typescript
const formData = new FormData();
formData.append("file", file);

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const { success, url, fileId } = await response.json();
// File is now being processed in background queue
```

### 3. Manual Queue Enqueuing

```typescript
import { ImageProcessingJob } from "@/types/queue";

const job: ImageProcessingJob = {
  type: "image_processing",
  fileId: "123",
  bucket: "gallery",
  key: "gallery/image.jpg",
  fileName: "image.jpg",
  fileSize: 5000000,
  mimeType: "image/jpeg",
};

const response = await fetch("/api/queue/enqueue", {
  method: "POST",
  body: JSON.stringify({
    queue: "image_processing",
    payload: job,
  }),
});
```

---

## 🔧 Implementing Custom Job Handlers

The pg_cron functions handle queue processing automatically. To add custom logic:

Edit `supabase/migrations/20260416_add_pg_cron_function.sql` in the appropriate function:

**Image Processing (thumbnail generation, etc):**

```sql
-- In process_image_processing_queue function, add your logic:
BEGIN
  -- Download from R2
  -- Generate thumbnail with Sharp or other tool
  -- Upload back to R2
  -- Update database with thumbnail URL
  RAISE NOTICE '[ImageProcessing] Processed %', v_msg->>'fileName';
END;
```

**Activity Logging:**

```sql
-- Already implemented in process_activity_logging_queue
-- Automatically inserts to activities table
-- Extract data from JSONB: v_msg->>'projectId', v_msg->>'action', etc.
```

**Notifications (email, push, etc):**

```sql
-- In process_notifications_queue function:
BEGIN
  -- Send email: v_msg->>'title', v_msg->>'message'
  -- Send push notification to v_msg->>'userId'
  -- Store notification record
  RAISE NOTICE '[Notifications] Sent to %', v_msg->>'userId';
END;
```

> 💡 For complex logic, call HTTP webhooks from SQL using `http` extension, or move to TypeScript handlers

---

## 📊 Monitoring Queue

### View Queue Logs

```sql
SELECT * FROM queue_jobs_log
ORDER BY processed_at DESC
LIMIT 50;
```

### Check Queue Stats

```sql
SELECT queue_name, status, COUNT(*) as count
FROM queue_jobs_log
GROUP BY queue_name, status;
```

### Failed Jobs

```sql
SELECT * FROM queue_jobs_log
WHERE status = 'failed'
ORDER BY processed_at DESC;
```

---

## 🎯 Queue Names & Job Types

| Queue              | Job Type           | Purpose                                       |
| ------------------ | ------------------ | --------------------------------------------- |
| `image_processing` | ImageProcessingJob | Thumbnail generation, image optimization, etc |
| `activity_logging` | ActivityLoggingJob | Async activity/audit logging                  |
| `notifications`    | NotificationJob    | Email, push notifications, etc                |

---

## ⚙️ Configuration

### Visibility Timeout (in pg_cron)

Default: 60 seconds. If a job isn't completed, it becomes visible again for retry.

Adjust in migration function:

```sql
-- Change from current:
FROM pgmq.read('image_processing', 5, 60)
-- To longer timeout:
FROM pgmq.read('image_processing', 5, 120)  -- 120 second timeout
```

### Processing Frequency

Default: Every **5 minutes** (`*/5 * * * *`).

Adjust in migration:

```sql
-- Change cron schedule from:
SELECT cron.schedule('process-image-queue', '*/5 * * * *', ...);
-- To every minute:
SELECT cron.schedule('process-image-queue', '*/1 * * * *', ...);
-- Or every hour:
SELECT cron.schedule('process-image-queue', '0 * * * *', ...);
```

### Queue Processing Limits

Default: 5 jobs per queue per cycle.

Adjust in migration:

```sql
-- From:
FROM pgmq.read('image_processing', 5, 60)
-- To 10 jobs:
FROM pgmq.read('image_processing', 10, 60)
```

### Queue Cleanup

pgmq automatically manages queue cleanup. Completed/failed jobs stay in `queue_jobs_log` table for audit trail (never auto-deleted).

---

## 🚨 Troubleshooting

### Cron Jobs Not Running

1. Check if pg_cron functions exist:

   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE 'process-%';
   ```

2. Verify functions were created:

   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name LIKE 'process%queue';
   ```

3. Check execution history:

   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```

4. Check for errors in last run:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE status = 'failed'
   ORDER BY start_time DESC LIMIT 5;
   ```

### Jobs Not Processing Correctly

1. Check pgmq extension is enabled:

   ```sql
   SELECT * FROM pgmq.queue;
   ```

2. Check queue contents:

   ```sql
   SELECT msg_id, msg, read_ct FROM pgmq.q_image_processing LIMIT 5;
   ```

3. Check for errors in job_log table:

   ```sql
   SELECT * FROM queue_jobs_log
   WHERE status = 'failed'
   ORDER BY processed_at DESC LIMIT 10;
   ```

4. Run a function manually to test:
   ```sql
   SELECT * FROM public.process_image_processing_queue();
   -- Returns: (processed_count, failed_count)
   ```

### High Queue Backlog

1. Increase processing frequency (every 1 minute instead of 5):

   ```sql
   -- Delete old schedule
   SELECT cron.unschedule('process-image-queue');

   -- Create new more frequent schedule
   SELECT cron.schedule(
     'process-image-queue',
     '*/1 * * * *',
     'SELECT public.process_image_processing_queue()'
   );
   ```

2. Increase jobs per cycle (from 5 to 20):
   - Edit migration function
   - Re-deploy: `npx supabase migration up`

### Test Manually Without Waiting

Run functions immediately:

```sql
-- Test all processors
SELECT * FROM public.process_image_processing_queue();
SELECT * FROM public.process_activity_logging_queue();
SELECT * FROM public.process_notifications_queue();

-- Check results
SELECT COUNT(*) as total, status
FROM queue_jobs_log
GROUP BY status;
```

3. Add more worker instances if using distributed workers

---

## 🔐 Security Notes

- Keep `QUEUE_PROCESSOR_SECRET` secure - it's used to authenticate cron requests
- Queue processor endpoint (`/api/queue/process`) requires Bearer token
- Service role key should only be used in backend/API routes
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client

---

## 📚 Further Reading

- [pgmq GitHub](https://github.com/tembo-io/pgmq)
- [pgmq Documentation](https://github.com/tembo-io/pgmq/wiki)
- [Supabase Functions Guide](https://supabase.com/docs/guides/functions)
- [Message Queue Patterns](https://en.wikipedia.org/wiki/Message_queue)
