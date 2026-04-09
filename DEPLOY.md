# TA Screener v2 — Deployment Guide

## What's in this zip
- server.js         → Node/Express backend, proxies Anthropic API
- package.json      → dependencies
- public/index.html → full frontend, no build step needed

---

## Step 1 — Create GitHub repository

1. Go to github.com → sign in
2. Click the "+" icon top right → "New repository"
3. Name it: ta-screener-v2
4. Set to Public
5. Click "Create repository"
6. On the next screen click "uploading an existing file"
7. Upload these files:
   - server.js         → drag to root
   - package.json      → drag to root
   - public/index.html → IMPORTANT: first create a folder called "public"
                         To create the folder, type "public/index.html" in the
                         file name box — GitHub will create the folder automatically
8. Click "Commit changes"

---

## Step 2 — Deploy on Render

1. Go to render.com → sign in
2. Click "+ New" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select the "ta-screener-v2" repository
5. Render will auto-detect Node.js

Configure as follows:
- Name:          ta-screener-v2
- Language:      Node
- Branch:        main
- Build Command: yarn install
- Start Command: node server.js
- Instance Type: Free ($0/month)

6. Scroll to "Environment Variables"
7. Add the following:
   KEY:   ANTHROPIC_API_KEY
   VALUE: your key from console.anthropic.com

8. Click "Deploy Web Service"
9. Wait 2-3 minutes
10. Your URL will be: https://ta-screener-v2-xxxx.onrender.com

---

## Step 3 — Add Anthropic API credits

1. Go to console.anthropic.com
2. Click Settings → Billing
3. Click "Buy credits" → add $5 minimum
4. This is separate from Claude.ai Pro subscription

---

## Step 4 — Share the URL

Send the Render URL to the TA team.

IMPORTANT: The free Render instance sleeps after 15 minutes of inactivity.
First request after sleep takes ~50 seconds to wake up.
Open the URL yourself 2 minutes before any demo to pre-warm it.

---

## What's new in v2 vs v1

| Feature                        | v1  | v2  |
|-------------------------------|-----|-----|
| Resume library (global)        | No  | Yes |
| Domain buckets                 | No  | Yes |
| Search by JD (score on demand) | No  | Yes |
| Upload → instant scoring       | Yes | No  |
| Batch queue (50+ files)        | No  | Yes |
| ATS fetch button (disabled)    | No  | Yes |
| Pipeline view                  | Yes | Yes |
| Interview history              | Yes | Yes |
| Status updates                 | Yes | Yes |
| Demo data                      | Yes | Yes |

---

## How scoring works in v2

Scoring does NOT happen at upload time.
Resumes are stored as a library with domain tags.

To score: go to "Search by JD" tab → paste a JD → click Search.
Claude scores every resume in the library against that JD in real time.
Change the JD → search again → fresh scores recalculated.

Over 50 resumes → batch queue appears → process in background.
