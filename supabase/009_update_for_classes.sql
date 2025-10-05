-- ============================================
-- STEP 3: Update existing tables to support multi-class functionality
-- RUN THIS LAST (after 007 and 008)
-- ============================================

-- ============================================
-- UPDATE ACCOUNTS TABLE
-- ============================================

-- Add class_id column to accounts
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS accounts_class_id_idx ON public.accounts(class_id);

-- Remove old unique constraint (if exists)
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_user_id_key;

-- Add new unique constraint for (user_id, class_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'accounts_user_class_unique'
  ) THEN
    ALTER TABLE public.accounts
    ADD CONSTRAINT accounts_user_class_unique UNIQUE (user_id, class_id);
  END IF;
END $$;

-- Update RLS policies for accounts
DROP POLICY IF EXISTS "Students can view own account" ON public.accounts;
DROP POLICY IF EXISTS "Students can view own accounts" ON public.accounts;
CREATE POLICY "Students can view own accounts"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE student_id = auth.uid() AND class_id = accounts.class_id
    )
  );

DROP POLICY IF EXISTS "Teachers can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Teachers can view class accounts" ON public.accounts;
CREATE POLICY "Teachers can view class accounts"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = accounts.class_id AND teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can update all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Teachers can update class accounts" ON public.accounts;
CREATE POLICY "Teachers can update class accounts"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = accounts.class_id AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = accounts.class_id AND teacher_id = auth.uid()
    )
  );

-- Update account creation trigger
DROP TRIGGER IF EXISTS on_student_created ON public.profiles;
DROP FUNCTION IF EXISTS public.create_student_account();

CREATE OR REPLACE FUNCTION public.create_student_account_for_class()
RETURNS TRIGGER AS $$
DECLARE
  v_class_subject TEXT;
  v_currency TEXT;
BEGIN
  SELECT subject INTO v_class_subject
  FROM public.classes
  WHERE id = NEW.class_id;

  IF v_class_subject = 'astronomy' THEN
    v_currency := 'star-credits';
  ELSIF v_class_subject = 'earth-science' THEN
    v_currency := 'earth-points';
  ELSE
    v_currency := 'star-credits';
  END IF;

  INSERT INTO public.accounts (user_id, class_id, balance, currency)
  VALUES (NEW.student_id, NEW.class_id, 0, v_currency)
  ON CONFLICT (user_id, class_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_class_membership_created ON public.class_memberships;
CREATE TRIGGER on_class_membership_created
  AFTER INSERT ON public.class_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_account_for_class();

-- ============================================
-- UPDATE PRIZES TABLE
-- ============================================

ALTER TABLE public.prizes
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.prizes
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS prizes_class_id_idx ON public.prizes(class_id);
CREATE INDEX IF NOT EXISTS prizes_teacher_id_idx ON public.prizes(teacher_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view available prizes" ON public.prizes;
DROP POLICY IF EXISTS "Students can view available prizes in their classes" ON public.prizes;
CREATE POLICY "Students can view available prizes in their classes"
  ON public.prizes
  FOR SELECT
  TO authenticated
  USING (
    available = true AND (
      (class_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.class_memberships
        WHERE student_id = auth.uid() AND class_id = prizes.class_id
      )) OR
      (class_id IS NULL AND EXISTS (
        SELECT 1 FROM public.class_memberships cm
        JOIN public.classes c ON c.id = cm.class_id
        WHERE cm.student_id = auth.uid() AND c.teacher_id = prizes.teacher_id
      ))
    )
  );

DROP POLICY IF EXISTS "Teachers can view all prizes" ON public.prizes;
DROP POLICY IF EXISTS "Teachers can view own prizes" ON public.prizes;
CREATE POLICY "Teachers can view own prizes"
  ON public.prizes
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- ============================================
-- UPDATE PRIZE_REQUESTS TABLE
-- ============================================

ALTER TABLE public.prize_requests
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS prize_requests_class_id_idx ON public.prize_requests(class_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Students can view own prize requests" ON public.prize_requests;
DROP POLICY IF EXISTS "Students can view own class prize requests" ON public.prize_requests;
CREATE POLICY "Students can view own class prize requests"
  ON public.prize_requests
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE student_id = auth.uid() AND class_id = prize_requests.class_id
    )
  );

