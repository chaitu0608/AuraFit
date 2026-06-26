-- Lift Log schema v1

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text,
  avatar_url text,
  units text not null default 'kg' check (units in ('kg', 'lb')),
  bio text,
  share_workouts boolean not null default true,
  auto_post_workout boolean not null default true,
  auto_post_pr boolean not null default true,
  auto_post_streak boolean not null default true,
  created_at timestamptz not null default now()
);

-- Friendships
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (requester, addressee),
  check (requester <> addressee)
);

-- Exercises
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Exercise meta per user
create table if not exists public.exercise_meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  type text not null default 'dumbbell' check (type in ('machine', 'dumbbell', 'free')),
  plate_n numeric,
  plate_unit text check (plate_unit in ('lb', 'kg')),
  support_assisted boolean not null default false,
  unique (user_id, exercise_id)
);

-- Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  kind text not null default 'workout' check (kind in ('workout', 'cardio', 'rest')),
  name text,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'healthkit')),
  healthkit_uuid text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Session exercises
create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null default 0,
  notes text
);

-- Sets
create table if not exists public.sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  position int not null default 0,
  weight_kg numeric,
  reps int,
  plates numeric,
  is_assisted boolean not null default false,
  drop_of_id uuid references public.sets(id) on delete set null,
  rpe numeric
);

-- Templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null default 0,
  prescribed_sets int,
  prescribed_reps int
);

-- Programs
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  weeks int not null default 4,
  created_at timestamptz not null default now()
);

create table if not exists public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week int not null,
  dow int not null check (dow between 0 and 6),
  template_id uuid references public.templates(id) on delete set null
);

create table if not exists public.program_participants (
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (program_id, user_id)
);

-- PRs
create table if not exists public.prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  weight_kg numeric not null,
  reps int not null,
  est_1rm numeric not null,
  set_id uuid references public.sets(id) on delete set null,
  achieved_at timestamptz not null default now()
);

-- Streaks
create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_count int not null default 0,
  longest_count int not null default 0,
  last_log_date date
);

-- Posts / social
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('workout', 'pr', 'streak', 'note')),
  session_id uuid references public.sessions(id) on delete set null,
  pr_id uuid references public.prs(id) on delete set null,
  body text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('heart', 'fire', 'muscle', 'clap')),
  unique (post_id, user_id, kind)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Challenges
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('streak', 'volume', '1rm', 'reps')),
  exercise_id uuid references public.exercises(id) on delete set null,
  target numeric not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_value numeric not null default 0,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

-- Helper: are two users friends?
create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships f
    where f.status = 'accepted'
      and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a))
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_meta enable row level security;
alter table public.sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.sets enable row level security;
alter table public.templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.program_participants enable row level security;
alter table public.prs enable row level security;
alter table public.streaks enable row level security;
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_comments enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- Profiles policies
create policy profiles_read on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- Friendships
create policy friendships_read on public.friendships for select
  using (auth.uid() in (requester, addressee));
create policy friendships_insert on public.friendships for insert
  with check (auth.uid() = requester);
create policy friendships_update on public.friendships for update
  using (auth.uid() in (requester, addressee));

-- Exercises readable by all authenticated
create policy exercises_read on public.exercises for select to authenticated using (true);
create policy exercises_insert on public.exercises for insert to authenticated with check (auth.uid() = owner_id or owner_id is null);

-- Exercise meta own only
create policy exercise_meta_all on public.exercise_meta for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sessions
create policy sessions_read on public.sessions for select using (
  auth.uid() = user_id
  or (public.are_friends(auth.uid(), user_id) and exists (
    select 1 from profiles p where p.id = sessions.user_id and p.share_workouts = true
  ))
);
create policy sessions_write on public.sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Session exercises via session ownership
create policy session_exercises_read on public.session_exercises for select using (
  exists (select 1 from sessions s where s.id = session_id and (
    s.user_id = auth.uid()
    or (public.are_friends(auth.uid(), s.user_id) and exists (
      select 1 from profiles p where p.id = s.user_id and p.share_workouts = true
    ))
  ))
);
create policy session_exercises_write on public.session_exercises for all using (
  exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid())
);

-- Sets via session exercise
create policy sets_read on public.sets for select using (
  exists (
    select 1 from session_exercises se
    join sessions s on s.id = se.session_id
    where se.id = session_exercise_id and (
      s.user_id = auth.uid()
      or (public.are_friends(auth.uid(), s.user_id) and exists (
        select 1 from profiles p where p.id = s.user_id and p.share_workouts = true
      ))
    )
  )
);
create policy sets_write on public.sets for all using (
  exists (
    select 1 from session_exercises se
    join sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from session_exercises se
    join sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  )
);

-- Templates own
create policy templates_all on public.templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy template_exercises_all on public.template_exercises for all using (
  exists (select 1 from templates t where t.id = template_id and t.user_id = auth.uid())
) with check (
  exists (select 1 from templates t where t.id = template_id and t.user_id = auth.uid())
);

