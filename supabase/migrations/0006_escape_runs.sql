-- =====================================================================
-- 0006 — Escape.exe: one timed run per team, sequential puzzle stages,
--        hints with a time penalty. Run AFTER 0001–0005. Safe to re-run.
--
-- Rulebook mapping
--   * "Timed, sequential puzzle chain, 45 minutes per team slot"
--        escape_runs (one row per team: started_at, status) + escape_config
--   * "Puzzles must be solved strictly in order"
--        escape_submit() only accepts the team's CURRENT stage, and
--        escape_state() never returns a stage that is not yet reachable
--   * "Each hint adds a fixed time penalty"
--        escape_use_hint() records the hint; total time = elapsed + hints x penalty
--   * "Ranking: time, then stages cleared, then fewer hints"
--        computed from escape_board() in lib/escape/rank.ts
--
-- Answers live in escape_keys, which no participant or anonymous role can
-- read. Teams talk to the database only through the three SECURITY DEFINER
-- functions below (escape_state / escape_submit / escape_use_hint).
-- The old global phases are reused: waiting -> investigation ("live")
-- -> closed -> results. The other phases are no longer used.
-- =====================================================================

-- ---------- 1. configuration -------------------------------------------
create table if not exists public.escape_config (
  id                   int primary key default 1 check (id = 1),
  duration_minutes     int not null default 45  check (duration_minutes between 5 and 240),
  hint_penalty_seconds int not null default 180 check (hint_penalty_seconds between 0 and 1800)
);
insert into public.escape_config (id) values (1) on conflict (id) do nothing;

-- ---------- 2. puzzle stages and their answer keys ---------------------
create table if not exists public.escape_stages (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,                 -- S1, S2 ...
  sort_order     int  not null,
  title          text not null,
  kind           text not null check (kind in ('digital', 'physical', 'hybrid')),
  zone           text not null default '',
  story          text not null default '',
  clue           jsonb not null default '{}'::jsonb,   -- what the exhibit panel shows
  prompt         text not null,
  input          jsonb not null default '{"mode":"text"}'::jsonb,
  hints          jsonb not null default '[]'::jsonb,   -- array of strings, in order
  fragment       text not null default '',             -- key-stack letter earned by solving it
  solved_message text not null default ''
);
create index if not exists escape_stages_order_idx on public.escape_stages (sort_order);

create table if not exists public.escape_keys (
  stage_id uuid primary key references public.escape_stages (id) on delete cascade,
  answers  text[] not null                             -- already normalised (see escape_norm)
);

-- ---------- 3. a team's run --------------------------------------------
create table if not exists public.escape_runs (
  team_id        uuid primary key references public.teams (id) on delete cascade,
  slot_label     text not null default '',
  status         text not null default 'ready'
                 check (status in ('ready', 'running', 'escaped', 'timeout', 'stopped')),
  started_at     timestamptz,
  finished_at    timestamptz,
  stages_cleared int not null default 0,
  hints_used     int not null default 0,
  wrong_attempts int not null default 0,
  extra_minutes  int not null default 0 check (extra_minutes between 0 and 60),
  last_activity  timestamptz,
  updated_at     timestamptz not null default now()
);

create table if not exists public.escape_solves (
  team_id         uuid not null references public.teams (id) on delete cascade,
  stage_id        uuid not null references public.escape_stages (id) on delete cascade,
  solved_at       timestamptz not null default now(),
  elapsed_seconds int not null,
  forced          boolean not null default false,      -- true when a Game Master skipped the stage
  primary key (team_id, stage_id)
);

create table if not exists public.escape_hint_uses (
  team_id  uuid not null references public.teams (id) on delete cascade,
  stage_id uuid not null references public.escape_stages (id) on delete cascade,
  level    int  not null check (level >= 1),
  used_at  timestamptz not null default now(),
  primary key (team_id, stage_id, level)
);

create table if not exists public.escape_attempts (
  id       bigint generated always as identity primary key,
  team_id  uuid not null references public.teams (id) on delete cascade,
  stage_id uuid not null references public.escape_stages (id) on delete cascade,
  answer   text not null default '',
  correct  boolean not null,
  at       timestamptz not null default now()
);
create index if not exists escape_attempts_team_at_idx on public.escape_attempts (team_id, at desc);

