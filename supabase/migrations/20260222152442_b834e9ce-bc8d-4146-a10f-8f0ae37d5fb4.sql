
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'worker',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Risk reports table
CREATE TABLE public.risk_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.risk_reports ENABLE ROW LEVEL SECURITY;

-- Comments table
CREATE TABLE public.report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.risk_reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

-- Enable realtime for reports and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_comments;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get display name function
CREATE OR REPLACE FUNCTION public.get_display_name(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name FROM public.profiles WHERE user_id = _user_id
$$;

-- Auto-create profile and default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonym'));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'worker'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_risk_reports_updated_at
  BEFORE UPDATE ON public.risk_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- user_roles: users can read their own roles, admins can read all
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- profiles: users can read/update own, admins can read all
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- risk_reports: all authenticated can read, all can insert, admins can update
CREATE POLICY "Authenticated can read reports" ON public.risk_reports
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create reports" ON public.risk_reports
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins can update reports" ON public.risk_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reporter can update own reports" ON public.risk_reports
  FOR UPDATE TO authenticated
  USING (reported_by = auth.uid());

-- report_comments: all authenticated can read, all can insert own
CREATE POLICY "Authenticated can read comments" ON public.report_comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create comments" ON public.report_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Storage bucket for report images
INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true);

CREATE POLICY "Authenticated can upload report images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'report-images');

CREATE POLICY "Anyone can view report images" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-images');
