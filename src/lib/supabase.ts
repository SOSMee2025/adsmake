import { createClient } from '@supabase/supabase-js';

const cleanUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/^"|"$/g, '');
const cleanKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/^"|"$/g, '');

if (!cleanUrl || !cleanKey) {
  console.error('Supabase configuration missing or invalid. Check .env.local and Vercel settings.');
}

// Initialize the Supabase client
export const supabase = createClient(cleanUrl, cleanKey);