-- No participant or anonymous access to any of these tables: RLS on, no
-- policies. The service role (admin pages) and the SECURITY DEFINER
-- functions below are the only ways in.
alter table public.escape_config    enable row level security;
alter table public.escape_stages    enable row level security;
alter table public.escape_keys      enable row level security;
alter table public.escape_runs      enable row level security;
alter table public.escape_solves    enable row level security;
alter table public.escape_hint_uses enable row level security;
alter table public.escape_attempts  enable row level security;
revoke all on public.escape_config, public.escape_stages, public.escape_keys, public.escape_runs,
              public.escape_solves, public.escape_hint_uses, public.escape_attempts from anon, authenticated;

-- ---------- 4. helpers --------------------------------------------------
-- "  w-a r D e n " == "WARDEN": letters and digits only, upper case.
create or replace function public.escape_norm(p text) returns text
language sql immutable as $$
  select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- Marks one team's run as timed out once its deadline has passed.
create or replace function public._escape_expire(p_team uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  cfg public.escape_config;
begin
  select * into cfg from public.escape_config where id = 1;
  update public.escape_runs r
     set status = 'timeout',
         finished_at = r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes),
         updated_at = now()
   where r.team_id = p_team
     and r.status = 'running'
     and now() >= r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes);
end $$;
revoke all on function public._escape_expire(uuid) from public, anon, authenticated;

-- ---------- 5. team-facing functions -----------------------------------
-- Everything a team's screen needs, in one call. Only the stages the team
-- has solved plus the one it is working on are returned: later puzzles
-- never leave the database before they are unlocked.
create or replace function public.escape_state() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_team   uuid := public.my_team_id();
  cfg      public.escape_config;
  ev       public.event;
  r        public.escape_runs;
  v_total  int;
  v_run    jsonb := null;
  v_stages jsonb := '[]'::jsonb;
  v_elapsed int;
begin
  if v_team is null then raise exception 'NOT_TEAM'; end if;
  perform public._escape_expire(v_team);
  select * into cfg from public.escape_config where id = 1;
  select * into ev  from public.event where id = 1;
  select count(*) into v_total from public.escape_stages;
  select * into r from public.escape_runs where team_id = v_team;

  if found then
    v_elapsed := case when r.started_at is null then 0
                      else floor(extract(epoch from (coalesce(r.finished_at, now()) - r.started_at)))::int end;
    v_run := jsonb_build_object(
      'status', r.status,
      'slot_label', r.slot_label,
      'started_at', r.started_at,
      'ends_at', case when r.started_at is null then null
                      else r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes) end,
      'finished_at', r.finished_at,
      'stages_cleared', r.stages_cleared,
      'hints_used', r.hints_used,
      'wrong_attempts', r.wrong_attempts,
      'extra_minutes', r.extra_minutes,
      'penalty_seconds', r.hints_used * cfg.hint_penalty_seconds,
      'elapsed_seconds', v_elapsed,
      'total_seconds', v_elapsed + r.hints_used * cfg.hint_penalty_seconds
    );

    if r.status <> 'ready' then
      select coalesce(jsonb_agg(q.x order by (q.x ->> 'order')::int), '[]'::jsonb) into v_stages
      from (
        select jsonb_build_object(
          'code', s.code,
          'order', s.sort_order,
          'title', s.title,
          'kind', s.kind,
          'zone', s.zone,
          'story', s.story,
          'clue', s.clue,
          'prompt', s.prompt,
          'input', s.input,
          'solved', v.team_id is not null,
          'solved_at', v.solved_at,
          'solve_seconds', v.elapsed_seconds,
          'solved_message', case when v.team_id is not null then s.solved_message else null end,
          'fragment', case when v.team_id is not null then nullif(s.fragment, '') else null end,
          'hints_total', jsonb_array_length(s.hints),
          'hints_used', coalesce((
              select jsonb_agg(s.hints ->> (h.level - 1) order by h.level)
                from public.escape_hint_uses h
               where h.team_id = v_team and h.stage_id = s.id), '[]'::jsonb)
        ) as x
        from public.escape_stages s
        left join public.escape_solves v on v.team_id = v_team and v.stage_id = s.id
        where s.sort_order <= (
          select coalesce(min(s2.sort_order), 2147483647)
            from public.escape_stages s2
           where not exists (select 1 from public.escape_solves v2
                              where v2.team_id = v_team and v2.stage_id = s2.id))
      ) q;
    end if;
  end if;

  return jsonb_build_object(
    'server_now', now(),
    'phase', ev.phase,
    'config', jsonb_build_object('duration_minutes', cfg.duration_minutes, 'hint_penalty_seconds', cfg.hint_penalty_seconds),
    'total_stages', v_total,
    'run', v_run,
    'stages', v_stages
  );
