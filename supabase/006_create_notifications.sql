-- Create notifications table for in-app notifications
-- Optional table for notifying students of prize request status changes

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- System/Teachers can create notifications for any user
CREATE POLICY "Teachers can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification when prize request is reviewed
CREATE OR REPLACE FUNCTION public.notify_prize_request_reviewed()
RETURNS TRIGGER AS $$
DECLARE
  v_prize_name TEXT;
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Only send notification if status changed to approved or denied
  IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'denied')) THEN
    -- Get prize name
    SELECT name INTO v_prize_name
    FROM public.prizes
    WHERE id = NEW.prize_id;

    -- Set notification content based on status
    IF NEW.status = 'approved' THEN
      v_title := 'Prize Request Approved! 🎉';
      v_message := 'Your request for "' || v_prize_name || '" has been approved!';
      v_type := 'success';
    ELSE
      v_title := 'Prize Request Updated';
      v_message := 'Your request for "' || v_prize_name || '" was reviewed.';
      v_type := 'info';
    END IF;

    -- Create notification
    PERFORM public.create_notification(
      NEW.student_id,
      v_title,
      v_message,
      v_type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to send notification when prize request is reviewed
DROP TRIGGER IF EXISTS prize_request_reviewed_notification ON public.prize_requests;
CREATE TRIGGER prize_request_reviewed_notification
  AFTER UPDATE ON public.prize_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_prize_request_reviewed();

-- Function to notify student of balance changes
CREATE OR REPLACE FUNCTION public.notify_balance_change()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Only notify on deposits (positive changes)
  IF NEW.type = 'deposit' THEN
    v_title := 'Credits Added! ⭐';
    v_message := 'You received ' || NEW.amount || ' credits. Reason: ' || COALESCE(NEW.reason, 'Not specified');
    v_type := 'success';

    PERFORM public.create_notification(
      NEW.user_id,
      v_title,
      v_message,
      v_type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify student of balance deposits
DROP TRIGGER IF EXISTS balance_change_notification ON public.transactions;
CREATE TRIGGER balance_change_notification
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_balance_change();
