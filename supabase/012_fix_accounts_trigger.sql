-- Fix the accounts table trigger to use last_updated instead of updated_at
-- The handle_updated_at() function expects an updated_at column, but accounts has last_updated

-- Create a new function specifically for accounts
CREATE OR REPLACE FUNCTION public.handle_accounts_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger
DROP TRIGGER IF EXISTS accounts_last_updated ON public.accounts;

-- Create the new trigger with the correct function
CREATE TRIGGER accounts_last_updated
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_accounts_last_updated();