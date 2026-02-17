ALTER TABLE public.profiles ADD COLUMN wake_time time without time zone NOT NULL DEFAULT '06:00';
ALTER TABLE public.profiles ADD COLUMN sleep_time time without time zone NOT NULL DEFAULT '22:00';