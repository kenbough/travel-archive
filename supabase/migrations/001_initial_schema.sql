-- Travel Archive initial schema
-- Date precision is explicit: no fake 01/01 dates are written for fuzzy memories.

create extension if not exists pgcrypto;

create type public.trip_date_precision as enum ('year', 'month', 'day');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text,
  memo text,

  date_precision public.trip_date_precision not null,
  start_year integer not null check (start_year between 1800 and 2200),
  start_month integer check (start_month between 1 and 12),
  start_day integer check (start_day between 1 and 31),
  end_year integer check (end_year between 1800 and 2200),
  end_month integer check (end_month between 1 and 12),
  end_day integer check (end_day between 1 and 31),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trips_date_shape check (
    (date_precision = 'year' and start_month is null and start_day is null and end_month is null and end_day is null)
    or
    (date_precision = 'month' and start_month is not null and start_day is null and end_day is null
      and ((end_year is null and end_month is null) or (end_year is not null and end_month is not null)))
    or
    (date_precision = 'day' and start_month is not null and start_day is not null
      and ((end_year is null and end_month is null and end_day is null)
        or (end_year is not null and end_month is not null and end_day is not null)))
  )
);

create table public.trip_countries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  country_code char(3) not null,
  unique (trip_id, country_code)
);

create table public.trip_prefectures (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  prefecture_code char(2) not null check (prefecture_code ~ '^[0-9]{2}$'),
  unique (trip_id, prefecture_code)
);

create table public.trip_places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  country_code char(3),
  latitude double precision,
  longitude double precision,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index trips_user_sort_idx on public.trips (user_id, start_year desc, start_month desc nulls last, start_day desc nulls last);
create index trip_countries_country_idx on public.trip_countries (country_code);
create index trip_prefectures_pref_idx on public.trip_prefectures (prefecture_code);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, color, sort_order) values
    (new.id, 'Personal', '#3E7FA6', 10),
    (new.id, 'Family',   '#D69C2F', 20),
    (new.id, 'Work',     '#B8463B', 30),
    (new.id, 'Solo',     '#43816A', 40),
    (new.id, 'Other',    '#85837C', 50);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.trips enable row level security;
alter table public.trip_countries enable row level security;
alter table public.trip_prefectures enable row level security;
alter table public.trip_places enable row level security;

create policy "profiles own row" on public.profiles
for all using (id = auth.uid()) with check (id = auth.uid());

create policy "categories own rows" on public.categories
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "trips own rows" on public.trips
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "trip countries through owned trip" on public.trip_countries
for all
using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

create policy "trip prefectures through owned trip" on public.trip_prefectures
for all
using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

create policy "trip places through owned trip" on public.trip_places
for all
using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
