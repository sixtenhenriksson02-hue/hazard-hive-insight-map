-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('new_report', 'new_comment')),
  title text NOT NULL,
  message text NOT NULL,
  report_id uuid REFERENCES public.risk_reports(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Function to notify admins on new report
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
  -- Get reporter name
  SELECT display_name INTO reporter_name FROM public.profiles WHERE user_id = NEW.reported_by;
  
  -- Notify all admins
  FOR admin_user IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Don't notify if the admin is the reporter
    IF admin_user.user_id != NEW.reported_by THEN
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

-- Function to notify admins on new comment
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
  -- Get commenter name
  SELECT display_name INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Get report title
  SELECT title INTO report_title FROM public.risk_reports WHERE id = NEW.report_id;
  
  -- Notify all admins
  FOR admin_user IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Don't notify if the admin is the commenter
    IF admin_user.user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, report_id)
      VALUES (
        admin_user.user_id,
        'new_comment',
        'Ny kommentar',
        COALESCE(commenter_name, 'Någon') || ' har kommenterat på: ' || COALESCE(report_title, 'en rapport'),
        NEW.report_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_new_report_notify_admins
  AFTER INSERT ON public.risk_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_report();

CREATE TRIGGER on_new_comment_notify_admins
  AFTER INSERT ON public.report_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_comment();