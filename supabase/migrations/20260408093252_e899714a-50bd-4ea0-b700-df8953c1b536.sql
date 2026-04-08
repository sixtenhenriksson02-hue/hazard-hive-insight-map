
CREATE TABLE public.project_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_rules ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage project rules" ON public.project_rules
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Workers can read rules for their projects
CREATE POLICY "Workers can read project rules" ON public.project_rules
FOR SELECT TO authenticated
USING (project_id IN (
  SELECT project_id FROM public.user_projects WHERE user_id = auth.uid()
));

-- Auto-update updated_at
CREATE TRIGGER update_project_rules_updated_at
  BEFORE UPDATE ON public.project_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
