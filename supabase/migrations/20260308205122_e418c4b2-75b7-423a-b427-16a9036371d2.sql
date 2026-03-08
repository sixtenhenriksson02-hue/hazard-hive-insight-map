
-- Fix overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
