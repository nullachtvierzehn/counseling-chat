drop table if exists app_public.message_body_revision_approvals;
drop table if exists app_public.message_body_revision_comments;
drop table if exists app_public.message_body_revisions;
drop table if exists app_public.messages;

drop table if exists app_hidden.consultation_participants_history;
drop table if exists app_public.consultation_participants;
drop table if exists app_public.consultations;

drop function if exists app_public.current_user_consultation_ids();

alter table app_public.organization_memberships
  drop column if exists is_dispatcher,
  drop column if exists is_counselor,
  drop column if exists is_supervisor;