# Quick Fix for Vercel Deployment

## The Problem

Your Vercel deployment is not working because:

1. **Backend is not deployed**: Vercel only hosts the frontend. The backend (FastAPI) must be deployed separately.
2. **Hardcoded localhost URL**: The frontend was trying to connect to `http://localhost:8000` which doesn't exist in production.
3. **Missing environment variables**: The frontend needs to know where the backend is deployed.

## The Solution

### Step 1: Deploy Backend to Railway (Free)

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `StressAnalysis` repository
5. Click "Add Service" → "GitHub Repo"
6. In the service settings:
   - Set **Root Directory** to `backend`
   - Railway will auto-detect Python
7. Wait for deployment (takes 2-5 minutes)
8. Copy the deployment URL (e.g., `https://stress-analysis-production.up.railway.app`)

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these two variables:

```
NEXT_PUBLIC_API_URL = https://your-railway-url.up.railway.app
NEXT_PUBLIC_DUMMY_THINGSPEAK_URL = https://your-railway-url.up.railway.app/dummy-thingspeak
```

Replace `https://your-railway-url.up.railway.app` with your actual Railway URL.

4. Click **Save**
5. Go to **Deployments** tab
6. Click the three dots on the latest deployment → **Redeploy**

### Step 3: Verify Backend is Working

1. Open your Railway backend URL in browser: `https://your-railway-url.up.railway.app/health`
2. You should see: `{"status":"ok"}`
3. Check API docs: `https://your-railway-url.up.railway.app/docs`

### Step 4: Test Frontend

1. Go to your Vercel deployment URL
2. Enter the dummy ThingSpeak URL: `https://your-railway-url.up.railway.app/dummy-thingspeak`
3. Enter minutes (e.g., 10)
4. Click "Start Analysis"
5. It should work!

## Why It Wasn't Working

- Vercel only hosts static sites and serverless functions
- Your backend is a Python FastAPI server that needs to run continuously
- Railway/Render can host Python applications
- The frontend needed environment variables to know where the backend is

## Current Status

✅ Frontend code updated to use environment variables
✅ Backend CORS configured to allow all origins
✅ Deployment files added (railway.json, Procfile)
✅ Environment variable configuration added

## Next Steps

1. Deploy backend to Railway (Step 1 above)
2. Set environment variables in Vercel (Step 2 above)
3. Redeploy frontend on Vercel
4. Test the application

Your application should now work on Vercel!