end $$;
revoke all on function public.escape_state() from public, anon;
grant execute on function public.escape_state() to authenticated;

-- Answer the team's CURRENT stage. Results:
--   correct  (+ finished = true when it was the last stage)
--   wrong
--   stale    the screen was behind (another device already solved it)
--   cooldown too many wrong answers in a minute (retry_in seconds)
--   closed   not running (not started, time up, or event closed)
--   empty    nothing typed
create or replace function public.escape_submit(p_stage text, p_answer text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_team   uuid := public.my_team_id();
  cfg      public.escape_config;
  r        public.escape_runs;
  cur      public.escape_stages;
  deadline timestamptz;
  v_norm   text := public.escape_norm(p_answer);
  v_ok     boolean;
  v_done   boolean;
  wrongs   int;
  oldest   timestamptz;
begin
  if v_team is null then raise exception 'NOT_TEAM'; end if;
  select * into cfg from public.escape_config where id = 1;

  -- one answer at a time per team (two laptops can share one login)
  select * into r from public.escape_runs where team_id = v_team for update;
  if not found or r.status <> 'running' then
    return jsonb_build_object('result', 'closed', 'status', coalesce(r.status, 'ready'));
  end if;

  deadline := r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes);
  if now() >= deadline then
    update public.escape_runs set status = 'timeout', finished_at = deadline, updated_at = now() where team_id = v_team;
    return jsonb_build_object('result', 'closed', 'status', 'timeout');
  end if;
  if (select phase from public.event where id = 1) <> 'investigation' then
    return jsonb_build_object('result', 'closed', 'status', r.status);
  end if;

  select s.* into cur
    from public.escape_stages s
   where not exists (select 1 from public.escape_solves v where v.team_id = v_team and v.stage_id = s.id)
   order by s.sort_order limit 1;
  if not found then return jsonb_build_object('result', 'closed', 'status', r.status); end if;
  if cur.code <> p_stage then return jsonb_build_object('result', 'stale'); end if;
  if v_norm = '' then return jsonb_build_object('result', 'empty'); end if;

  -- brute-force guard: 6 wrong answers inside 60 seconds -> wait
  select count(*), min(w.at) into wrongs, oldest
    from (select a.at from public.escape_attempts a
           where a.team_id = v_team and not a.correct and a.at > now() - interval '60 seconds'
           order by a.at desc limit 6) w;
  if wrongs >= 6 then
    return jsonb_build_object('result', 'cooldown',
      'retry_in', greatest(1, ceil(extract(epoch from (oldest + interval '60 seconds' - now())))::int));
  end if;

  select exists (select 1 from public.escape_keys k where k.stage_id = cur.id and v_norm = any (k.answers)) into v_ok;
  insert into public.escape_attempts (team_id, stage_id, answer, correct)
  values (v_team, cur.id, left(coalesce(p_answer, ''), 60), v_ok);

  if not v_ok then
    update public.escape_runs set wrong_attempts = wrong_attempts + 1, last_activity = now(), updated_at = now()
     where team_id = v_team;
    return jsonb_build_object('result', 'wrong');
  end if;

  insert into public.escape_solves (team_id, stage_id, elapsed_seconds)
  values (v_team, cur.id, floor(extract(epoch from (now() - r.started_at)))::int);

  v_done := not exists (select 1 from public.escape_stages s
                         where not exists (select 1 from public.escape_solves v
                                            where v.team_id = v_team and v.stage_id = s.id));
  update public.escape_runs
     set stages_cleared = stages_cleared + 1,
         last_activity = now(),
         updated_at = now(),
         status = case when v_done then 'escaped' else status end,
         finished_at = case when v_done then now() else finished_at end
   where team_id = v_team;

  return jsonb_build_object('result', 'correct', 'finished', v_done);
