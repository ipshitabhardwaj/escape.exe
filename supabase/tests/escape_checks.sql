-- =====================================================================
-- Escape.exe — database checks for migration 0006
--
-- Run in the Supabase SQL Editor (paste, Run) AFTER migrations 0001–0006.
-- Everything happens inside one transaction that is ROLLED BACK at the
-- end: it replaces the puzzles with three throw-away stages, plays two
-- throw-away teams through them, and changes nothing permanently.
-- Run it before the event, not during.
--
-- Success: the last message is "ALL ESCAPE CHECKS PASSED".
-- Failure: an error names the check that failed.
-- =====================================================================
begin;

-- ---------- fixtures ---------------------------------------------------
delete from public.escape_stages where true;   -- rolled back below; cascades to keys, solves, hints
insert into public.escape_stages (id, code, sort_order, title, kind, prompt, hints, fragment, solved_message) values
  ('00000000-0000-4000-8000-0000000e5001', 'S1', 0, 'One',   'digital',  'p1', '["h1a","h1b"]', 'A', 'ok1'),
  ('00000000-0000-4000-8000-0000000e5002', 'S2', 1, 'Two',   'physical', 'p2', '["h2a"]',       'B', 'ok2'),
  ('00000000-0000-4000-8000-0000000e5003', 'S3', 2, 'Three', 'hybrid',   'p3', '["h3a"]',       '',  'ok3');
insert into public.escape_keys values
  ('00000000-0000-4000-8000-0000000e5001', '{WARDEN}'),
  ('00000000-0000-4000-8000-0000000e5002', '{1234,4321}'),
  ('00000000-0000-4000-8000-0000000e5003', '{OVERRIDE}');
update public.escape_config set duration_minutes = 45, hint_penalty_seconds = 180 where id = 1;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000b001', 'zz-esc-team1@test.invalid'),
  ('00000000-0000-4000-8000-00000000b002', 'zz-esc-team2@test.invalid');
insert into public.teams (id, team_code, name, auth_user_id) values
  ('00000000-0000-4000-8000-0000000f0001', 'ZZESC-1', 'Esc One', '00000000-0000-4000-8000-00000000b001'),
  ('00000000-0000-4000-8000-0000000f0002', 'ZZESC-2', 'Esc Two', '00000000-0000-4000-8000-00000000b002');
insert into public.profiles values
  ('00000000-0000-4000-8000-00000000b001', 'team', '00000000-0000-4000-8000-0000000f0001', 'Esc One'),
  ('00000000-0000-4000-8000-00000000b002', 'team', '00000000-0000-4000-8000-0000000f0002', 'Esc Two');
update public.event set phase = 'waiting', phase_ends_at = null, twist_released_at = null where id = 1;

create function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p::text, true);
end $$;
create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'ESCAPE CHECK FAILED: %', what; end if; end $$;

-- ---------- before the event is live ----------------------------------
select pg_temp.as_user('00000000-0000-4000-8000-00000000b001');
set local role authenticated;
select pg_temp.check((public.escape_state() -> 'run') = 'null'::jsonb, 'a team without a run has no run');
select pg_temp.check(jsonb_array_length(public.escape_state() -> 'stages') = 0, 'nothing to read before the slot starts');
select pg_temp.check((public.escape_submit('S1', 'WARDEN') ->> 'result') = 'closed', 'cannot answer before the slot starts');
reset role;
select pg_temp.check(public.escape_admin_start('00000000-0000-4000-8000-0000000f0001') = 'not_live', 'a slot cannot start while the event is not live');

-- ---------- participants cannot touch the tables or admin functions ----
select pg_temp.as_user('00000000-0000-4000-8000-00000000b001');
set local role authenticated;
do $$ begin perform 1 from public.escape_keys; raise exception 'ESCAPE CHECK FAILED: a team can read the answer keys';
exception when insufficient_privilege then null; end $$;
do $$ begin perform 1 from public.escape_stages; raise exception 'ESCAPE CHECK FAILED: a team can read stages directly';
exception when insufficient_privilege then null; end $$;
do $$ begin insert into public.escape_runs (team_id, status, started_at) values ('00000000-0000-4000-8000-0000000f0001', 'escaped', now());
  raise exception 'ESCAPE CHECK FAILED: a team can write its own run';
