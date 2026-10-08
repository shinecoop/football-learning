"""Validate the captured EA roster and generate an atomic, repeatable SQL import.

This script does not contact EA or a database. Apply the migration before the seed.
"""
import argparse
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ATTRIBUTES = set("""
acceleration agility awareness bCVision blockShedding breakSack breakTackle
carrying catchInTraffic catching changeOfDirection deepRouteRunning finesseMoves
hitPower impactBlocking injury jukeMove jumping kickAccuracy kickPower kickReturn
leadBlock manCoverage mediumRouteRunning passBlock passBlockFinesse passBlockPower
playAction playRecognition powerMoves press pursuit release runBlock runBlockFinesse
runBlockPower shortRouteRunning spectacularCatch speed spinMove stamina stiffArm
strength tackle throwAccuracyDeep throwAccuracyMid throwAccuracyShort throwOnTheRun
throwPower throwUnderPressure toughness trucking zoneCoverage
""".split())


def rating(value):
    return type(value) is int and 0 <= value <= 99


def validate(data):
    snapshot = data["snapshot"]
    players = data["ratingDetails"]["items"]
    total = data["ratingDetails"]["totalItems"]
    if snapshot["team"]["id"] != 4 or snapshot["team"]["label"] != "Denver Broncos":
        raise ValueError("Expected an EA Denver Broncos roster")
    if not players or len(players) != total:
        raise ValueError("Incomplete roster: player count does not match EA totalItems")
    seen = set()
    for player in players:
        if type(player["id"]) is not int or player["id"] in seen:
            raise ValueError("Invalid or duplicate EA player ID")
        seen.add(player["id"])
        if player["team"]["id"] != 4 or player["iteration"] != snapshot["iteration"]:
            raise ValueError("Mixed team or rating iteration")
        keys = set(player["stats"]) - {"overall", "runningStyle"}
        if keys != ATTRIBUTES:
            raise ValueError(f"Player {player['id']} does not have the expected 53 attributes")
        if not all(rating(player["stats"][key]["value"]) for key in ATTRIBUTES):
            raise ValueError(f"Player {player['id']} has invalid attribute ratings")
        if not rating(player["overallRating"]) or player["stats"]["overall"]["value"] != player["overallRating"]:
            raise ValueError("Invalid or inconsistent overall rating")
        if not isinstance(player["playerAbilities"], list):
            raise ValueError("Abilities must be an array")
        for ability in player["playerAbilities"]:
            if not all(isinstance(ability.get(key), str) for key in ("id", "label", "description")):
                raise ValueError("Ability is missing its identity or description")
        for field in ("firstName", "lastName"):
            if not isinstance(player[field], str) or not player[field].strip():
                raise ValueError("Missing player name")
    datetime.fromisoformat(data["retrieval"][0]["retrievedAtUtc"])
    return players


def sql(value):
    if value is None:
        return "null"
    if isinstance(value, (dict, list)):
        return sql(json.dumps(value, ensure_ascii=False, sort_keys=True)) + "::jsonb"
    if type(value) is int:
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def build_seed(data):
    players = validate(data)
    snapshot = data["snapshot"]
    retrieval = data["retrieval"][0]
    statements = [
        "-- Generated from the captured EA roster by scripts/prepare-player-ratings.py.",
        "-- Apply the player ratings migration first. Re-running this import is safe.",
        "begin;",
        "set local standard_conforming_strings = on;",
    ]
    for player in sorted(players, key=lambda p: p["id"]):
        name = f"{player['firstName']} {player['lastName']}"
        birth_date = player.get("birthdate", "").split(" ")[0] or None
        statements.append(
            "insert into public.players (ea_player_id, name, birth_date) values ("
            + ", ".join(map(sql, (player["id"], name, birth_date)))
            + ") on conflict (ea_player_id) do update set name = excluded.name, birth_date = excluded.birth_date;"
        )
        fields = {
            "source_url": retrieval["url"],
            "game_edition": snapshot["gameSlug"],
            "iteration_id": snapshot["iteration"]["id"],
            "update_label": snapshot["iteration"]["label"],
            "retrieved_at": retrieval["retrievedAtUtc"],
            "team_id": player["team"]["id"],
            "team": player["team"]["label"],
            "position": player["position"]["shortLabel"],
            "archetype": (player.get("archetype") or {}).get("label"),
            "overall": player["overallRating"],
            "height_inches": player.get("height"),
            "weight_pounds": player.get("weight"),
            "college": player.get("college"),
            "age": player.get("age"),
            "years_pro": player.get("yearsPro"),
            "jersey_number": player.get("jerseyNum"),
            "handedness_code": player.get("handedness"),
            "attributes": {key: player["stats"][key]["value"] for key in sorted(ATTRIBUTES)},
            "abilities": player["playerAbilities"],
            "raw_payload": player,
        }
        updates = ", ".join(f"{key} = excluded.{key}" for key in fields)
        statements.append(
            "insert into public.player_rating_snapshots (player_id, "
            + ", ".join(fields) + ") select id, "
            + ", ".join(sql(value) for value in fields.values())
            + f" from public.players where ea_player_id = {player['id']}"
            + " on conflict (player_id, game_edition, iteration_id) do update set "
            + updates
            + " where excluded.retrieved_at >= player_rating_snapshots.retrieved_at;"
        )
    statements.append("commit;")
    return "\n\n".join(statements) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "data/ea/broncos-madden-27-week-3.json")
    parser.add_argument("--output", type=Path, default=ROOT / "supabase/seed.sql")
    args = parser.parse_args()
    data = json.loads(args.input.read_text())
    seed = build_seed(data)
    args.output.write_text(seed)
    print(f"Validated {len(data['ratingDetails']['items'])} players with 53 ratings each; wrote {args.output}")