end $$;
revoke all on function public.escape_submit(text, text) from public, anon;
grant execute on function public.escape_submit(text, text) to authenticated;

-- Reveal hint number p_level of the current stage. Charged once: asking again
-- for a level that is already revealed (e.g. from the other laptop) is free.
create or replace function public.escape_use_hint(p_stage text, p_level int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_team   uuid := public.my_team_id();
  cfg      public.escape_config;
  r        public.escape_runs;
  cur      public.escape_stages;
  deadline timestamptz;
  used     int;
  total    int;
begin
  if v_team is null then raise exception 'NOT_TEAM'; end if;
  select * into cfg from public.escape_config where id = 1;

  select * into r from public.escape_runs where team_id = v_team for update;
  if not found or r.status <> 'running' then
    return jsonb_build_object('result', 'closed', 'status', coalesce(r.status, 'ready'));
  end if;
  deadline := r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes);
  if now() >= deadline then
    update public.escape_runs set status = 'timeout', finished_at = deadline, updated_at = now() where team_id = v_team;
    return jsonb_build_object('result', 'closed', 'status', 'timeout');
  end if;

  select s.* into cur
    from public.escape_stages s
   where not exists (select 1 from public.escape_solves v where v.team_id = v_team and v.stage_id = s.id)
   order by s.sort_order limit 1;
  if not found then return jsonb_build_object('result', 'closed', 'status', r.status); end if;
  if cur.code <> p_stage then return jsonb_build_object('result', 'stale'); end if;

  total := jsonb_array_length(cur.hints);
  select count(*) into used from public.escape_hint_uses where team_id = v_team and stage_id = cur.id;
  if p_level < 1 or p_level > total then return jsonb_build_object('result', 'none_left'); end if;
  if p_level <= used then
    return jsonb_build_object('result', 'ok', 'charged', false, 'level', p_level, 'text', cur.hints ->> (p_level - 1));
  end if;
  if p_level > used + 1 then return jsonb_build_object('result', 'invalid'); end if;

  insert into public.escape_hint_uses (team_id, stage_id, level) values (v_team, cur.id, p_level);
  update public.escape_runs set hints_used = hints_used + 1, last_activity = now(), updated_at = now()
   where team_id = v_team;
  return jsonb_build_object('result', 'ok', 'charged', true, 'level', p_level,
                            'text', cur.hints ->> (p_level - 1), 'penalty_seconds', cfg.hint_penalty_seconds);
end $$;
revoke all on function public.escape_use_hint(text, int) from public, anon;
grant execute on function public.escape_use_hint(text, int) to authenticated;

-- ---------- 6. organiser functions (service role only) -----------------
-- Live board: one row per team. Also times out any run past its deadline.
create or replace function public.escape_board()
returns table (
  team_id uuid, team_code text, name text, institution text, is_dummy boolean, checked_in boolean, has_login boolean,
  slot_label text, status text, started_at timestamptz, finished_at timestamptz,
  stages_cleared int, hints_used int, wrong_attempts int, extra_minutes int, last_activity timestamptz,
  elapsed_seconds int, penalty_seconds int, total_seconds int, ends_at timestamptz, current_stage text
) language plpgsql security definer set search_path = public as $$
declare
  cfg public.escape_config;
