// ─── Supabase Client ──────────────────────────────────────────────────────────
//
// Fill in your Supabase project URL and anon key below.
// Get them from: https://supabase.com/dashboard → Project Settings → API
//
// IMPORTANT: Run this SQL in Supabase SQL Editor to create the rooms table:
//
//   create table if not exists public.rooms (
//     id text primary key,
//     data jsonb not null,
//     created_at timestamptz default now()
//   );
//   alter table public.rooms enable row level security;
//   create policy "Allow all" on public.rooms for all using (true);
//   -- Enable realtime for the rooms table:
//   alter publication supabase_realtime add table public.rooms;
//

import { createClient } from '@supabase/supabase-js';

// ← Replace these with your actual project values for production cross-device sync:
export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export const ROOMS_TABLE = 'rooms';
