-- Profile body metrics + training goal for dynamic macro targets
alter table public.profiles add column if not exists body_weight_kg numeric;
alter table public.profiles add column if not exists training_goal text
  check (training_goal is null or training_goal in ('cut', 'maintain', 'bulk'));
