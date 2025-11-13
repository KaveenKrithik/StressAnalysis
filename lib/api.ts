// API configuration
// In production, use environment variable or detect from current origin
function getApiUrl(): string {
  // First, try environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser, check if we're in production (not localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If not localhost, we're in production - but we can't guess the backend URL
    // So we'll use localhost as fallback and show an error
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.error('NEXT_PUBLIC_API_URL environment variable is not set in production!');
      // Return empty string to trigger error
      return '';
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:8000';
}

export const API_URL = getApiUrl();
export const DUMMY_THINGSPEAK_URL = process.env.NEXT_PUBLIC_DUMMY_THINGSPEAK_URL || 
  (API_URL ? `${API_URL}/dummy-thingspeak` : '');

// Helper function to detect if a URL is a dummy endpoint
function isDummyUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('/dummy-thingspeak') ||
    lowerUrl.includes('dummy-thingspeak') ||
    lowerUrl.includes('/dummy') ||
    (lowerUrl.includes(API_URL.toLowerCase()) && lowerUrl.includes('dummy'))
  );
}

export async function analyzeStress(minutes: number, thingspeakUrl: string) {
  // Check if it's the dummy URL and set use_dummy_data accordingly
  const isDummy = isDummyUrl(thingspeakUrl);
  
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        minutes: minutes,
        thingspeak_url: thingspeakUrl.trim(),
        use_dummy_data: isDummy,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Analysis failed');
    }

    return response.json();
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (!API_URL || API_URL === '') {
        throw new Error('Backend URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable in Vercel settings.');
      }
      throw new Error(`Cannot connect to backend server at ${API_URL}. Please ensure the backend is running and CORS is configured.`);
    }
    throw error;
  }
}

export async function checkHealth() {
  if (!API_URL || API_URL === '') {
    return false;
  }
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function analyzeLatestMinute(thingspeakUrl: string) {
  // Check if it's the dummy URL and set use_dummy_data accordingly
  const isDummy = isDummyUrl(thingspeakUrl);
  
  try {
    const response = await fetch(`${API_URL}/analyze-latest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        minutes: 1,
        thingspeak_url: thingspeakUrl.trim(),
        use_dummy_data: isDummy,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Analysis failed');
    }

    return response.json();
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (!API_URL || API_URL === '') {
        throw new Error('Backend URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable in Vercel settings.');
      }
      throw new Error(`Cannot connect to backend server at ${API_URL}. Please ensure the backend is running and CORS is configured.`);
    }
    throw error;
  }
}

