create or replace function app_public.siblings(folder app_public.folders, include_self boolean default false)
returns setof app_public.folders
language sql
stable
rows 50
parallel safe
as $$
  select f.*
  from app_public.folders as f
  where
    f.parent_id = folder.parent_id
    and (include_self or f.id != folder.id)
$$;

grant execute on function app_public.siblings(app_public.folders, boolean) to :DATABASE_VISITOR;

comment on function app_public.siblings(app_public.folders, boolean) is E'@behavior +typeField +filterBy +orderBy';
