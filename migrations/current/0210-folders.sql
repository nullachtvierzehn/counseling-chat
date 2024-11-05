create extension if not exists pg_trgm;

create table if not exists app_public.folders (
  id uuid primary key default uuid_generate_v1mc(),
  organization_id uuid not null
    constraint organization
    references app_public.organizations (id)
    on update cascade on delete cascade,
  parent_id uuid
    constraint parent
    references app_public.folders (id)
    on update cascade on delete cascade,
  "name" text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_public.folders enable row level security;

grant select on app_public.folders to :DATABASE_VISITOR;
grant insert (organization_id, parent_id, "name") on app_public.folders to :DATABASE_VISITOR;
grant update (organization_id, parent_id, "name") on app_public.folders to :DATABASE_VISITOR;
grant delete on app_public.folders to :DATABASE_VISITOR;

create index folders_on_organization_id on app_public.folders using hash (organization_id);
create index folders_on_parent_id on app_public.folders using hash (parent_id);
create index folders_on_name on app_public.folders ("name");
create index folders_on_fuzzy_name on app_public.folders using gin ("name" gin_trgm_ops);
create index folders_on_created_at on app_public.folders using brin (created_at);


create policy show_folders_of_my_organizations
on app_public.folders
for select
using (organization_id in (select app_public.current_user_member_organization_ids()));

create policy create_and_manage_folders_as_organization_owner
on app_public.folders
for all
using (exists(
  select from app_public.organization_memberships
  where
    organization_id = folders.organization_id
    and user_id = app_public.current_user_id()
    and is_owner
));
