-- Create prizes table for available rewards
-- Teachers can manage the prize catalog, students can view available prizes

CREATE TABLE IF NOT EXISTS public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost > 0),
  category TEXT NOT NULL CHECK (category IN ('astronomy', 'earth-science', 'general')),
  icon TEXT,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS prizes_category_idx ON public.prizes(category);
CREATE INDEX IF NOT EXISTS prizes_available_idx ON public.prizes(available);
CREATE INDEX IF NOT EXISTS prizes_cost_idx ON public.prizes(cost);

-- Enable Row Level Security
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view available prizes
CREATE POLICY "Anyone can view available prizes"
  ON public.prizes
  FOR SELECT
  TO authenticated
  USING (available = true);

-- Teachers can view all prizes (including unavailable)
CREATE POLICY "Teachers can view all prizes"
  ON public.prizes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can insert prizes
CREATE POLICY "Teachers can create prizes"
  ON public.prizes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can update prizes
CREATE POLICY "Teachers can update prizes"
  ON public.prizes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can delete prizes
CREATE POLICY "Teachers can delete prizes"
  ON public.prizes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS prizes_updated_at ON public.prizes;
CREATE TRIGGER prizes_updated_at
  BEFORE UPDATE ON public.prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
