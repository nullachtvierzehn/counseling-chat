create table app_public.consultations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    constraint organization
    references app_public.organizations (id)
    on update cascade on delete cascade,
  "name" text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_public.consultations enable row level security;

grant select on app_public.consultations to :DATABASE_VISITOR;
grant insert (id, "name") on app_public.consultations to :DATABASE_VISITOR;
grant update ("name") on app_public.consultations to :DATABASE_VISITOR;
grant delete on app_public.consultations to :DATABASE_VISITOR;

create index consultations_on_created_at on app_public.consultations using brin (created_at);

create trigger _100_timestamps
before insert or update on app_public.consultations
for each row
execute procedure app_private.tg__timestamps();

create policy manage_as_owner 
on app_public.consultations
for all
using (exists(
  select from app_public.organization_memberships as m
  where m.organization_id = consultations.organization_id
  and "user_id" = app_public.current_user_id()
  and is_owner is true
));

create policy see_as_dispatcher 
on app_public.consultations
for select
using (exists(
  select from app_public.organization_memberships as m
  where m.organization_id = consultations.organization_id
  and "user_id" = app_public.current_user_id()
  and is_dispatcher is true
));


-- Participants in a consultation.
create table app_public.consultation_participants (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null 
    constraint consultation
      references app_public.consultations (id)
      on update cascade on delete cascade,
  "user_id" uuid not null 
    default app_public.current_user_id()
    constraint "user"
      references app_public.users (id)
      on update cascade on delete cascade,
  is_client boolean not null default false,
  is_counselor boolean not null default false,
  is_supervisor boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sys_period tstzrange not null default tstzrange(now(), null, '[)'),
  constraint one_participation_per_user_in_consultations
    unique (consultation_id, user_id),
  constraint has_at_least_one_role
    check (is_client or is_counselor or is_supervisor),
  constraint is_either_client_or_staff
    check (is_client <> (is_counselor or is_supervisor))
);

comment on constraint consultation on app_public.consultation_participants is $$
@foreignFieldName participations

The consultation this participant is part of.
$$;

alter table app_public.consultation_participants enable row level security;

grant select on app_public.consultation_participants to :DATABASE_VISITOR;
grant insert (id, consultation_id, "user_id", is_client, is_counselor, is_supervisor) on app_public.consultation_participants to :DATABASE_VISITOR;
grant update (is_client, is_counselor, is_supervisor) on app_public.consultation_participants to :DATABASE_VISITOR;
grant delete on app_public.consultation_participants to :DATABASE_VISITOR;

create index consultation_participants_on_consultation_id on app_public.consultation_participants (consultation_id);
create index consultation_participants_on_user_id on app_public.consultation_participants ("user_id");
create index consultation_participants_on_created_at on app_public.consultation_participants using brin (created_at);

create trigger _100_timestamps
before insert or update on app_public.consultation_participants
for each row
execute procedure app_private.tg__timestamps();

create or replace function app_public.current_user_consultation_ids()
returns setof uuid
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
rows 20
as $$
  select consultation_id 
  from app_public.consultation_participants
  where "user_id" = app_public.current_user_id();
$$;

create policy manage_as_owner_or_dispatcher
on app_public.consultation_participants
for all
using (exists(
  select from app_public.consultations as c
  join app_public.organization_memberships as m using (organization_id)
  where c.id = consultation_participants.consultation_id
  and m.user_id = app_public.current_user_id()
  and (m.is_dispatcher is true or m.is_owner is true)
));

create policy see_participants_in_my_consultations
on app_public.consultation_participants
for select
using (consultation_id in (select app_public.current_user_consultation_ids()));

create policy allow_to_leave_a_consultation
on app_public.consultation_participants
for delete
using ("user_id" = (select app_public.current_user_id()));


-- Track the history of consultation participants.
create table app_hidden.consultation_participants_history (
  like app_public.consultation_participants,
  constraint consultation
    foreign key (consultation_id)
    references app_public.consultations (id)
    on update cascade on delete cascade
);

grant insert on app_hidden.consultation_participants_history to :DATABASE_VISITOR;
grant update on app_hidden.consultation_participants_history to :DATABASE_VISITOR;

create trigger _900_audit_log_consultation_participants
before insert or update or delete on app_public.consultation_participants
for each row 
execute procedure versioning(
  'sys_period',
  'app_hidden.consultation_participants_history',
  true
);
 