
-- Add is_system flag to anchor_habits
ALTER TABLE public.anchor_habits ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;
