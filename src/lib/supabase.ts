import { createClient } from '@supabase/supabase-js'

// Anon key = publishable (aman di frontend asal RLS aktif).
// Boleh di-override lewat env saat build lokal.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://frqvelcreczmnofldrga.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycXZlbGNyZWN6bW5vZmxkcmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzQyMDksImV4cCI6MjEwMzkxMDIwOX0.EQoGxEu8cNDF84tObZH13rwHiYt9EGcqnJiT3yRMa-w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AppRole = 'admin' | 'warranty_admin' | 'viewer' | 'branch_user'

export type UserRoleRow = {
  user_id: string
  role: AppRole
  branch_id: string | null
  display_name: string | null
  is_active: boolean
}
