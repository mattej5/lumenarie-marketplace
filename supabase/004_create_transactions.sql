-- Create transactions table for tracking all balance changes
-- Maintains a complete audit trail of all account activity

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'prize-redemption', 'adjustment')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_created_by_idx ON public.transactions(created_by);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own transactions
CREATE POLICY "Students can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Teachers can view all transactions
CREATE POLICY "Teachers can view all transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can insert transactions
CREATE POLICY "Teachers can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Function to create transaction and update account balance
-- This ensures atomicity and maintains balance integrity
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
BEGIN
  -- Get current account details
  SELECT balance, user_id INTO v_current_balance, v_user_id
  FROM public.accounts
  WHERE id = p_account_id
  FOR UPDATE; -- Lock the row to prevent race conditions

  -- Calculate new balance
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

  -- Create transaction record
  INSERT INTO public.transactions (
    account_id,
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    reason,
    notes,
    created_by
  ) VALUES (
    p_account_id,
    v_user_id,
    p_type,
    p_amount,
    v_current_balance,
    v_new_balance,
    p_reason,
    p_notes,
    auth.uid()
  ) RETURNING id INTO v_transaction_id;

  -- Update account balance
  UPDATE public.accounts
  SET balance = v_new_balance,
      last_updated = NOW()
  WHERE id = p_account_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
