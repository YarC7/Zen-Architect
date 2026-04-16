# Supabase Queues (pgmq) Setup Guide

This document explains how to use the pgmq queue system integrated into ZenArc.

## 🚀 Quick Setup

### 1. Environment Variables

**For local development** (`.env.local`):

```env
# Queue processor
QUEUE_PROCESSOR_SECRET=dev-secret-for-testing

# Optional: local cron testing
CRON_SECRET=dev-cron-secret
NEXT_PUBLIC_URL=http://localhost:1707
```

**For production (Vercel dashboard)** → Settings → Environment Variables:

```env
CRON_SECRET=<generate-with: openssl rand -hex 32>
QUEUE_PROCESSOR_SECRET=<generate-with: openssl rand -hex 32>
NEXT_PUBLIC_URL=https://your-app.vercel.app

# These should already be set
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Generate secure secrets:**

```bash
openssl rand -hex 32
# or
echo $RANDOM | md5sum
# or online: https://random.org/
```

### 2. Enable pgmq Extension

The migration file `20260416_enable_pgmq.sql` enables the pgmq extension and creates the necessary queues.

Run this migration:

```bash
npx supabase migration up
```

Or manually execute the SQL in Supabase SQL editor.

### 3. Setup Cron Job for Queue Processing

You need to periodically process queue jobs. Options:

#### Option A: Using Vercel Cron (Recommended) ✅ IMPLEMENTED

Files already created:

- ✅ `app/api/cron/process-queue/route.ts`
- ✅ `vercel.json`

The cron job runs every **5 minutes** (`*/5 * * * *`).

**Setup Steps:**

1. **Add environment variables to Vercel:**

   Go to your Vercel project settings → Environment Variables and add:

   ```env
   CRON_SECRET=your-super-secret-random-key-here
   QUEUE_PROCESSOR_SECRET=your-super-secret-random-key-here
   NEXT_PUBLIC_URL=https://your-app.vercel.app
   ```

   > ⚠️ `CRON_SECRET` must match the header Vercel sends automatically
   > Use `openssl rand -hex 32` to generate secure secrets

2. **Push to production:**

   ```bash
   git add vercel.json app/api/cron/process-queue/route.ts
   git commit -m "feat: add vercel cron for queue processing"
   git push
   ```

3. **Verify deployment:**
   - Go to https://your-app.vercel.app/api/cron/process-queue
   - You should see: `{ status: 'Cron endpoint is active', ... }`
   - Check Vercel dashboard Crons tab to see scheduled jobs

4. **Monitor execution:**
   - Vercel dashboard → Cron Jobs tab shows all executions
   - Check logs: Vercel dashboard → Functions Logs
   - Query database: `SELECT * FROM queue_jobs_log ORDER BY processed_at DESC;`

#### Option B: Using External Cron Service (EasyCron, node-cron, etc)

Call `/api/queue/process` every 5 minutes:

```bash
curl -X POST https://your-app.com/api/queue/process \
  -H "Authorization: Bearer YOUR_QUEUE_PROCESSOR_SECRET"
```

#### Option C: Manual Processing (Development)

```bash
curl -X POST http://localhost:1707/api/queue/process \
  -H "Authorization: Bearer your-secret"
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

## 🔧 Implementing Job Handlers

Edit `app/api/queue/process/route.ts` to implement your business logic:

```typescript
async function handleImageProcessing(job: ImageProcessingJob) {
  // Your implementation here
  console.log(`Processing image: ${job.fileName}`);

  // Example: Generate thumbnail
  // const thumbnail = await generateThumbnail(job.key);

  // Example: Run ML model
  // const metadata = await extractMetadata(job.key);
}

async function handleActivityLogging(supabase, job: ActivityLoggingJob) {
  // Already implemented - writes to activities table
}

async function handleNotifications(job: NotificationJob) {
  // Your implementation here
  console.log(`Sending notification to ${job.userId}`);

  // Example: Send email
  // await sendEmail(job.userId, job.title, job.message);
}
```

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

### Visibility Timeout

Default: 30-60 seconds. If a job isn't completed in this time, it becomes visible again for retry.

Adjust in `app/api/queue/process/route.ts`:

```typescript
const messages = await queueManager.read(queueName, limit, 120); // 120 second timeout
```

### Processing Limits

Default: 10 jobs per queue per cycle.

Adjust with query param: `/api/queue/process?limit=20`

### Queue Size

pgmq automatically manages queue cleanup. Completed/failed jobs are logged in `queue_jobs_log` table for audit trail.

---

## 🚨 Troubleshooting

### Jobs Not Processing

1. Check cron job is running (check Vercel/deployment logs)
2. Verify `QUEUE_PROCESSOR_SECRET` is set
3. Check pgmq extension is enabled: `SELECT * FROM pgmq.queue;`
4. Verify Supabase credentials are correct

### Jobs Failing

1. Check `queue_jobs_log` table for error messages
2. Implement better error handling in job handlers
3. Add retry logic with exponential backoff

### High Queue Backlog

1. Increase processing frequency (every 1 minute instead of 5)
2. Increase `limit` parameter (process more jobs per cycle)
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
