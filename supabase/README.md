# Player ratings database

## Status

The repository contains a Supabase-compatible PostgreSQL migration and an EA roster
snapshot. **No hosted database has been configured or populated yet.** There are no
Supabase credentials in this project. The existing application still uses its local
store; these tables do not change the interactive diagram's behavior.

## Captured data

- Source: EA's public Denver Broncos ratings page, `team=4`.
- Edition: `madden-nfl-27`; iteration: `madden-ratings-week-3`.
- 60 unique players; 53 attributes each; overall stored separately.
- 7 players have abilities, with 16 ability assignments total.
- This is EA's roster, not a claim about the NFL active roster.
- Original data and retrieval metadata: `data/ea/broncos-madden-27-week-3.json`.
- Source page 1 returned 60 of 60 records; page 2 returned none.

These are video-game ratings, not measured physical performance. Review EA's terms
and applicable licensing before publishing or redistributing this dataset. This is a
one-time source snapshot, not a configured recurring scraper.

## Tables

`players` stores a stable internal UUID, unique EA ID, name, and birth date.
`player_rating_snapshots` stores edition/update identity, source and retrieval time,
team, position, archetype, overall, dated profile fields, all 53 ratings as JSONB,
abilities, and the original player payload (including rating deltas/running style).
Height is stored in inches and weight in pounds, matching the source data. Handedness
remains the provider's numeric code rather than an inferred label.

The unique key `(player_id, game_edition, iteration_id)` makes seed imports repeatable.
New iterations create new rows; a newer capture of the same iteration updates it.
Older captures cannot overwrite newer rating snapshots. Historical team information
belongs to snapshots rather than the identity table.

RLS is enabled. Authenticated users can read; anonymous users cannot. Client roles
cannot write. Imports use the database owner/admin connection. Do not put database
passwords or service-role keys in browser code or `NEXT_PUBLIC_` variables.

## Prepare and validate

Requires Python 3; no additional Python packages:

```sh
python3 scripts/prepare-player-ratings.py
python3 -m unittest discover -s tests -p '*_test.py'
```

The first command validates the full input before writing `supabase/seed.sql`.
It checks roster completeness, unique IDs, team/update consistency, all expected
attribute names, integer ranges, overall consistency, and ability metadata.

## Apply to Supabase

1. Create/select your Supabase project.
2. In its SQL Editor, run `migrations/202610080001_player_ratings.sql` once.
3. Run the generated `seed.sql`. It is transactional and safe to repeat.

Alternatively, with `psql` installed and a secure PostgreSQL connection configured
through `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGSSLMODE=verify-full`
(with the appropriate CA certificate), use a password prompt or `.pgpass`:

```sh
psql -v ON_ERROR_STOP=1 -f supabase/migrations/202610080001_player_ratings.sql
psql -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

The migration targets Supabase's existing `anon`, `authenticated`, and `service_role`
roles. It is not intended to run on vanilla PostgreSQL without role setup. Do not
rerun the initial migration after it has been applied; add a new migration instead.

## Verify after importing

```sql
select count(*) as roster_count
from public.player_rating_snapshots
where team_id = 4
  and game_edition = 'madden-nfl-27'
  and iteration_id = 'madden-ratings-week-3';
-- Expected: 60

select p.name, s.position, s.overall,
       (s.attributes ->> 'speed')::integer as speed,
       (s.attributes ->> 'acceleration')::integer as acceleration
from public.players p
join public.player_rating_snapshots s on s.player_id = p.id
where s.team_id = 4
  and s.game_edition = 'madden-nfl-27'
  and s.iteration_id = 'madden-ratings-week-3'
order by s.overall desc, p.name;
```
