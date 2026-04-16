# 🚀 ZenArc Vercel Cron - Quick Start (5 minutes)

## 1️⃣ Generate Secrets (2 min)

```bash
# Copy & run these commands, save the output
openssl rand -hex 32  # → CRON_SECRET
openssl rand -hex 32  # → QUEUE_PROCESSOR_SECRET
```

## 2️⃣ Add to Vercel (2 min)

Go to: **vercel.com** → Your Project → **Settings** → **Environment Variables**

Add these (Production scope):

```
CRON_SECRET = <paste-first-secret>
QUEUE_PROCESSOR_SECRET = <paste-second-secret>
NEXT_PUBLIC_URL = https://your-app.vercel.app
```

## 3️⃣ Deploy (1 min)

```bash
git add .
git commit -m "feat: add vercel cron"
git push origin main
```

## ✅ Verify

1. Wait 1-2 min for deployment
2. Go to Vercel dashboard → **Crons** tab
3. Should see `/api/cron/process-queue` with status **Active**

## 📊 Check It's Working

```sql
SELECT * FROM queue_jobs_log ORDER BY processed_at DESC LIMIT 5;
```

---

## 📖 Need Help?

See [VERCEL_CRON_SETUP.md](./VERCEL_CRON_SETUP.md) for detailed troubleshooting.
