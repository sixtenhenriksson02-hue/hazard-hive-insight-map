
-- Add invite_code column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate codes for existing projects
UPDATE public.projects SET invite_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6)) WHERE invite_code IS NULL;

-- Make it not null with a default
ALTER TABLE public.projects ALTER COLUMN invite_code SET DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
ALTER TABLE public.projects ALTER COLUMN invite_code SET NOT NULL;

-- Create function to auto-generate invite code on insert
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invite_code
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invite_code();