begin
  select * into cfg from public.escape_config where id = 1;
  update public.escape_runs r
     set status = 'timeout',
         finished_at = r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes),
         updated_at = now()
   where r.status = 'running'
     and now() >= r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes);

  return query
  select t.id, t.team_code, t.name, t.institution, t.is_dummy, t.checked_in, t.auth_user_id is not null,
         coalesce(r.slot_label, ''), coalesce(r.status, 'ready'), r.started_at, r.finished_at,
         coalesce(r.stages_cleared, 0), coalesce(r.hints_used, 0), coalesce(r.wrong_attempts, 0),
         coalesce(r.extra_minutes, 0), r.last_activity,
         e.elapsed,
         coalesce(r.hints_used, 0) * cfg.hint_penalty_seconds,
         e.elapsed + coalesce(r.hints_used, 0) * cfg.hint_penalty_seconds,
         case when r.started_at is null then null
              else r.started_at + make_interval(mins => cfg.duration_minutes + r.extra_minutes) end,
         (select s.code from public.escape_stages s
           where not exists (select 1 from public.escape_solves v where v.team_id = t.id and v.stage_id = s.id)
           order by s.sort_order limit 1)
    from public.teams t
    left join public.escape_runs r on r.team_id = t.id
    cross join lateral (
      select case when r.started_at is null then 0
                  else floor(extract(epoch from (coalesce(r.finished_at, now()) - r.started_at)))::int end as elapsed
    ) e
   order by t.team_code;
end $$;
revoke all on function public.escape_board() from public, anon, authenticated;
grant execute on function public.escape_board() to service_role;

