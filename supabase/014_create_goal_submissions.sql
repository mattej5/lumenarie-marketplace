-- ============================================
-- CREATE GOAL SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.goal_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS goal_submissions_student_idx ON public.goal_submissions(student_id);
CREATE INDEX IF NOT EXISTS goal_submissions_goal_idx ON public.goal_submissions(goal_id);
CREATE INDEX IF NOT EXISTS goal_submissions_class_idx ON public.goal_submissions(class_id);
CREATE INDEX IF NOT EXISTS goal_submissions_teacher_idx ON public.goal_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS goal_submissions_status_idx ON public.goal_submissions(status);
CREATE INDEX IF NOT EXISTS goal_submissions_created_idx ON public.goal_submissions(created_at);

-- Enable RLS
ALTER TABLE public.goal_submissions ENABLE ROW LEVEL SECURITY;

-- Set defaults from goal/class on insert (teacher_id, class_id, points if 0)
DROP FUNCTION IF EXISTS public.set_goal_submission_defaults();
CREATE OR REPLACE FUNCTION public.set_goal_submission_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_goal RECORD;
  v_class_teacher UUID;
BEGIN
  SELECT g.* INTO v_goal FROM public.goals g WHERE g.id = NEW.goal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid goal_id';
  END IF;

  IF NEW.class_id IS NULL THEN
    NEW.class_id := v_goal.class_id;
  END IF;

  IF NEW.teacher_id IS NULL THEN
    IF NEW.class_id IS NOT NULL THEN
      SELECT teacher_id INTO v_class_teacher FROM public.classes WHERE id = NEW.class_id;
      NEW.teacher_id := v_class_teacher;
    ELSE
      NEW.teacher_id := v_goal.teacher_id;
    END IF;
  END IF;

  IF NEW.points IS NULL OR NEW.points = 0 THEN
    NEW.points := COALESCE(v_goal.points, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS goal_submissions_defaults ON public.goal_submissions;
CREATE TRIGGER goal_submissions_defaults
  BEFORE INSERT ON public.goal_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_goal_submission_defaults();

-- RLS POLICIES

-- Students can view their own submissions (limited to classes they belong to)
DROP POLICY IF EXISTS "Students can view own submissions" ON public.goal_submissions;
CREATE POLICY "Students can view own submissions"
  ON public.goal_submissions
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() AND (
      class_id IS NULL OR EXISTS (
        SELECT 1 FROM public.class_memberships cm
        WHERE cm.student_id = auth.uid() AND cm.class_id = goal_submissions.class_id
      )
    )
  );

-- Students can create submissions for their classes
DROP POLICY IF EXISTS "Students can create submissions" ON public.goal_submissions;
CREATE POLICY "Students can create submissions"
  ON public.goal_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.class_memberships cm
      WHERE cm.student_id = auth.uid() AND cm.class_id = goal_submissions.class_id
    )
  );

-- Teachers can view submissions for their classes
DROP POLICY IF EXISTS "Teachers can view class submissions" ON public.goal_submissions;
CREATE POLICY "Teachers can view class submissions"
  ON public.goal_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = goal_submissions.class_id AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can update submissions (approve/deny, adjust points) for their classes
DROP POLICY IF EXISTS "Teachers can update class submissions" ON public.goal_submissions;
CREATE POLICY "Teachers can update class submissions"
  ON public.goal_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = goal_submissions.class_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = goal_submissions.class_id AND c.teacher_id = auth.uid()
    )
  );

-- Optional: teachers can delete submissions in their classes
DROP POLICY IF EXISTS "Teachers can delete class submissions" ON public.goal_submissions;
CREATE POLICY "Teachers can delete class submissions"
  ON public.goal_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = goal_submissions.class_id AND c.teacher_id = auth.uid()
    )
  );

-- Update timestamp trigger
DROP TRIGGER IF EXISTS goal_submissions_updated_at ON public.goal_submissions;
CREATE TRIGGER goal_submissions_updated_at
  BEFORE UPDATE ON public.goal_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

