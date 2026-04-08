
ALTER TABLE public.project_rules ADD COLUMN file_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('rule-files', 'rule-files', true);

CREATE POLICY "Admins can upload rule files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'rule-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rule files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'rule-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read rule files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'rule-files');