exception when insufficient_privilege then null; end $$;
do $$ begin perform public.escape_admin_start('00000000-0000-4000-8000-0000000f0001'); raise exception 'ESCAPE CHECK FAILED: a team can start its own slot';
exception when insufficient_privilege then null; end $$;
do $$ begin perform public.escape_admin_skip('00000000-0000-4000-8000-0000000f0001'); raise exception 'ESCAPE CHECK FAILED: a team can skip its own stage';
exception when insufficient_privilege then null; end $$;
do $$ begin perform public.escape_board(); raise exception 'ESCAPE CHECK FAILED: a team can read the board';
exception when insufficient_privilege then null; end $$;
reset role;
set local role anon;
do $$ begin perform public.escape_state(); raise exception 'ESCAPE CHECK FAILED: an anonymous visitor can call escape_state';
exception when insufficient_privilege then null; end $$;
reset role;

-- ---------- live: start, sequential play -------------------------------
update public.event set phase = 'investigation' where id = 1;
select pg_temp.check(public.escape_admin_start('00000000-0000-4000-8000-0000000f0001') = 'started', 'a Game Master can start a slot');
select pg_temp.check(public.escape_admin_start('00000000-0000-4000-8000-0000000f0001') = 'already_running', 'a slot cannot be started twice');

select pg_temp.as_user('00000000-0000-4000-8000-00000000b001');
set local role authenticated;
select pg_temp.check(jsonb_array_length(public.escape_state() -> 'stages') = 1, 'only the first stage is sent');
select pg_temp.check(position('WARDEN' in (public.escape_state() -> 'stages')::text) = 0, 'the answer is not in the payload');
select pg_temp.check(position('Two' in (public.escape_state())::text) = 0, 'later stages are not in the payload');
select pg_temp.check((public.escape_submit('S2', '1234') ->> 'result') = 'stale', 'cannot jump ahead to stage 2');
select pg_temp.check((public.escape_submit('S1', '  ') ->> 'result') = 'empty', 'an empty answer is not an attempt');
select pg_temp.check((public.escape_submit('S1', 'nope') ->> 'result') = 'wrong', 'a wrong answer is refused');

-- hints: must be taken in order, charged once
select pg_temp.check((public.escape_use_hint('S1', 2) ->> 'result') = 'invalid', 'hint 2 before hint 1 is refused');
select pg_temp.check((public.escape_use_hint('S1', 1) ->> 'charged') = 'true', 'hint 1 is charged');
select pg_temp.check((public.escape_use_hint('S1', 1) ->> 'charged') = 'false', 'asking for hint 1 again is free');
select pg_temp.check((public.escape_use_hint('S1', 2) ->> 'charged') = 'true', 'hint 2 is charged');
select pg_temp.check((public.escape_use_hint('S1', 3) ->> 'result') = 'none_left', 'there is no hint 3');
select pg_temp.check((public.escape_state() -> 'run' ->> 'hints_used')::int = 2 and (public.escape_state() -> 'run' ->> 'penalty_seconds')::int = 360, 'two hints cost 6:00');

-- answers are normalised, and unlock the next stage
select pg_temp.check((public.escape_submit('S1', ' w-a r d e n ') ->> 'result') = 'correct', 'answers ignore case, spaces and dashes');
select pg_temp.check(jsonb_array_length(public.escape_state() -> 'stages') = 2, 'solving a stage unlocks the next');
select pg_temp.check((public.escape_state() -> 'stages' -> 0 ->> 'fragment') = 'A', 'the solved stage shows its fragment');
select pg_temp.check((public.escape_submit('S1', 'WARDEN') ->> 'result') = 'stale', 'a solved stage cannot be answered again');
select pg_temp.check((public.escape_submit('S2', '4321') ->> 'result') = 'correct', 'any accepted answer works');
select pg_temp.check((public.escape_submit('S3', 'override') ->> 'finished') = 'true', 'the last stage ends the run');
select pg_temp.check((public.escape_state() -> 'run' ->> 'status') = 'escaped', 'status is escaped');
select pg_temp.check((public.escape_state() -> 'run' ->> 'total_seconds')::int >= 360, 'total time includes hint penalties');
select pg_temp.check((public.escape_submit('S3', 'override') ->> 'result') = 'closed', 'no answers after escaping');
reset role;

