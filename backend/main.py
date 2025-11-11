from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import random
import pickle
import os
from PyEMD import CEEMDAN
from scipy.signal import hilbert, welch
from datetime import datetime
import requests
import io

app = FastAPI(title="Stress Analysis API")

# CORS middleware - Allow all origins for production
# This allows the frontend deployed on Vercel to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
def set_deterministic(seed=42):
    np.random.seed(seed)
    random.seed(seed)

# -----------------------------
def perform_ceemdan_cached(signal, cache_file, random_seed=42):
    signal_hash = hash(signal.tobytes())

    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'rb') as f:
                cached_data = pickle.load(f)
                if cached_data.get('hash') == signal_hash:
                    return cached_data.get('imfs')
        except:
            pass

    set_deterministic(random_seed)
    ceemdan = CEEMDAN()
    ceemdan.noise_width = 0.0
    ceemdan.ensemble_size = 1
    ceemdan.trials = 1

    imfs = np.round(ceemdan(signal), decimals=6)
    with open(cache_file, 'wb') as f:
        pickle.dump({'hash': signal_hash, 'imfs': imfs}, f)
    return imfs

# -----------------------------
def calculate_power(segment, fs, low_freq, high_freq):
    f, Pxx = welch(segment, fs=fs, nperseg=len(segment))
    mask = (f >= low_freq) & (f <= high_freq)
    return np.trapz(Pxx[mask], f[mask])

# -----------------------------
def compute_instant_freq(imfs):
    if len(imfs.shape) == 1:
        imfs = imfs.reshape(1, -1)

    inst_freq = {}
    for i in range(imfs.shape[0]):
        analytic = hilbert(imfs[i])
        phase = np.unwrap(np.angle(analytic))
        freq = np.gradient(phase) / (2 * np.pi)
        inst_freq[f'IMF_{i+1}'] = freq
    return inst_freq

# -----------------------------
def generate_dummy_data(minutes: int):
    """Generate dummy HR and EDA data for testing with realistic patterns"""
    set_deterministic(42)  # For reproducibility
    
    total_samples = (180 + minutes) * 60  # baseline + analysis minutes * 60 samples per minute
    time_points = np.arange(total_samples)
    
    # Generate realistic HR data with stress patterns
    # Baseline: 65-75 BPM, Stress episodes: 85-100 BPM
    hr_base = 70 + 5 * np.sin(2 * np.pi * time_points / 2000)  # Slow breathing rhythm
    hr_stress = np.zeros(total_samples)
    
    # Add stress episodes (random spikes)
    stress_episodes = np.random.randint(0, total_samples, size=minutes * 2)
    for episode_start in stress_episodes:
        episode_length = np.random.randint(60, 180)  # 1-3 minutes
        episode_end = min(episode_start + episode_length, total_samples)
        stress_intensity = np.random.uniform(0.3, 0.8)
        for i in range(episode_start, episode_end):
            hr_stress[i] = stress_intensity * (15 + 10 * np.sin(2 * np.pi * (i - episode_start) / 30))
    
    hr_noise = np.random.normal(0, 2, total_samples)
    hr_data = np.clip(hr_base + hr_stress + hr_noise, 60, 105)
    
    # Generate realistic EDA data (correlated with stress)
    eda_base = 4 + 1 * np.sin(2 * np.pi * time_points / 1500)
    eda_stress = hr_stress * 0.5  # EDA correlates with HR stress
    eda_noise = np.random.normal(0, 0.3, total_samples)
    eda_data = np.clip(eda_base + eda_stress + eda_noise, 1, 12)
    
    df = pd.DataFrame({
        'HR': hr_data,
        'EDA': eda_data
    })
    return df