-- Start a team's slot. Only while the event is live. Returns 'started' or the reason.
create or replace function public.escape_admin_start(p_team uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  r public.escape_runs;
begin
  if (select phase from public.event where id = 1) <> 'investigation' then return 'not_live'; end if;
  if not exists (select 1 from public.teams where id = p_team) then return 'no_team'; end if;
  if not exists (select 1 from public.escape_stages) then return 'no_stages'; end if;
  select * into r from public.escape_runs where team_id = p_team for update;
  if found and r.status <> 'ready' then return 'already_' || r.status; end if;
  insert into public.escape_runs (team_id, status, started_at, last_activity)
  values (p_team, 'running', now(), now())
  on conflict (team_id) do update
    set status = 'running', started_at = now(), last_activity = now(), updated_at = now();
  return 'started';
end $$;
revoke all on function public.escape_admin_start(uuid) from public, anon, authenticated;
grant execute on function public.escape_admin_start(uuid) to service_role;

-- Game Master skips the team's current stage (equipment failure). No penalty,
-- but the solve is flagged "forced" so it stays visible in the export.
create or replace function public.escape_admin_skip(p_team uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  r      public.escape_runs;
  cur    public.escape_stages;
  v_done boolean;
begin
  select * into r from public.escape_runs where team_id = p_team for update;
  if not found or r.status <> 'running' then return 'not_running'; end if;
  select s.* into cur from public.escape_stages s
   where not exists (select 1 from public.escape_solves v where v.team_id = p_team and v.stage_id = s.id)
   order by s.sort_order limit 1;
  if not found then return 'nothing_left'; end if;
  insert into public.escape_solves (team_id, stage_id, elapsed_seconds, forced)
  values (p_team, cur.id, floor(extract(epoch from (now() - r.started_at)))::int, true);
  v_done := not exists (select 1 from public.escape_stages s
                         where not exists (select 1 from public.escape_solves v
                                            where v.team_id = p_team and v.stage_id = s.id));
  update public.escape_runs
     set stages_cleared = stages_cleared + 1, last_activity = now(), updated_at = now(),
         status = case when v_done then 'escaped' else status end,
         finished_at = case when v_done then now() else finished_at end
   where team_id = p_team;
  return case when v_done then 'finished' else 'skipped:' || cur.code end;
end $$;
revoke all on function public.escape_admin_skip(uuid) from public, anon, authenticated;
grant execute on function public.escape_admin_skip(uuid) to service_role;

-- Wipe one team's run so the slot can be played again (keeps the slot label).
create or replace function public.escape_admin_reset_team(p_team uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.escape_attempts  where team_id = p_team;
  delete from public.escape_hint_uses where team_id = p_team;
  delete from public.escape_solves    where team_id = p_team;
  update public.escape_runs
     set status = 'ready', started_at = null, finished_at = null, stages_cleared = 0, hints_used = 0,
         wrong_attempts = 0, extra_minutes = 0, last_activity = null, updated_at = now()
   where team_id = p_team;
end $$;
revoke all on function public.escape_admin_reset_team(uuid) from public, anon, authenticated;
grant execute on function public.escape_admin_reset_team(uuid) to service_role;

-- Stop one team's run now (e.g. the team leaves). Counts as "not escaped".
create or replace function public.escape_admin_stop(p_team uuid) returns text
language plpgsql security definer set search_path = public as $$
begin
  update public.escape_runs
     set status = 'stopped', finished_at = now(), updated_at = now()
   where team_id = p_team and status = 'running';
  return case when found then 'stopped' else 'not_running' end;
end $$;
revoke all on function public.escape_admin_stop(uuid) from public, anon, authenticated;
grant execute on function public.escape_admin_stop(uuid) to service_role;

-- Event closes: every run still going ends here (no one keeps playing after the close).
create or replace function public.escape_admin_close_runs() returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  update public.escape_runs set status = 'stopped', finished_at = now(), updated_at = now()
   where status = 'running';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.escape_admin_close_runs() from public, anon, authenticated;
grant execute on function public.escape_admin_close_runs() to service_role;

-- ---------- 7. reset (dry run) ------------------------------------------
-- Replaces the 0005 version: also wipes every run. Keeps teams, logins, stages and config.
create or replace function public.admin_reset_event() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.escape_attempts where true;
  delete from public.escape_hint_uses where true;
  delete from public.escape_solves where true;
  delete from public.escape_runs where true;
  delete from public.login_attempts where true;
  update public.teams set extra_minutes = 0, phase_extra_minutes = 0, phase_extra_phase = null where true;
  update public.event
     set phase = 'waiting', phase_ends_at = null, twist_released_at = null, updated_at = now()
   where id = 1;
end $$;
revoke all on function public.admin_reset_event() from public, anon, authenticated;
grant execute on function public.admin_reset_event() to service_role;

-- ---------- 8. self-check ------------------------------------------------
create or replace function public.verify_escape()
returns table (check_name text, ok boolean, detail text)
language plpgsql stable security definer set search_path = public as $$
declare
  missing text;
  n int;
begin
  check_name := 'escape tables have row-level security and no participant access';
  select string_agg(t || ' ' || r || ' ' || p, ', ') into missing
    from unnest(array['public.escape_config', 'public.escape_stages', 'public.escape_keys', 'public.escape_runs',
                      'public.escape_solves', 'public.escape_hint_uses', 'public.escape_attempts']) t,
         unnest(array['anon', 'authenticated']) r,
         unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p
   where exists (select 1 from pg_roles where rolname = r) and has_table_privilege(r, t, p);
  ok := missing is null; detail := coalesce('still granted: ' || missing, 'revoked'); return next;

  check_name := 'escape puzzles loaded';
  select count(*) into n from public.escape_stages;
  ok := n > 0; detail := n || ' stage(s)'; return next;

  check_name := 'every stage has an answer key and at least one hint';
  select string_agg(s.code, ', ') into missing
    from public.escape_stages s
    left join public.escape_keys k on k.stage_id = s.id
   where k.stage_id is null or cardinality(k.answers) = 0 or jsonb_array_length(s.hints) = 0;
  ok := missing is null; detail := coalesce('incomplete: ' || missing, 'complete'); return next;

  check_name := 'escape functions: teams may call only state / submit / hint';
  select string_agg(f || ' -> ' || r, ', ') into missing
    from unnest(array['public.escape_board()', 'public.escape_admin_start(uuid)', 'public.escape_admin_skip(uuid)',
                      'public.escape_admin_reset_team(uuid)', 'public.escape_admin_stop(uuid)',
                      'public.escape_admin_close_runs()', 'public.admin_reset_event()']) f,
         unnest(array['anon', 'authenticated']) r
   where to_regprocedure(f) is not null and exists (select 1 from pg_roles where rolname = r)
     and has_function_privilege(r, f, 'EXECUTE');
  ok := missing is null; detail := coalesce('executable: ' || missing, 'service role only'); return next;

  check_name := 'event.phase is one of the four phases in use';
  select phase::text in ('waiting', 'investigation', 'closed', 'results'), 'phase = ' || phase::text
    into ok, detail from public.event where id = 1;
  return next;
end $$;
revoke all on function public.verify_escape() from public, anon, authenticated;
grant execute on function public.verify_escape() to service_role;

insert into public.app_schema_version (version, note) values (6, '0006_escape_runs')
on conflict (version) do nothing;
