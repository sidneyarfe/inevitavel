
-- Add notification preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN notify_briefing BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN notify_habits BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN briefing_hour INTEGER NOT NULL DEFAULT 21;
