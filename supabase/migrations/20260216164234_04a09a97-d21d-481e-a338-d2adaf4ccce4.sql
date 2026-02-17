-- Anchor habits (fixed daily habits like eating, waking up)
CREATE TABLE public.anchor_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'anchor',
  typical_time TIME WITHOUT TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anchor_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own anchors" ON public.anchor_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anchors" ON public.anchor_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anchors" ON public.anchor_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own anchors" ON public.anchor_habits FOR DELETE USING (auth.uid() = user_id);

-- Link habits to anchors
ALTER TABLE public.habits ADD COLUMN anchor_id UUID REFERENCES public.anchor_habits(id) ON DELETE SET NULL;
ALTER TABLE public.habits ADD COLUMN anchor_sort_order INTEGER NOT NULL DEFAULT 0;