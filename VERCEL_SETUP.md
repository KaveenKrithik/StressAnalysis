# Vercel Deployment Setup Guide

## Quick Fix for Production Deployment

Your app is deployed on Vercel but not working on other devices because the backend URL is not configured. Follow these steps:

### Step 1: Deploy Your Backend

You need to deploy your backend separately. Choose one:

#### Option A: Railway (Recommended - Free)
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Click "Add Service" → "GitHub Repo"
6. In service settings:
   - Set **Root Directory** to `backend`
   - Railway will auto-detect Python
7. Wait for deployment (2-5 minutes)
8. Copy the deployment URL (e.g., `https://your-app.up.railway.app`)

#### Option B: Render (Free)
1. Go to https://render.com
2. Create a new account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
6. Deploy and copy the URL

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

```
NEXT_PUBLIC_API_URL = https://your-backend-url.up.railway.app
NEXT_PUBLIC_DUMMY_THINGSPEAK_URL = https://your-backend-url.up.railway.app/dummy-thingspeak
```

**Important:** Replace `https://your-backend-url.up.railway.app` with your actual backend URL from Step 1.

5. Click **Save**
6. Go to **Deployments** tab
7. Click the three dots (⋯) on the latest deployment → **Redeploy**

### Step 3: Verify Backend is Working

1. Open your backend URL in browser: `https://your-backend-url.up.railway.app/health`
2. You should see: `{"status":"ok"}`
3. Check API docs: `https://your-backend-url.up.railway.app/docs`

### Step 4: Test Your Vercel Deployment

1. Go to your Vercel deployment URL
2. Enter the dummy ThingSpeak URL: `https://your-backend-url.up.railway.app/dummy-thingspeak`
3. Enter minutes (e.g., 10)
4. Click "Start Live" or "Analyze"
5. It should work on any device!

## Troubleshooting

### Error: "Backend URL is not configured"
- Make sure you set `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Redeploy after adding environment variables

### Error: "Cannot connect to backend server"
- Verify your backend is running (check `/health` endpoint)
- Make sure CORS is enabled (backend already has `allow_origins=["*"]`)
- Check that the backend URL in Vercel matches your actual backend URL

### CORS Errors
- The backend already allows all origins with `allow_origins=["*"]`
- If you still see CORS errors, make sure the backend is redeployed

### Still Not Working?
1. Check browser console for errors
2. Verify environment variables are set correctly in Vercel
3. Make sure you redeployed after setting environment variables
4. Test the backend URL directly in your browser

## Environment Variables Summary

### Required in Vercel:
- `NEXT_PUBLIC_API_URL` - Your deployed backend URL
- `NEXT_PUBLIC_DUMMY_THINGSPEAK_URL` - Your backend URL + `/dummy-thingspeak`

### Example:
```
NEXT_PUBLIC_API_URL=https://stress-analysis.up.railway.app
NEXT_PUBLIC_DUMMY_THINGSPEAK_URL=https://stress-analysis.up.railway.app/dummy-thingspeak
```

## Notes

- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- After setting environment variables, you MUST redeploy for changes to take effect
- The backend CORS is already configured to allow all origins
- The app will automatically detect dummy URLs regardless of the backend domain

