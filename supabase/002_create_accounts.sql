-- Create accounts table for student balances
-- Each student has one account that tracks their balance and currency type

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('star-credits', 'earth-points')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS accounts_balance_idx ON public.accounts(balance);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own account
CREATE POLICY "Students can view own account"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Teachers can view all accounts
CREATE POLICY "Teachers can view all accounts"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can update all accounts
CREATE POLICY "Teachers can update all accounts"
  ON public.accounts
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

-- Teachers can insert accounts
CREATE POLICY "Teachers can create accounts"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Trigger to update last_updated timestamp
DROP TRIGGER IF EXISTS accounts_last_updated ON public.accounts;
CREATE TRIGGER accounts_last_updated
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create account for new students
CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.accounts (user_id, balance, currency)
    VALUES (NEW.id, 0, 'star-credits');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create account when student profile is created
DROP TRIGGER IF EXISTS on_student_created ON public.profiles;
CREATE TRIGGER on_student_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_account();
