// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const DUMMY_THINGSPEAK_URL = process.env.NEXT_PUBLIC_DUMMY_THINGSPEAK_URL || `${API_URL}/dummy-thingspeak`;

export async function analyzeStress(minutes: number, thingspeakUrl: string) {
  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      minutes: minutes,
      thingspeak_url: thingspeakUrl.trim(),
      use_dummy_data: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Analysis failed');
  }

  return response.json();
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

