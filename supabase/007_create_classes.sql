-- ============================================
-- STEP 1: Create classes table
-- RUN THIS FIRST (after 001-006)
-- ============================================

-- Create classes table for teacher class management
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('astronomy', 'earth-science', 'both')),
  school_year TEXT,
  color_theme TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS classes_teacher_id_idx ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS classes_active_idx ON public.classes(active);
CREATE INDEX IF NOT EXISTS classes_subject_idx ON public.classes(subject);

-- Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for classes (student policies added in 008 after class_memberships exists)
CREATE POLICY "Teachers can view own classes"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create classes"
  ON public.classes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own classes"
  ON public.classes
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own classes"
  ON public.classes
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS classes_updated_at ON public.classes;
CREATE TRIGGER classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create default class for new teachers
CREATE OR REPLACE FUNCTION public.create_default_class()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    INSERT INTO public.classes (teacher_id, name, subject, school_year)
    VALUES (
      NEW.id,
      'My First Class',
      'both',
      EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create default class when teacher profile is created
DROP TRIGGER IF EXISTS on_teacher_created ON public.profiles;
CREATE TRIGGER on_teacher_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_class();
