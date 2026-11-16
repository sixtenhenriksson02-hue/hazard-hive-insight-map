CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_projects WHERE user_id = _user_id AND project_id = _project_id)
$$;

CREATE OR REPLACE FUNCTION public.find_project_by_invite(_code text)
RETURNS TABLE(id uuid, name text, archived boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.archived FROM public.projects p
  WHERE auth.uid() IS NOT NULL AND p.invite_code = upper(btrim(_code)) LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.find_project_by_invite(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.find_project_by_invite(text) TO authenticated;

DROP POLICY IF EXISTS "Authenticated can read projects" ON public.projects;
CREATE POLICY "Members and admins can read projects" ON public.projects FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_project_member(auth.uid(), id));

DROP POLICY IF EXISTS "Authenticated can read reports" ON public.risk_reports;
CREATE POLICY "Members, reporter and admins can read reports" ON public.risk_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR reported_by = auth.uid()
    OR (project_id IS NOT NULL AND public.is_project_member(auth.uid(), project_id)));

DROP POLICY IF EXISTS "Authenticated can read safety markers" ON public.safety_markers;
CREATE POLICY "Members and admins can read safety markers" ON public.safety_markers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_project_member(auth.uid(), project_id));

DROP POLICY IF EXISTS "Authenticated can read site plans" ON public.site_plans;
CREATE POLICY "Members and admins can read site plans" ON public.site_plans FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_project_member(auth.uid(), project_id));

DROP POLICY IF EXISTS "Authenticated can read comments" ON public.report_comments;
CREATE POLICY "Users with report access can read comments" ON public.report_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.risk_reports r WHERE r.id = report_comments.report_id));

DROP POLICY IF EXISTS "Authenticated can upload report images" ON storage.objects;
CREATE POLICY "Users upload report images to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'report-images' AND (storage.foldername(name))[1] = (select auth.uid()::text));