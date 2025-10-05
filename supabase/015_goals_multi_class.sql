-- ============================================
-- MIGRATION: Support multiple classes per goal
-- ============================================

-- 1) Create join table goal_classes (goal_id <-> class_id)
CREATE TABLE IF NOT EXISTS public.goal_classes (
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, class_id)
);

CREATE INDEX IF NOT EXISTS goal_classes_class_idx ON public.goal_classes(class_id);
CREATE INDEX IF NOT EXISTS goal_classes_goal_idx ON public.goal_classes(goal_id);

-- 2) Migrate existing data from goals.class_id to goal_classes
INSERT INTO public.goal_classes (goal_id, class_id)
SELECT id, class_id FROM public.goals WHERE class_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3) Drop and recreate RLS policy to use goal_classes instead of goals.class_id
DROP POLICY IF EXISTS "Students can view available goals in classes" ON public.goals;
CREATE POLICY "Students can view available goals in classes"
  ON public.goals
  FOR SELECT
  TO authenticated
  USING (
    available = true AND (
      (EXISTS (
        SELECT 1 FROM public.goal_classes gc
        JOIN public.class_memberships cm ON cm.class_id = gc.class_id
        WHERE gc.goal_id = goals.id AND cm.student_id = auth.uid()
      )) OR
      (NOT EXISTS (
        SELECT 1 FROM public.goal_classes gc WHERE gc.goal_id = goals.id
      ) AND EXISTS (
        SELECT 1 FROM public.class_memberships cm
        JOIN public.classes c ON c.id = cm.class_id
        WHERE cm.student_id = auth.uid() AND c.teacher_id = goals.teacher_id
      ))
    )
  );

-- 4) Drop old column and index
DROP INDEX IF EXISTS goals_class_id_idx;
ALTER TABLE public.goals DROP COLUMN IF EXISTS class_id;

-- 5) Update set_goal_submission_defaults function to not rely on goals.class_id
DROP TRIGGER IF EXISTS goal_submissions_defaults ON public.goal_submissions;
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

  -- Determine teacher_id
  IF NEW.teacher_id IS NULL THEN
    IF NEW.class_id IS NOT NULL THEN
      SELECT teacher_id INTO v_class_teacher FROM public.classes WHERE id = NEW.class_id;
      NEW.teacher_id := v_class_teacher;
    ELSE
      NEW.teacher_id := v_goal.teacher_id;
    END IF;
  END IF;

  -- If points unspecified/zero, default to goal.points
  IF NEW.points IS NULL OR NEW.points = 0 THEN
    NEW.points := COALESCE(v_goal.points, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER goal_submissions_defaults
  BEFORE INSERT ON public.goal_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_goal_submission_defaults();

