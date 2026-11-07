CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'display_name'), ''), 'Anonym'));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker'::public.app_role);
  RETURN NEW;
END;
$$;