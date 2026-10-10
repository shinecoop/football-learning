-- Private, immutable source ratings. No access from browser roles yet.
begin;
create table public.rating_snapshots (
 id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{0,99}$'),
 edition smallint not null check (edition between 20 and 99),
 label text not null,
 source_url text not null check (source_url like 'https://%'),
 captured_at timestamptz not null,
 license_basis text not null check (length(trim(license_basis)) > 0),
 content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
 imported_at timestamptz not null default now()
);
create table public.player_rating_snapshots (
 snapshot_id text not null references public.rating_snapshots(id),
 source_id text not null,
 name text not null,
 team text not null,
 position text not null,
 ratings jsonb not null check (jsonb_typeof(ratings) = 'object'),
 primary key (snapshot_id, source_id)
);
create index player_rating_team_idx on public.player_rating_snapshots(snapshot_id,team);
alter table public.rating_snapshots enable row level security;
alter table public.player_rating_snapshots enable row level security;
revoke all on public.rating_snapshots, public.player_rating_snapshots from anon, authenticated;
grant select, insert on public.rating_snapshots, public.player_rating_snapshots to service_role;

-- A single RPC inserts the snapshot and roster in one transaction.
create function public.import_rating_snapshot(payload jsonb) returns integer
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
 s jsonb := payload->'snapshot';
 p jsonb;
 metric record;
 existing_hash text;
 sid text := s->>'id';
 roster_count integer;
begin
 if jsonb_typeof(payload->'players') is distinct from 'array' then
  raise exception 'Expected players array';
 end if;
 roster_count := jsonb_array_length(payload->'players');
 if roster_count not between 1 and 5000 then raise exception 'Invalid roster size'; end if;
 select content_hash into existing_hash from public.rating_snapshots where id=sid;
 if existing_hash is not null then
  if existing_hash is distinct from s->>'content_hash' then
   raise exception 'Snapshot is immutable: use a new ID for a changed export';
  end if;
  return (select count(*)::integer from public.player_rating_snapshots where snapshot_id=sid);
 end if;
 insert into public.rating_snapshots(id,edition,label,source_url,captured_at,license_basis,content_hash)
 values(sid,(s->>'edition')::smallint,s->>'label',s->>'source_url',(s->>'captured_at')::timestamptz,s->>'license_basis',s->>'content_hash');
 for p in select value from jsonb_array_elements(payload->'players') loop
  if jsonb_typeof(p->'ratings') is distinct from 'object' or p->'ratings'='{}'::jsonb then raise exception 'Invalid ratings'; end if;
  for metric in select key,value from jsonb_each(p->'ratings') loop
   if metric.key !~ '^[A-Z][A-Z0-9_]{0,31}$' or jsonb_typeof(metric.value) is distinct from 'number' then raise exception 'Invalid metric'; end if;
   if (metric.value::text)::numeric not between 0 and 99 or trunc((metric.value::text)::numeric) <> (metric.value::text)::numeric then raise exception 'Invalid rating range'; end if;
  end loop;
  insert into public.player_rating_snapshots(snapshot_id,source_id,name,team,position,ratings)
  values(sid,p->>'source_id',p->>'name',p->>'team',p->>'position',p->'ratings');
 end loop;
 return roster_count;
end;
$$;
revoke all on function public.import_rating_snapshot(jsonb) from public, anon, authenticated;
grant execute on function public.import_rating_snapshot(jsonb) to service_role;
commit;
