create or replace function app_public.ancestors(folder app_public.folders, include_self boolean default false)
returns setof app_public.folders
language sql
stable
rows 10
parallel safe
as $$
  with recursive traversal as (
    select folder.* where include_self
    union all
    select f.*
    from app_public.folders as f
    where f.id = folder.parent_id
    union all
    select parent.*
    from app_public.folders as parent
    join traversal as child on (parent.id = child.parent_id)
  )
  select * from traversal
$$;

comment on function app_public.ancestors(app_public.folders, boolean) is E'@behavior +typeField +filterBy';

grant execute on function app_public.ancestors(app_public.folders, boolean) to :DATABASE_VISITOR;
