-- ============================================
-- STEP 2: Create class_memberships table and add student policies to classes
-- RUN THIS AFTER 007
-- ============================================

-- Create class_memberships table to link students to classes
CREATE TABLE IF NOT EXISTS public.class_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'co-teacher')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS class_memberships_class_id_idx ON public.class_memberships(class_id);
CREATE INDEX IF NOT EXISTS class_memberships_student_id_idx ON public.class_memberships(student_id);
CREATE INDEX IF NOT EXISTS class_memberships_role_idx ON public.class_memberships(role);

-- Enable Row Level Security
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_memberships
CREATE POLICY "Students can view own memberships"
  ON public.class_memberships
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view class memberships"
  ON public.class_memberships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can add students to their classes"
  ON public.class_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update class memberships"
  ON public.class_memberships
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can remove students from classes"
  ON public.class_memberships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

-- NOW add the student policy to classes table (now that class_memberships exists)
CREATE POLICY "Students can view enrolled classes"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE class_id = id AND student_id = auth.uid()
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION public.add_student_to_class(
  p_class_id UUID,
  p_student_id UUID,
  p_role TEXT DEFAULT 'student'
)
RETURNS UUID AS $$
DECLARE
  v_membership_id UUID;
  v_class_subject TEXT;
  v_currency TEXT;
BEGIN
  -- Verify student exists and is a student
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_student_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'User is not a student';
  END IF;

  -- Get class subject to determine currency
  SELECT subject INTO v_class_subject
  FROM public.classes
  WHERE id = p_class_id;

  -- Determine currency based on subject
  IF v_class_subject = 'astronomy' THEN
    v_currency := 'star-credits';
  ELSIF v_class_subject = 'earth-science' THEN
    v_currency := 'earth-points';
  ELSE
    v_currency := 'star-credits';
  END IF;

  -- Create membership
  INSERT INTO public.class_memberships (class_id, student_id, role)
  VALUES (p_class_id, p_student_id, p_role)
  ON CONFLICT (class_id, student_id) DO NOTHING
  RETURNING id INTO v_membership_id;

  -- Create account for this class if membership was created
  IF v_membership_id IS NOT NULL THEN
    INSERT INTO public.accounts (user_id, class_id, balance, currency)
    VALUES (p_student_id, p_class_id, 0, v_currency)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_student_from_class(
  p_class_id UUID,
  p_student_id UUID
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.class_memberships
  WHERE class_id = p_class_id AND student_id = p_student_id;
  -- Note: Account is preserved for historical record
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_class_students(p_class_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  student_avatar TEXT,
  membership_role TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    p.avatar,
    cm.role,
    cm.joined_at
  FROM public.class_memberships cm
  JOIN public.profiles p ON p.id = cm.student_id
  WHERE cm.class_id = p_class_id
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
