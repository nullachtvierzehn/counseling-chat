drop function if exists app_public.siblings(app_public.folders);
drop function if exists app_public.siblings(app_public.folders, boolean);
drop function if exists app_public.ancestors(app_public.folders);
drop function if exists app_public.ancestors(app_public.folders, boolean);
drop table if exists app_public.folders;
