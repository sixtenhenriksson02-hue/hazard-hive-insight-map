
-- Create documents table for storing generated reports
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'monthly',
  period_label TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  project_name TEXT,
  content JSONB NOT NULL,
  language TEXT NOT NULL DEFAULT 'sv',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can read all documents" ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Workers can read documents for their project
CREATE POLICY "Workers can read project documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT project_id FROM public.user_projects WHERE user_id = auth.uid())
  );
