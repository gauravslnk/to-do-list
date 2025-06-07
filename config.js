// This works because Vite automatically replaces these during build
const CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID, // ← Gets replaced with actual value
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY      // ← From Vercel's servers
};