-- Programs
create policy programs_read on public.programs for select using (
  auth.uid() = owner_id or exists (
    select 1 from program_participants pp where pp.program_id = programs.id and pp.user_id = auth.uid()
  )
);
create policy programs_write on public.programs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy program_days_read on public.program_days for select using (
  exists (select 1 from programs p where p.id = program_id and (
    p.owner_id = auth.uid() or exists (select 1 from program_participants pp where pp.program_id = p.id and pp.user_id = auth.uid())
  ))
);
create policy program_days_write on public.program_days for all using (
  exists (select 1 from programs p where p.id = program_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from programs p where p.id = program_id and p.owner_id = auth.uid())
);

create policy program_participants_all on public.program_participants for all using (
  auth.uid() = user_id or exists (select 1 from programs p where p.id = program_id and p.owner_id = auth.uid())
) with check (auth.uid() = user_id or exists (select 1 from programs p where p.id = program_id and p.owner_id = auth.uid()));

-- PRs
create policy prs_read on public.prs for select using (
  auth.uid() = user_id or public.are_friends(auth.uid(), user_id)
);

-- Streaks
create policy streaks_read on public.streaks for select using (
  auth.uid() = user_id or public.are_friends(auth.uid(), user_id)
);
create policy streaks_write on public.streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Posts
create policy posts_read on public.posts for select using (
  auth.uid() = user_id or public.are_friends(auth.uid(), user_id)
);
create policy posts_write on public.posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy post_reactions_read on public.post_reactions for select using (
  exists (select 1 from posts p where p.id = post_id and (p.user_id = auth.uid() or public.are_friends(auth.uid(), p.user_id)))
);
create policy post_reactions_write on public.post_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy post_comments_read on public.post_comments for select using (
  exists (select 1 from posts p where p.id = post_id and (p.user_id = auth.uid() or public.are_friends(auth.uid(), p.user_id)))
);
create policy post_comments_write on public.post_comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Challenges
create policy challenges_read on public.challenges for select using (
  auth.uid() = owner_id or exists (select 1 from challenge_participants cp where cp.challenge_id = challenges.id and cp.user_id = auth.uid())
);
create policy challenges_write on public.challenges for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy challenge_participants_all on public.challenge_participants for all using (
  auth.uid() = user_id or exists (select 1 from challenges c where c.id = challenge_id and c.owner_id = auth.uid())
) with check (auth.uid() = user_id or exists (select 1 from challenges c where c.id = challenge_id and c.owner_id = auth.uid()));

-- Triggers: PR recompute
create or replace function public.recompute_pr()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
  v_exercise uuid;
  v_weight numeric;
  v_reps int;
  v_est numeric;
  v_old_top numeric;
begin
  select s.user_id, se.exercise_id,
    coalesce(new.weight_kg, 0),
    coalesce(new.reps, 0)
  into v_user, v_exercise, v_weight, v_reps
  from session_exercises se
  join sessions s on s.id = se.session_id
  where se.id = new.session_exercise_id;

  if v_reps is null or v_reps <= 0 then return new; end if;

  v_est := round((v_weight * (1 + v_reps::numeric / 30))::numeric, 1);

  select max(est_1rm) into v_old_top from prs where user_id = v_user and exercise_id = v_exercise;

  insert into prs (user_id, exercise_id, weight_kg, reps, est_1rm, set_id, achieved_at)
  values (v_user, v_exercise, v_weight, v_reps, v_est, new.id, now());

  if v_old_top is null or v_est > v_old_top then
    if exists (select 1 from profiles where id = v_user and auto_post_pr) then
      insert into posts (user_id, kind, pr_id, body)
      values (v_user, 'pr', (select id from prs where set_id = new.id limit 1), 'New PR!');
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_recompute_pr after insert or update on public.sets
for each row execute function public.recompute_pr();

-- Streak + workout post on session insert
create or replace function public.on_session_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_streak public.streaks%rowtype;
begin
  if new.kind = 'rest' then return new; end if;

  select * into v_streak from streaks where user_id = new.user_id;
  if not found then
    insert into streaks (user_id, current_count, longest_count, last_log_date)
    values (new.user_id, 1, 1, new.date);
  else
    if v_streak.last_log_date = new.date - 1 then
      update streaks set current_count = current_count + 1,
        longest_count = greatest(longest_count, current_count + 1),
        last_log_date = new.date where user_id = new.user_id;
    elsif v_streak.last_log_date <> new.date then
      update streaks set current_count = 1, last_log_date = new.date where user_id = new.user_id;
    end if;
  end if;

  if exists (select 1 from profiles where id = new.user_id and auto_post_workout) then
    insert into posts (user_id, kind, session_id, body)
    values (new.user_id, 'workout', new.id, coalesce(new.name, 'Logged a workout'));
  end if;

  return new;
end;
$$;

create trigger trg_session_insert after insert on public.sessions
for each row execute function public.on_session_insert();

-- Realtime
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_reactions;
alter publication supabase_realtime add table public.post_comments;
