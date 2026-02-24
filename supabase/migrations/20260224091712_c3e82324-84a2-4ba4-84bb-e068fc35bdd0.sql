
-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Admins can create projects" ON public.projects
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects" ON public.projects
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Add project_id to profiles
ALTER TABLE public.profiles ADD COLUMN project_id uuid REFERENCES public.projects(id);

-- Add new fields to risk_reports
ALTER TABLE public.risk_reports 
  ADD COLUMN project_id uuid REFERENCES public.projects(id),
  ADD COLUMN report_type text NOT NULL DEFAULT 'observation',
  ADD COLUMN building text,
  ADD COLUMN specific_location text,
  ADD COLUMN body_part text,
  ADD COLUMN injury_type text,
  ADD COLUMN medical_care_required boolean DEFAULT false,
  ADD COLUMN absence_required boolean DEFAULT false,
  ADD COLUMN absence_days integer DEFAULT 0,
  ADD COLUMN severity_rating integer DEFAULT 1;
