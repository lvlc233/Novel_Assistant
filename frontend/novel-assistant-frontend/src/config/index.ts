/**
 * Global Config Center
 * Prefer Environment Variables
 */

const getEnvVar = (key: string, defaultValue: string) => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key] as string;
  }
  return defaultValue;
};

// Backend API URL
const API_BASE_URL = getEnvVar("NEXT_PUBLIC_API_URL", "http://localhost:8426");

export const config = {
  work: {
    baseUrl: API_BASE_URL,
    apiBaseUrl: `${API_BASE_URL}`,
  },
};
