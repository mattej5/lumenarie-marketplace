-- Create prize_requests table for student prize redemption requests
-- Tracks the full workflow from request to fulfillment

CREATE TABLE IF NOT EXISTS public.prize_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES public.prizes(id) ON DELETE CASCADE,
  prize_cost INTEGER NOT NULL,
  custom_amount INTEGER,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'fulfilled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  fulfilled_at TIMESTAMPTZ
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS prize_requests_student_id_idx ON public.prize_requests(student_id);
CREATE INDEX IF NOT EXISTS prize_requests_prize_id_idx ON public.prize_requests(prize_id);
CREATE INDEX IF NOT EXISTS prize_requests_status_idx ON public.prize_requests(status);
CREATE INDEX IF NOT EXISTS prize_requests_requested_at_idx ON public.prize_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS prize_requests_reviewed_by_idx ON public.prize_requests(reviewed_by);

-- Enable Row Level Security
ALTER TABLE public.prize_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own prize requests
CREATE POLICY "Students can view own prize requests"
  ON public.prize_requests
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can create prize requests
CREATE POLICY "Students can create prize requests"
  ON public.prize_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Teachers can view all prize requests
CREATE POLICY "Teachers can view all prize requests"
  ON public.prize_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can update prize requests (approve/deny)
CREATE POLICY "Teachers can update prize requests"
  ON public.prize_requests
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

-- Function to approve prize request
-- Automatically creates transaction and deducts balance
CREATE OR REPLACE FUNCTION public.approve_prize_request(
  p_request_id UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_request public.prize_requests;
  v_account_id UUID;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM public.prize_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Get student's account
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE user_id = v_request.student_id;

  -- Create transaction (will deduct balance)
  PERFORM public.create_transaction(
    v_account_id,
    'prize-redemption',
    COALESCE(v_request.custom_amount, v_request.prize_cost),
    'Prize redemption: ' || (SELECT name FROM public.prizes WHERE id = v_request.prize_id),
    p_review_notes
  );

  -- Update request status
  UPDATE public.prize_requests
  SET status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      review_notes = p_review_notes
  WHERE id = p_request_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to approve prize request: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deny prize request
CREATE OR REPLACE FUNCTION public.deny_prize_request(
  p_request_id UUID,
  p_review_notes TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.prize_requests
  SET status = 'denied',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      review_notes = p_review_notes
  WHERE id = p_request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
