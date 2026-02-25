
-- Junction table for workers belonging to multiple projects
CREATE TABLE public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own project memberships"
  ON public.user_projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own project memberships"
  ON public.user_projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own project memberships"
  ON public.user_projects FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all project memberships"
  ON public.user_projects FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Add AI explanation column to risk_reports
ALTER TABLE public.risk_reports
  ADD COLUMN IF NOT EXISTS ai_explanation text;
