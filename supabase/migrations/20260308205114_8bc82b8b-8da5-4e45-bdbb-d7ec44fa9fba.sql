
-- Recreate notify function for new reports
CREATE OR REPLACE FUNCTION public.notify_admins_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
  reporter_name text;
BEGIN
  SELECT display_name INTO reporter_name FROM public.profiles WHERE user_id = NEW.reported_by;
  
  FOR admin_user IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    IF admin_user.user_id IS DISTINCT FROM NEW.reported_by THEN
      INSERT INTO public.notifications (user_id, type, title, message, report_id)
      VALUES (
        admin_user.user_id,
        'new_report',
        'Ny rapport',
        COALESCE(reporter_name, 'Någon') || ' har skapat en ny rapport: ' || NEW.title,
        NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Recreate notify function for new comments
CREATE OR REPLACE FUNCTION public.notify_admins_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
  commenter_name text;
  report_title text;
BEGIN
  SELECT display_name INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT title INTO report_title FROM public.risk_reports WHERE id = NEW.report_id;
  
  FOR admin_user IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    IF admin_user.user_id IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, report_id)
      VALUES (
        admin_user.user_id,
        'new_comment',
        'Ny kommentar',
        COALESCE(commenter_name, 'Någon') || ' kommenterade på: ' || COALESCE(report_title, 'rapport'),
        NEW.report_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Drop triggers if they exist, then recreate
DROP TRIGGER IF EXISTS on_new_report_notify_admins ON public.risk_reports;
DROP TRIGGER IF EXISTS on_new_comment_notify_admins ON public.report_comments;

CREATE TRIGGER on_new_report_notify_admins
  AFTER INSERT ON public.risk_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_report();

CREATE TRIGGER on_new_comment_notify_admins
  AFTER INSERT ON public.report_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_comment();
