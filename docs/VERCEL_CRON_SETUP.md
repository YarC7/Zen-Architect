# Vercel Cron Setup Checklist for ZenArc

Complete this checklist to enable automated queue processing on Vercel.

## ✅ Pre-requisites

- [ ] Project deployed to Vercel
- [ ] Vercel Pro or higher (Cron requires Pro plan)
- [ ] Supabase project configured and running

## 📋 Setup Steps

### 1. Generate Secrets

Copy these commands and run them to generate secure secrets:

```bash
# Generate CRON_SECRET
openssl rand -hex 32

# Generate QUEUE_PROCESSOR_SECRET
openssl rand -hex 32
```

Save the outputs - you'll need them in the next step.

**Example output:**

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

### 2. Add Environment Variables to Vercel

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add each variable:

| Variable                 | Value                         | Scope      |
| ------------------------ | ----------------------------- | ---------- |
| `CRON_SECRET`            | `<first-secret>`              | Production |
| `QUEUE_PROCESSOR_SECRET` | `<second-secret>`             | Production |
| `NEXT_PUBLIC_URL`        | `https://your-app.vercel.app` | Production |

> Replace `your-app` with your actual Vercel project name

4. Also verify these exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

**Screenshot reference:**

```
Settings → Environment Variables
├─ CRON_SECRET = "a1b2c3d4..." (Production)
├─ QUEUE_PROCESSOR_SECRET = "x9y8z7w6..." (Production)
├─ NEXT_PUBLIC_URL = "https://zenarc-seven.vercel.app" (Production)
└─ ... (other existing vars)
```

### 3. Verify Files Exist

Check these files are in your repo:

- ✅ `app/api/cron/process-queue/route.ts`
- ✅ `vercel.json`
- ✅ `app/api/queue/process/route.ts`
- ✅ `app/api/queue/enqueue/route.ts`
- ✅ `utils/queue.ts`
- ✅ `types/queue.ts`
- ✅ `hooks/useActivityQueue.ts`

### 4. Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "feat: add vercel cron setup for queue processing"

# Push to trigger deployment
git push origin main
```

Wait for deployment to complete (usually 1-2 minutes).

### 5. Verify Cron Configuration

1. Go to your Vercel project dashboard
2. Click **Crons** tab (should appear after deployment)
3. You should see:
   ```
   Path: /api/cron/process-queue
   Schedule: */5 * * * *
   Status: Active
   Next Run: (will show next scheduled time)
   ```

If you don't see this, try:

- Refresh the page
- Check that `vercel.json` was deployed (check Git commits)
- Re-deploy: `vercel deploy --prod`

### 6. Test Queue Processing

**Option A: Wait for automatic run**

- Cron runs every 5 minutes
- Check logs in 5 minutes

**Option B: Manual trigger**

```bash
curl -X POST https://your-app.vercel.app/api/cron/process-queue \
  -H "Authorization: Bearer <your-CRON_SECRET>" \
  -H "Content-Type: application/json"
```

### 7. Monitor Queue Processing

**Check Vercel logs:**

1. Vercel dashboard → **Functions** tab
2. Look for `/api/cron/process-queue` calls
3. Click to see execution logs

**Check database:**

```sql
-- Check recent jobs
SELECT * FROM queue_jobs_log
ORDER BY processed_at DESC
LIMIT 20;

-- Count by status
SELECT status, COUNT(*) FROM queue_jobs_log
GROUP BY status;

-- See failures
SELECT * FROM queue_jobs_log
WHERE status = 'failed'
ORDER BY processed_at DESC;
```

---

## 🎯 Schedule Explanation

The cron uses: `*/5 * * * *` (cron syntax)

This means: **Every 5 minutes**

| Interval    | Meaning               | Example                  |
| ----------- | --------------------- | ------------------------ |
| `*/5`       | Every 5 minutes       | 00, 05, 10, 15, 20, ...  |
| `*/15`      | Every 15 minutes      | 00, 15, 30, 45           |
| `* * * * *` | Every minute          | 00, 01, 02, 03, ...      |
| `0 * * * *` | Every hour            | 00:00, 01:00, 02:00, ... |
| `0 0 * * *` | Every day at midnight | Daily at 00:00           |

**To change frequency**, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-queue",
      "schedule": "*/1 * * * *" // Change to: every 1 minute
    }
  ]
}
```

---

## 🚨 Troubleshooting

### Cron not appearing in dashboard

- ✅ Check `vercel.json` exists in root
- ✅ Re-deploy: `git push origin main`
- ✅ Wait 2-3 minutes for dashboard to update
- ✅ Check plan - Cron requires **Vercel Pro**

### Jobs not processing

- ✅ Check environment variables are set correctly
- ✅ Check logs: Vercel → Functions tab
- ✅ Test manually: `curl` command above
- ✅ Verify Supabase credentials are correct

### Authorization errors

- ✅ Verify `CRON_SECRET` matches in two places:
  1. Vercel environment variables
  2. The Bearer token in requests
- ✅ Verify `QUEUE_PROCESSOR_SECRET` matches
- ✅ Secrets shouldn't have quotes around them

### Database connection fails

- ✅ Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- ✅ Check Supabase project is not paused
- ✅ Check pgmq extension is enabled

---

## 📊 Success Indicators

You'll know it's working when:

✅ Cron appears in Vercel dashboard under **Crons** tab  
✅ You see `[Cron] Processing queue jobs...` in function logs  
✅ Jobs appear in `queue_jobs_log` table with `status = 'completed'`  
✅ Activity logging shows recent entries when you perform actions  
✅ No 401 or 500 errors in logs

---

## 🔗 Next Steps

Once cron is working:

1. **Implement image processing** - add logic to `handleImageProcessing()` in `/api/queue/process/route.ts`
2. **Test with real files** - upload images and verify they're processed
3. **Setup notifications** - add notification logic for users
4. **Monitor performance** - query queue stats regularly

---

## 📚 Related Docs

- [QUEUE_SETUP.md](./QUEUE_SETUP.md) - Full queue documentation
- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs)
- [Vercel Pricing](https://vercel.com/pricing) - Cron requires Pro plan
