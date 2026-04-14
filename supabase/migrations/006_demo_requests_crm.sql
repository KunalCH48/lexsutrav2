-- Migration 006: Add CRM columns to demo_requests
-- Run in Supabase SQL editor

ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'inbound',   -- 'inbound' | 'manual'
  ADD COLUMN IF NOT EXISTS contact_name TEXT;                     -- person name (especially for manual prospects)

-- Back-fill existing rows as inbound
UPDATE public.demo_requests SET source = 'inbound' WHERE source IS NULL;
