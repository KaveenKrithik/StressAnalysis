# Stress Analysis Dashboard

A modern, Linear-inspired web application for real-time stress monitoring and analysis using CEEMDAN decomposition, ThingSpeak integration, and data visualization.

## Features

- Real-time Stress Analysis: Calculate stress levels (No Stress, Mild Stress, High Stress) using IBI and SCL signals
- Data Visualizations: Interactive pie charts and bar charts for stress distribution and minute-by-minute analysis
- Oxygen Level Monitoring: Display oxygen saturation levels for each analyzed minute
- Stress Score Calculation: Calculate stress scores (e.g., 3/10 - 3 minutes stressed out of 10)
- ThingSpeak Integration: Connect to ThingSpeak devices for real-time data collection
- Linear-inspired UI: Modern, sleek dark-themed interface with smooth animations
- Fast API Backend: Python FastAPI server for stress analysis calculations

## Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for data visualization
- Lucide React for icons

### Backend
- FastAPI
- Python 3.8+
- EMD-signal (CEEMDAN decomposition)
- SciPy (signal processing)
- NumPy & Pandas (data processing)
- Requests (ThingSpeak API)

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pip (Python package manager)

## Setup Instructions

### Step 1: Install Frontend Dependencies

From the project root directory, run:

```bash
npm install
```

This will install all required Node.js dependencies including Next.js, React, Recharts, and shadcn/ui components.

### Step 2: Install Backend Dependencies

Navigate to the backend directory and set up a Python virtual environment:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

On Windows:
```bash
venv\Scripts\activate
```

On Mac/Linux:
```bash
source venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

This will install FastAPI, EMD-signal, NumPy, Pandas, SciPy, and other required packages.

### Step 3: Start Backend Server

From the backend directory (with virtual environment activated), start the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

Alternatively, use the provided startup scripts:

- Windows: Double-click `start_backend.bat` or run `backend\run.bat`
- Mac/Linux: Run `bash backend/run.sh`

The backend API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Step 4: Start Frontend Server

Open a new terminal window, navigate to the project root directory, and start the development server:

```bash
npm run dev
```

Alternatively, use the provided script:

- Windows: Double-click `start_frontend.bat`

The frontend will be available at `http://localhost:3000`

### Step 5: Use the Application

1. Open `http://localhost:3000` in your browser
2. Enter your ThingSpeak URL (or use the dummy endpoint: `http://localhost:8000/dummy-thingspeak`)
3. Enter the number of minutes to analyze (1-60)
4. Click "Start Analysis"
5. View the results in the dashboard

## How It Works

### Stress Analysis Algorithm

1. Data Collection: Fetches HR (Heart Rate) and EDA (Electrodermal Activity) data from ThingSpeak or uses dummy data
2. Signal Processing: 
   - Converts HR to IBI (Inter-Beat Interval)
   - Applies CEEMDAN decomposition to separate signal components
3. Feature Extraction:
   - Calculates instant frequency for IMFs (Intrinsic Mode Functions)
   - Computes power in LF (Low Frequency) and HF (High Frequency) bands
4. Baseline Calculation: Uses first 3 minutes (180 seconds) as baseline
5. Stress Classification:
   - High Stress: Both IBI and SCL indicators exceed baseline
   - Mild Stress: One indicator exceeds baseline
   - No Stress: Both indicators within normal range
6. Oxygen Calculation: Generates oxygen levels based on stress classification

### Stress Score

The stress score is calculated as `stressed_minutes/total_minutes`. For example:
- 3/10 means 3 minutes were stressed out of 10 total minutes
- 0/10 means no stress detected in any minute

The system analyzes each 1-minute segment separately and calculates stress levels for each minute.

## API Endpoints

### POST /analyze

Analyze stress levels for specified duration.

Request Body:
```json
{
  "minutes": 10,
  "thingspeak_url": "https://api.thingspeak.com/channels/..."
}
```

Response:
```json
{
  "results": [
    {
      "minute": 1,
      "stress_level": "No Stress",
      "numeric_label": 0,
      "oxygen_level": 98.5,
      "ibi_lf_hf_ratio": 1.2345,
      "scl_lf_power": 0.1234
    }
  ],
  "stress_score": "3/10",
  "total_minutes": 10,
  "stressed_minutes": 3,
  "oxygen_levels": [98.5, 97.2, ...]
}
```

### GET /health

Health check endpoint.

### GET /dummy-thingspeak

Dummy ThingSpeak endpoint that returns realistic HR and EDA data for testing.

## ThingSpeak Integration

To connect your ThingSpeak device:

