-- ============================================
-- CREATE GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL CHECK (points > 0),
  available BOOLEAN NOT NULL DEFAULT true,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS goals_available_idx ON public.goals(available);
CREATE INDEX IF NOT EXISTS goals_points_idx ON public.goals(points);
CREATE INDEX IF NOT EXISTS goals_class_id_idx ON public.goals(class_id);
CREATE INDEX IF NOT EXISTS goals_teacher_id_idx ON public.goals(teacher_id);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Students can view available goals in their classes (or teacher-wide goals)
DROP POLICY IF EXISTS "Students can view available goals in classes" ON public.goals;
CREATE POLICY "Students can view available goals in classes"
  ON public.goals
  FOR SELECT
  TO authenticated
  USING (
    available = true AND (
      (class_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.class_memberships cm
        WHERE cm.student_id = auth.uid() AND cm.class_id = goals.class_id
      )) OR
      (class_id IS NULL AND EXISTS (
        SELECT 1 FROM public.class_memberships cm
        JOIN public.classes c ON c.id = cm.class_id
        WHERE cm.student_id = auth.uid() AND c.teacher_id = goals.teacher_id
      ))
    )
  );

-- Teachers can view their own goals (any availability)
DROP POLICY IF EXISTS "Teachers can view own goals" ON public.goals;
CREATE POLICY "Teachers can view own goals"
  ON public.goals
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Teachers can create goals they own
DROP POLICY IF EXISTS "Teachers can create goals" ON public.goals;
CREATE POLICY "Teachers can create goals"
  ON public.goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- Teachers can update their own goals
DROP POLICY IF EXISTS "Teachers can update own goals" ON public.goals;
CREATE POLICY "Teachers can update own goals"
  ON public.goals
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can delete their own goals
DROP POLICY IF EXISTS "Teachers can delete own goals" ON public.goals;
CREATE POLICY "Teachers can delete own goals"
  ON public.goals
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS goals_updated_at ON public.goals;
CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

