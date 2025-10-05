-- Add INSERT policy for profiles so users can create their own profile
-- This is needed for OAuth sign-ins where the trigger might not fire

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
