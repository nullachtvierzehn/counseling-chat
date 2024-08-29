alter table app_public.organization_memberships
  add column is_dispatcher boolean not null default false,
  add column is_counselor boolean not null default false,
  add column is_supervisor boolean not null default false;

