create table app_public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid
    default app_public.current_user_id()
    constraint sender references app_public.users (id) on update cascade on delete set null,
  consultation_id uuid
    not null
    constraint consultation references app_public.consultations (id) on update cascade on delete cascade,
  is_for_clients boolean default false not null,
  is_for_staff boolean default false not null,
  created_at timestamptz not null default now()
);

create table app_public.message_body_revisions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null
    constraint "message" references app_public.messages (id) on update cascade on delete cascade,
  author_id uuid
    default app_public.current_user_id()
    constraint author references app_public.users (id) on update cascade on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_public.message_body_revision_approvals (
  id uuid primary key default gen_random_uuid(),
  body_revision_id uuid not null
    constraint body_revision references app_public.message_body_revisions (id) on update cascade on delete cascade,
  approver_id uuid
    default app_public.current_user_id()
    constraint approver references app_public.users (id) on update cascade on delete set null,
  created_at timestamptz not null default now()
);

create table app_public.message_body_revision_comments (
  id uuid primary key default gen_random_uuid(),
  body_revision_id uuid not null
    constraint body_revision references app_public.message_body_revisions (id) on update cascade on delete cascade,
  commenter_id uuid
    default app_public.current_user_id()
    constraint commenter references app_public.users (id) on update cascade on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);