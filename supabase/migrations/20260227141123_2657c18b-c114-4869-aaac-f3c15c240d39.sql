
-- Create site_plans table for APD plans
CREATE TABLE public.site_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.site_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read site plans" ON public.site_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create site plans" ON public.site_plans
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site plans" ON public.site_plans
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site plans" ON public.site_plans
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add coordinate columns to risk_reports for APD plan placement
ALTER TABLE public.risk_reports ADD COLUMN site_plan_id UUID REFERENCES public.site_plans(id) ON DELETE SET NULL;
ALTER TABLE public.risk_reports ADD COLUMN plan_x DOUBLE PRECISION;
ALTER TABLE public.risk_reports ADD COLUMN plan_y DOUBLE PRECISION;

-- Create storage bucket for site plan images
INSERT INTO storage.buckets (id, name, public) VALUES ('site-plans', 'site-plans', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read site plan images" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-plans');

CREATE POLICY "Admins can upload site plan images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-plans' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Admins can delete site plan images" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-plans' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));