1. Get your ThingSpeak channel API URL:
   - Format: `https://api.thingspeak.com/channels/{CHANNEL_ID}/feeds.json?api_key={API_KEY}&results={N}`
   - Replace `{CHANNEL_ID}` with your channel ID
   - Replace `{API_KEY}` with your read API key
   - Replace `{N}` with the number of data points needed

2. Enter the URL in the dashboard

3. Ensure your ThingSpeak channel has:
   - Field 1: Heart Rate (HR) in BPM
   - Field 2: Electrodermal Activity (EDA) in microsiemens

For testing without a device, use the dummy endpoint: `http://localhost:8000/dummy-thingspeak`

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   ├── run.bat             # Windows startup script
│   ├── run.sh              # Linux/Mac startup script
│   └── start_server.bat    # Alternative startup script
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   └── utils.ts            # Utility functions
├── package.json            # Node.js dependencies
├── tailwind.config.ts      # Tailwind configuration
├── start_backend.bat       # Backend startup script
├── start_frontend.bat      # Frontend startup script
└── README.md               # This file
```

## Development

### Running in Development Mode

Backend:
```bash
cd backend
venv\Scripts\activate  # Windows
python -m uvicorn main:app --reload --port 8000
```

Frontend:
```bash
npm run dev
```

### Building for Production

Frontend:
```bash
npm run build
npm start
```

Backend:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Backend Issues

- Make sure Python 3.8+ is installed
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Check if port 8000 is available
- Ensure virtual environment is activated
- If PyEMD import fails, make sure EMD-signal package is installed

### Frontend Issues

- Make sure Node.js 18+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check if port 3000 is available
- Clear browser cache if styles are not loading

### API Connection Issues

- Make sure the backend is running on port 8000
- Check browser console for CORS errors
- Verify the ThingSpeak URL is correct
- Use the dummy endpoint for testing: `http://localhost:8000/dummy-thingspeak`

### Analysis Issues

- Ensure sufficient data points are available (at least 3 minutes baseline + analysis minutes)
- Check that ThingSpeak channel has field1 (HR) and field2 (EDA)
- Verify data format is correct (HR in BPM, EDA in microsiemens)

## UI Design

The application features a Linear-inspired design with:

- Dark theme with pure black background
- Glass morphism cards with backdrop blur
- Smooth animations and transitions
- Gradient charts and visualizations
- Modern typography and spacing
- Responsive design for all screen sizes

### Chart Types

1. Stress Distribution: Donut pie chart with gradients showing overall stress breakdown
2. Minute-by-Minute: Color-coded bar chart showing stress levels for each minute
3. Oxygen Trends: Area chart with gradient fill showing oxygen levels over time
4. Stress & Oxygen Correlation: Combined chart showing relationship between stress and oxygen
5. Detailed Table: Complete breakdown of each minute with all metrics

### Color Scheme

- No Stress: Emerald Green (#10b981)
- Mild Stress: Amber (#f59e0b)
- High Stress: Red (#ef4444)
- Background: Pure Black (#0a0a0a)
- Accents: Linear Blue (#5e6ad2)

## Notes

- The system uses a 3-minute (180-second) baseline for threshold calculation
- Analysis is performed on 1-minute segments
- Dummy data is available for testing without a ThingSpeak device
- Cache files are created for CEEMDAN decomposition to speed up repeated analyses
- The application calculates stress for each minute separately as requested

## Access URLs

- Frontend Dashboard: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Dummy ThingSpeak Endpoint: http://localhost:8000/dummy-thingspeak

## Deployment

### Important Notes

- Vercel only hosts the frontend (Next.js)
- The backend (FastAPI) must be deployed separately on Railway, Render, or similar platform
- Deploy the backend first, then configure the frontend with the backend URL

### Backend Deployment (Railway - Recommended)

1. Go to [Railway](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Add a new service and select "GitHub Repo"
4. Set the root directory to `backend`
5. Railway will automatically detect Python and install dependencies
6. The backend will be available at a URL like `https://your-app.railway.app`
7. Note the backend URL for frontend configuration

### Backend Deployment (Render)

1. Go to [Render](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Configure:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3
4. Deploy and note the backend URL

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Vercel will automatically detect Next.js
4. Before deploying, add environment variables in Vercel settings:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g., `https://your-app.railway.app`)
   - `NEXT_PUBLIC_DUMMY_THINGSPEAK_URL`: Your backend URL + `/dummy-thingspeak`
5. Deploy the frontend
6. Your app will be available at `https://your-project.vercel.app`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Backend API URL (required for production)
- `NEXT_PUBLIC_DUMMY_THINGSPEAK_URL`: Dummy endpoint URL (optional)

### Backend (Railway/Render)
- No special environment variables required
- Port is automatically set by the platform

## License

This project is for research and educational purposes.

## Contributors

Created for PhD research in stress monitoring and analysis.
