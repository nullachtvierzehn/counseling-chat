drop policy if exists see_as_dispatcher on app_public.consultations;

drop table if exists app_hidden.consultation_participants_history;

drop table if exists app_public.consultation_participants;

drop type if exists app_public.consultation_role;

drop function if exists app_public.current_user_consultation_ids();

drop table if exists app_public.consultations;

alter table app_public.organization_memberships
  drop column if exists is_dispatcher,
  drop column if exists is_counselor,
  drop column if exists is_supervisor;