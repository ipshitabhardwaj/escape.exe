-- 0007: start every team at the same moment ("START ALL").
-- Replaces the one-team-at-a-time slot flow for the day. Per-team start
-- (escape_admin_start) stays for a late team. Idempotent.

create or replace function public.escape_admin_start_all() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_real boolean;
  n      int;
begin
  if (select phase from public.event where id = 1) <> 'investigation' then raise exception 'NOT_LIVE'; end if;
  if not exists (select 1 from public.escape_stages) then raise exception 'NO_STAGES'; end if;
  -- Dummy test teams only run when there are no real teams.
  v_real := exists (select 1 from public.teams where not is_dummy);
  with todo as (
    select t.id
      from public.teams t
      left join public.escape_runs r on r.team_id = t.id
     where (not v_real or not t.is_dummy)
       and (r.team_id is null or r.status = 'ready')
  ), up as (
    insert into public.escape_runs (team_id, status, started_at, last_activity)
    select id, 'running', now(), now() from todo
    on conflict (team_id) do update
      set status = 'running', started_at = now(), last_activity = now(), updated_at = now()
    returning 1
  )
  select count(*) into n from up;
  return n;
end $$;
revoke all on function public.escape_admin_start_all() from public, anon, authenticated;
grant execute on function public.escape_admin_start_all() to service_role;

notify pgrst, 'reload schema';
