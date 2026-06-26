-- Food logging schema v1

-- Canonical foods (cached from USDA / OFF / user-created / AI estimates)
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('usda', 'off', 'custom', 'ai')),
  source_id text,
  name text not null,
  brand text,
  serving_qty numeric,
  serving_unit text,
  serving_grams numeric,
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source, source_id)
);

-- Meals per user per day/slot
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists meals_user_date_idx on public.meals (user_id, date);

-- Individual food entries inside a meal
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  raw_text text,
  qty numeric not null,
  unit text not null,
  grams numeric,
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  ai_confidence numeric,
  created_at timestamptz not null default now()
);

create index if not exists food_logs_meal_idx on public.food_logs (meal_id);

-- Daily nutrition goals per user
create table if not exists public.nutrition_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kcal int not null default 2200,
  protein_g int not null default 150,
  carbs_g int not null default 220,
  fat_g int not null default 70,
  updated_at timestamptz not null default now()
);

-- Extend posts for meal sharing
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check
  check (kind in ('workout', 'pr', 'streak', 'note', 'meal'));

alter table public.posts add column if not exists meal_id uuid references public.meals(id) on delete set null;

-- Seed nutrition goals on profile creation
create or replace function public.seed_nutrition_goals()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into nutrition_goals (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_seed_nutrition_goals on public.profiles;
create trigger trg_seed_nutrition_goals
  after insert on public.profiles
  for each row execute function public.seed_nutrition_goals();

-- Backfill goals for existing profiles
insert into public.nutrition_goals (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- RLS
alter table public.foods enable row level security;
alter table public.meals enable row level security;
alter table public.food_logs enable row level security;
alter table public.nutrition_goals enable row level security;

-- Foods: readable by authenticated; writable for custom/ai owned foods
create policy foods_read on public.foods for select to authenticated using (true);
create policy foods_insert on public.foods for insert to authenticated
  with check (owner_id is null or auth.uid() = owner_id);
create policy foods_update on public.foods for update to authenticated
  using (owner_id is null or auth.uid() = owner_id);

-- Meals
create policy meals_read on public.meals for select using (
  auth.uid() = user_id
  or (public.are_friends(auth.uid(), user_id) and exists (
    select 1 from profiles p where p.id = meals.user_id and p.share_workouts = true
  ))
);
create policy meals_write on public.meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Food logs via meal ownership
create policy food_logs_read on public.food_logs for select using (
  exists (
    select 1 from meals m where m.id = meal_id and (
      m.user_id = auth.uid()
      or (public.are_friends(auth.uid(), m.user_id) and exists (
        select 1 from profiles p where p.id = m.user_id and p.share_workouts = true
      ))
    )
  )
);
create policy food_logs_write on public.food_logs for all using (
  exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid())
) with check (
  exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid())
);

-- Nutrition goals: own only
create policy nutrition_goals_all on public.nutrition_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
