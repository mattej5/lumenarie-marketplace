-- ============================================
-- Fix infinite recursion in classes RLS policies
-- ============================================

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;

-- Create a simpler INSERT policy that doesn't check profiles table
-- The API layer already checks if user is a teacher before calling this
CREATE POLICY "Teachers can create classes"
  ON public.classes
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Update the create_default_class function to be more explicit about security
CREATE OR REPLACE FUNCTION public.create_default_class()
RETURNS TRIGGER
SECURITY DEFINER -- This allows it to bypass RLS
SET search_path = public
AS $$
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
$$ LANGUAGE plpgsql;