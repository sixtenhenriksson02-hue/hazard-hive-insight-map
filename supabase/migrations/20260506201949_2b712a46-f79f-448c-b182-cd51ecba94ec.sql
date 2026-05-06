CREATE TABLE public.project_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  label text NOT NULL,
  address text NOT NULL,
  location_type text NOT NULL DEFAULT 'other',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage project locations"
  ON public.project_locations
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can read locations of their projects"
  ON public.project_locations
  FOR SELECT
  TO authenticated
  USING (project_id IN (SELECT project_id FROM public.user_projects WHERE user_id = auth.uid()));

CREATE TRIGGER update_project_locations_updated_at
  BEFORE UPDATE ON public.project_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_project_locations_project_id ON public.project_locations(project_id);