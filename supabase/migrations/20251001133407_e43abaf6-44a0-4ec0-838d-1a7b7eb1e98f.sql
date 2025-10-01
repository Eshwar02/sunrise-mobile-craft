-- Fix security issue: Set search_path for function
CREATE OR REPLACE FUNCTION update_last_accessed_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;