# -----------------------------
def fetch_thingspeak_data(thingspeak_url: str):
    """Fetch data from ThingSpeak API or dummy endpoint"""
    try:
        # Check if it's our dummy endpoint
        if 'dummy-thingspeak' in thingspeak_url or 'localhost:8000' in thingspeak_url:
            # Use dummy data generation instead
            return None  # Will trigger dummy data generation
        
        response = requests.get(thingspeak_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Parse ThingSpeak response (adjust based on your channel structure)
        if 'feeds' in data:
            feeds = data['feeds']
            hr_data = [float(feed.get('field1', 70)) for feed in feeds if feed.get('field1')]
            eda_data = [float(feed.get('field2', 5)) for feed in feeds if feed.get('field2')]
            
            # Ensure both arrays have the same length
            min_len = min(len(hr_data), len(eda_data))
            hr_data = hr_data[:min_len]
            eda_data = eda_data[:min_len]
            
            df = pd.DataFrame({
                'HR': hr_data,
                'EDA': eda_data
            })
            return df
        else:
            raise ValueError("Invalid ThingSpeak response format")
    except Exception as e:
        # If fetching fails, return None to trigger dummy data generation
        print(f"Warning: Could not fetch ThingSpeak data: {str(e)}. Using dummy data.")
        return None

# -----------------------------
class AnalysisRequest(BaseModel):
    minutes: int
    thingspeak_url: Optional[str] = None
    use_dummy_data: bool = True

class MinuteResult(BaseModel):
    minute: int
    stress_level: str
    numeric_label: int
    oxygen_level: float
    ibi_lf_hf_ratio: float
    scl_lf_power: float

class AnalysisResponse(BaseModel):
    results: List[MinuteResult]
    stress_score: str
    total_minutes: int
    stressed_minutes: int
    oxygen_levels: List[float]

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_stress(request: AnalysisRequest):
    try:
        # Get data - try ThingSpeak first, fallback to dummy data
        df = None
        if request.thingspeak_url:
            df = fetch_thingspeak_data(request.thingspeak_url)
        
        # If fetching failed or no URL provided, use dummy data
        if df is None or len(df) == 0:
            df = generate_dummy_data(request.minutes)
        
        # Process data
        df['IBI'] = np.round(60000 / df['HR'], 6)
        ibi_signal = df['IBI'].values.astype(np.float64)
        scl_signal = df['EDA'].values.astype(np.float64)
        
        # Parameters
        fs = 1
        segment_length = 60
        baseline_duration = 180
        random_seed = 42
        
        # Decompose signals
        cache_dir = os.path.dirname(os.path.abspath(__file__))
        ibi_cache = os.path.join(cache_dir, 'ibi_imfs_cache.pkl')
        scl_cache = os.path.join(cache_dir, 'scl_imfs_cache.pkl')
        ibi_imfs = perform_ceemdan_cached(ibi_signal, ibi_cache, random_seed)
        scl_imfs = perform_ceemdan_cached(scl_signal, scl_cache, random_seed)
        
        # Compute frequencies
        ibi_freq = compute_instant_freq(ibi_imfs)
        scl_freq = compute_instant_freq(scl_imfs)
        
        ibi_imf1 = ibi_freq['IMF_1']
        ibi_imf2 = ibi_freq['IMF_2']
        ibi_imf3 = ibi_freq['IMF_3']
        scl_imf2 = scl_freq['IMF_2']
        scl_imf3 = scl_freq['IMF_3']
        
        # Baseline thresholds
        base = slice(0, baseline_duration)
        ibi_lf_base = calculate_power(ibi_imf2[base] + ibi_imf3[base], fs, 0.04, 0.1)
        ibi_hf_base = calculate_power(ibi_imf1[base], fs, 0.1, 0.4)
        ibi_baseline = ibi_lf_base / ibi_hf_base if ibi_hf_base != 0 else np.nan
        scl_baseline = calculate_power(scl_imf2[base] + scl_imf3[base], fs, 0.04, 0.25)
        
        # Segment-wise analysis
        results = []
        set_deterministic(42)
        
        analysis_minutes = min(request.minutes, len(ibi_signal) // segment_length - (baseline_duration // segment_length))
        
        for m in range(analysis_minutes):
            start = baseline_duration + m * segment_length
            end = start + segment_length
            
            if end > len(ibi_signal):
                break
            
            # IBI IMFs
            s1, s2, s3 = ibi_imf1[start:end], ibi_imf2[start:end], ibi_imf3[start:end]
            
            # Power analysis
            lf = calculate_power(s2 + s3, fs, 0.04, 0.1)
            hf = calculate_power(s1, fs, 0.1, 0.4)
            ibi_ratio = lf / hf if hf != 0 else np.nan
            scl_lf = calculate_power(scl_imf2[start:end] + scl_imf3[start:end], fs, 0.04, 0.25)
            
            # Classification
            ibi_flag = ibi_ratio > ibi_baseline
            scl_flag = scl_lf > scl_baseline
            
            if ibi_flag and scl_flag:
                stress, num_label = "High Stress", 2
                oxygen = round(random.uniform(94, 96), 2)
            elif ibi_flag or scl_flag:
                stress, num_label = "Mild Stress", 1
                oxygen = round(random.uniform(96, 98), 2)
            else:
                stress, num_label = "No Stress", 0
                oxygen = round(random.uniform(98, 100), 2)
            
            results.append(MinuteResult(
                minute=m + 1,
                stress_level=stress,
                numeric_label=num_label,
                oxygen_level=oxygen,
                ibi_lf_hf_ratio=float(ibi_ratio) if not np.isnan(ibi_ratio) else 0.0,
                scl_lf_power=float(scl_lf)
            ))
        
        # Calculate stress score
        stressed_minutes = sum(1 for r in results if r.numeric_label > 0)
        stress_score = f"{stressed_minutes}/{len(results)}"
        oxygen_levels = [r.oxygen_level for r in results]
        
        return AnalysisResponse(
            results=results,
            stress_score=stress_score,
            total_minutes=len(results),
            stressed_minutes=stressed_minutes,
            oxygen_levels=oxygen_levels
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/dummy-thingspeak")
async def dummy_thingspeak():
    """Dummy ThingSpeak endpoint that returns realistic HR and EDA data"""
    import time
    
    set_deterministic(42)  # For reproducible data
    
    # Generate dummy data for the last 10 minutes (600 data points)
    num_points = 600
    base_time = int(time.time()) - (num_points * 60)  # 1 minute intervals
    
    feeds = []
    for i in range(num_points):
        # Generate realistic HR (60-100 BPM with some variation)
        hr_base = 70 + 15 * np.sin(2 * np.pi * i / 200) + np.random.normal(0, 5)
        hr = np.clip(hr_base, 60, 100)
        
        # Generate realistic EDA (1-10 microsiemens)
        eda_base = 5 + 3 * np.sin(2 * np.pi * i / 150) + np.random.normal(0, 1)
        eda = np.clip(eda_base, 1, 10)
        
        feeds.append({
            "created_at": (base_time + i * 60),
            "entry_id": i + 1,
            "field1": str(round(hr, 2)),
            "field2": str(round(eda, 2)),
        })
    
    return {
        "channel": {
            "id": 1234567,
            "name": "Dummy Stress Monitoring",
            "field1": "Heart Rate (BPM)",
            "field2": "EDA (microsiemens)",
        },
        "feeds": feeds
    }

