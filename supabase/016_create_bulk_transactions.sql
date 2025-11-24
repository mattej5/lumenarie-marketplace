-- ============================================
-- Bulk transaction helper for teachers
-- Awards the same amount to multiple accounts atomically
-- ============================================

DROP FUNCTION IF EXISTS public.create_bulk_transactions(UUID[], INTEGER, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_bulk_transactions(
  p_account_ids UUID[],
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (account_id UUID, transaction_id UUID) AS $$
DECLARE
  v_account_id UUID;
  v_tx_id UUID;
  v_allowed_count INTEGER;
BEGIN
  IF array_length(p_account_ids, 1) IS NULL OR array_length(p_account_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No accounts provided';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT COUNT(*) INTO v_allowed_count
  FROM public.accounts a
  JOIN public.classes c ON c.id = a.class_id
  WHERE a.id = ANY (p_account_ids)
    AND c.teacher_id = auth.uid();

  IF v_allowed_count <> array_length(p_account_ids, 1) THEN
    RAISE EXCEPTION 'One or more accounts are not in your classes';
  END IF;

  FOREACH v_account_id IN ARRAY p_account_ids LOOP
    v_tx_id := public.create_transaction(
      v_account_id,
      'deposit',
      p_amount,
      p_reason,
      p_notes
    );
    RETURN NEXT (v_account_id, v_tx_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