-- ---------- brute force guard and timeouts ----------------------------
select pg_temp.check(public.escape_admin_start('00000000-0000-4000-8000-0000000f0002') = 'started', 'second team starts');
select pg_temp.as_user('00000000-0000-4000-8000-00000000b002');
set local role authenticated;
select pg_temp.check((public.escape_state() -> 'stages' -> 0 ->> 'hints_used') = '[]', 'team 2 has none of team 1''s hints');
do $$ declare i int; begin
  for i in 1..6 loop perform public.escape_submit('S1', 'w' || i); end loop;
end $$;
select pg_temp.check((public.escape_submit('S1', 'WARDEN') ->> 'result') = 'cooldown', 'six wrong answers in a minute lock the terminal (even for the right answer)');
reset role;

-- push team 2 past its deadline
update public.escape_runs set started_at = now() - interval '46 minutes' where team_id = '00000000-0000-4000-8000-0000000f0002';
delete from public.escape_attempts where team_id = '00000000-0000-4000-8000-0000000f0002';
select pg_temp.as_user('00000000-0000-4000-8000-00000000b002');
set local role authenticated;
select pg_temp.check((public.escape_submit('S1', 'WARDEN') ->> 'result') = 'closed', 'no answers after time is up');
select pg_temp.check((public.escape_state() -> 'run' ->> 'status') = 'timeout', 'the run is marked timed out');
select pg_temp.check((public.escape_state() -> 'run' ->> 'elapsed_seconds')::int = 45 * 60, 'time taken stops at the limit');
reset role;

-- ---------- organiser tools -------------------------------------------
select pg_temp.check((select count(*) from public.escape_board()) = 2 + (select count(*) from public.teams where team_code not like 'ZZESC-%'), 'the board lists every team');
select pg_temp.check((select status from public.escape_board() where team_code = 'ZZESC-1') = 'escaped', 'board: team 1 escaped');
select pg_temp.check((select status from public.escape_board() where team_code = 'ZZESC-2') = 'timeout', 'board: team 2 timed out');
select pg_temp.check(public.escape_admin_skip('00000000-0000-4000-8000-0000000f0002') = 'not_running', 'a finished run cannot be skipped');
select public.escape_admin_reset_team('00000000-0000-4000-8000-0000000f0002');
select pg_temp.check((select status from public.escape_board() where team_code = 'ZZESC-2') = 'ready', 'a reset team can play again');
select pg_temp.check(public.escape_admin_start('00000000-0000-4000-8000-0000000f0002') = 'started', 'restart after reset');
select pg_temp.check(public.escape_admin_skip('00000000-0000-4000-8000-0000000f0002') = 'skipped:S1', 'skip clears the current stage');
select pg_temp.check(public.escape_admin_close_runs() = 1, 'closing the event stops running slots');
select pg_temp.check((select status from public.escape_board() where team_code = 'ZZESC-2') = 'stopped', 'stopped runs show as stopped');

select public.admin_reset_event();
select pg_temp.check((select count(*) from public.escape_runs) = 0, 'reset event deletes every run');
select pg_temp.check((select phase from public.event where id = 1) = 'waiting', 'reset event returns to waiting');

select pg_temp.check((select bool_and(ok) from public.verify_escape() where check_name not like 'escape puzzles loaded%' and check_name not like 'every stage has%'), 'verify_escape() is happy');

rollback;
select 'ALL ESCAPE CHECKS PASSED' as result;