DROP POLICY IF EXISTS "Students can create prize requests" ON public.prize_requests;
DROP POLICY IF EXISTS "Students can create class prize requests" ON public.prize_requests;
CREATE POLICY "Students can create class prize requests"
  ON public.prize_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE student_id = auth.uid() AND class_id = prize_requests.class_id
    )
  );

DROP POLICY IF EXISTS "Teachers can view all prize requests" ON public.prize_requests;
DROP POLICY IF EXISTS "Teachers can view class prize requests" ON public.prize_requests;
CREATE POLICY "Teachers can view class prize requests"
  ON public.prize_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = prize_requests.class_id AND teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can update prize requests" ON public.prize_requests;
DROP POLICY IF EXISTS "Teachers can update class prize requests" ON public.prize_requests;
CREATE POLICY "Teachers can update class prize requests"
  ON public.prize_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = prize_requests.class_id AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = prize_requests.class_id AND teacher_id = auth.uid()
    )
  );

-- ============================================
-- UPDATE create_transaction FUNCTION
-- ============================================

DROP FUNCTION IF EXISTS public.create_transaction(UUID, TEXT, INTEGER, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_transaction(
  p_account_id UUID,
  p_type TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_user_id UUID;
  v_class_id UUID;
BEGIN
  SELECT balance, user_id, class_id INTO v_current_balance, v_user_id, v_class_id
  FROM public.accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF p_type IN ('deposit', 'adjustment') THEN
    v_new_balance := v_current_balance + p_amount;
  ELSIF p_type IN ('withdrawal', 'prize-redemption') THEN
    IF v_current_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    v_new_balance := v_current_balance - p_amount;
  ELSE
    RAISE EXCEPTION 'Invalid transaction type';
  END IF;

  INSERT INTO public.transactions (
    account_id, user_id, type, amount, balance_before, balance_after, reason, notes, created_by
  ) VALUES (
    p_account_id, v_user_id, p_type, p_amount, v_current_balance, v_new_balance, p_reason, p_notes, auth.uid()
  ) RETURNING id INTO v_transaction_id;

  UPDATE public.accounts
  SET balance = v_new_balance, last_updated = NOW()
  WHERE id = p_account_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION HELPER (Optional - for existing data)
-- ============================================

CREATE OR REPLACE FUNCTION public.migrate_existing_data_to_classes()
RETURNS TEXT AS $$
DECLARE
  v_teacher_id UUID;
  v_default_class_id UUID;
  v_student RECORD;
BEGIN
  SELECT id INTO v_teacher_id FROM public.profiles WHERE role = 'teacher' LIMIT 1;
  IF v_teacher_id IS NULL THEN
    RETURN 'No teacher found. Create a teacher account first.';
  END IF;

  SELECT id INTO v_default_class_id FROM public.classes WHERE teacher_id = v_teacher_id ORDER BY created_at LIMIT 1;
  IF v_default_class_id IS NULL THEN
    INSERT INTO public.classes (teacher_id, name, subject)
    VALUES (v_teacher_id, 'Default Class', 'both')
    RETURNING id INTO v_default_class_id;
  END IF;

  UPDATE public.accounts SET class_id = v_default_class_id WHERE class_id IS NULL;

  FOR v_student IN SELECT DISTINCT user_id FROM public.accounts WHERE class_id = v_default_class_id LOOP
    INSERT INTO public.class_memberships (class_id, student_id)
    VALUES (v_default_class_id, v_student.user_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  UPDATE public.prize_requests SET class_id = v_default_class_id WHERE class_id IS NULL;
  UPDATE public.prizes SET teacher_id = v_teacher_id WHERE teacher_id IS NULL;

  RETURN 'Migration completed. All data assigned to: ' || v_default_class_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment to run migration:
-- SELECT public.migrate_existing_data_to_classes();
