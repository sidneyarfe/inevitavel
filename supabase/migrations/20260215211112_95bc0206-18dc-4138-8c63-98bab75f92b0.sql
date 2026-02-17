
-- Table to store friction audit responses
CREATE TABLE public.friction_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  execution_id UUID NOT NULL REFERENCES public.daily_executions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  suggestion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friction_audits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own audits" ON public.friction_audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audits" ON public.friction_audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own audits" ON public.friction_audits FOR DELETE USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX idx_friction_audits_execution ON public.friction_audits(execution_id);
CREATE INDEX idx_friction_audits_user_date ON public.friction_audits(user_id, created_at);
