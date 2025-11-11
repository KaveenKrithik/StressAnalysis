# Deployment Guide

## Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Vercel will automatically detect Next.js and configure the project

### Step 2: Configure Environment Variables

In your Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_DUMMY_THINGSPEAK_URL=https://your-backend-url.railway.app/dummy-thingspeak
```

Replace `https://your-backend-url.railway.app` with your actual deployed backend URL.

### Step 3: Deploy

Vercel will automatically deploy your frontend. Your app will be available at `https://your-project.vercel.app`

## Backend Deployment (Railway)

### Step 1: Prepare Backend for Deployment

The backend is already configured for deployment. Make sure `requirements.txt` is up to date.

### Step 2: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Select the `backend` directory as the root
5. Railway will automatically detect Python and install dependencies

### Step 3: Configure Environment Variables

Railway will automatically set up the environment. The backend will be available at a URL like:
`https://your-backend-name.up.railway.app`

### Step 4: Update CORS Settings

Update the backend `main.py` to include your Vercel domain in CORS origins:

```python
allow_origins=[
    "http://localhost:3000",
    "https://your-project.vercel.app",  # Your Vercel domain
    "https://*.vercel.app",  # All Vercel deployments
],
```

### Step 5: Update Frontend Environment Variables

Go back to Vercel and update the environment variables with your Railway backend URL:

```
NEXT_PUBLIC_API_URL=https://your-backend-name.up.railway.app
NEXT_PUBLIC_DUMMY_THINGSPEAK_URL=https://your-backend-name.up.railway.app/dummy-thingspeak
```

## Alternative: Deploy Backend to Render

### Step 1: Create Render Account

1. Go to [Render](https://render.com)
2. Create a new account

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3

### Step 3: Deploy

Render will automatically deploy your backend. Update your Vercel environment variables with the Render URL.

## Troubleshooting

### Frontend can't connect to backend

1. Check that the backend is deployed and running
2. Verify the `NEXT_PUBLIC_API_URL` environment variable in Vercel
3. Check browser console for CORS errors
4. Verify CORS settings in backend include your Vercel domain

### Backend not starting

1. Check Railway/Render logs for errors
2. Verify all dependencies are in `requirements.txt`
3. Check that the port is configured correctly (Railway uses `$PORT` env variable)

### CORS Errors

1. Update backend CORS origins to include your Vercel domain
2. Make sure `allow_credentials=True` is set
3. Redeploy backend after CORS changes

## Environment Variables Summary

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Your deployed backend URL
- `NEXT_PUBLIC_DUMMY_THINGSPEAK_URL`: Backend dummy endpoint URL

### Backend (Railway/Render)
- No special environment variables needed (uses defaults)
- Port is automatically set by the platform

## Quick Start for Production

1. Deploy backend to Railway/Render
2. Get the backend URL
3. Deploy frontend to Vercel
4. Set environment variables in Vercel:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_DUMMY_THINGSPEAK_URL` = your backend URL + `/dummy-thingspeak`
5. Update backend CORS to allow your Vercel domain
6. Redeploy both services

Your application should now work in production!

