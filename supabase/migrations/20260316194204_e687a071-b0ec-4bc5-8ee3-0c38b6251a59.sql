
CREATE TABLE public.safety_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  site_plan_id uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  marker_type text NOT NULL CHECK (marker_type IN ('first_aid', 'fire_extinguisher')),
  plan_x double precision NOT NULL,
  plan_y double precision NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read safety markers"
ON public.safety_markers FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert safety markers"
ON public.safety_markers FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete safety markers"
ON public.safety_markers FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
