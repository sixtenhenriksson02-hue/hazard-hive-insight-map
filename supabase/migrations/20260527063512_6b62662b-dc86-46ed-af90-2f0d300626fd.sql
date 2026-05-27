
CREATE TABLE public.clarification_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_clarification_messages_report ON public.clarification_messages(report_id);
CREATE INDEX idx_clarification_messages_recipient ON public.clarification_messages(recipient_id);

GRANT SELECT, INSERT, UPDATE ON public.clarification_messages TO authenticated;
GRANT ALL ON public.clarification_messages TO service_role;

ALTER TABLE public.clarification_messages ENABLE ROW LEVEL SECURITY;

-- Read: sender, recipient, or any admin
CREATE POLICY "Participants and admins can read clarifications"
ON public.clarification_messages
FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid()
  OR recipient_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Insert: admin can send to anyone; reporter can reply to admin on their own report
CREATE POLICY "Admins can send clarifications"
ON public.clarification_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Reporter can reply on own report"
ON public.clarification_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.has_role(recipient_id, 'admin')
  AND EXISTS (
    SELECT 1 FROM public.risk_reports r
    WHERE r.id = report_id AND r.reported_by = auth.uid()
  )
);

-- Update: recipient can mark as read
CREATE POLICY "Recipient can update read flag"
ON public.clarification_messages
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid());

-- Notify on new clarification message
CREATE OR REPLACE FUNCTION public.notify_clarification_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  report_title text;
  is_admin_sender boolean;
BEGIN
  SELECT display_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  SELECT title INTO report_title FROM public.risk_reports WHERE id = NEW.report_id;
  is_admin_sender := public.has_role(NEW.sender_id, 'admin');

  INSERT INTO public.notifications (user_id, type, title, message, report_id)
  VALUES (
    NEW.recipient_id,
    'clarification_request',
    CASE WHEN is_admin_sender THEN 'Förtydligande begärt' ELSE 'Svar på förtydligande' END,
    COALESCE(sender_name, 'Någon') || ': ' || COALESCE(report_title, 'rapport'),
    NEW.report_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_clarification_message
AFTER INSERT ON public.clarification_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_clarification_message();
