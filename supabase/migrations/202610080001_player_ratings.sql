begin;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  ea_player_id bigint not null unique,
  name text not null,
  birth_date date,
  created_at timestamptz not null default now()
);

-- Ratings are EA game attributes, not measured physical performance.
create function public.valid_player_attributes(attributes jsonb)
returns boolean
language sql immutable strict
set search_path = ''
as $$
  select case when jsonb_typeof(attributes) <> 'object' then false else
    (select count(*) = 53 and coalesce(bool_and(
      case when jsonb_typeof(value) = 'number' then
        (value::text)::numeric between 0 and 99
        and (value::text)::numeric = trunc((value::text)::numeric)
      else false end
    ), false) from jsonb_each(attributes))
  end;
$$;

create table public.player_rating_snapshots (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  source_url text not null,
  game_edition text not null,
  iteration_id text not null,
  update_label text not null,
  retrieved_at timestamptz not null,
  team_id integer not null,
  team text not null,
  position text not null,
  archetype text,
  overall smallint not null check (overall between 0 and 99),
  height_inches smallint,
  weight_pounds smallint,
  college text,
  age smallint,
  years_pro smallint,
  jersey_number smallint,
  -- Retain the provider code without guessing its meaning.
  handedness_code smallint,
  attributes jsonb not null check (public.valid_player_attributes(attributes)),
  abilities jsonb not null check (jsonb_typeof(abilities) = 'array'),
  raw_payload jsonb not null check (jsonb_typeof(raw_payload) = 'object'),
  unique (player_id, game_edition, iteration_id)
);

create index player_rating_snapshots_roster_idx
  on public.player_rating_snapshots (game_edition, iteration_id, team_id, position);

alter table public.players enable row level security;
alter table public.player_rating_snapshots enable row level security;

-- No browser writes or anonymous access. Review data licensing before publishing.
revoke all on public.players, public.player_rating_snapshots from anon, authenticated;
grant select on public.players, public.player_rating_snapshots to authenticated;
grant all on public.players, public.player_rating_snapshots to service_role;
create policy "Authenticated users can read player identities"
  on public.players for select to authenticated using (true);
create policy "Authenticated users can read rating snapshots"
  on public.player_rating_snapshots for select to authenticated using (true);

commit;
