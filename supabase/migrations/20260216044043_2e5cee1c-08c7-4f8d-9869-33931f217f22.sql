-- Add timer_duration column to habits (in seconds, default 120 = 2 min)
ALTER TABLE public.habits ADD COLUMN timer_duration integer NOT NULL DEFAULT 120;