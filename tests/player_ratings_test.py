import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("ratings", ROOT / "scripts/prepare-player-ratings.py")
ratings = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ratings)


class PlayerRatingsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = json.loads((ROOT / "data/ea/broncos-madden-27-week-3.json").read_text())

    def test_complete_roster(self):
        self.assertEqual(len(ratings.validate(self.source)), 60)
        self.assertEqual(len(ratings.ATTRIBUTES), 53)

    def test_reject_invalid_rosters(self):
        mutations = [
            lambda d: d["ratingDetails"]["items"].pop(),
            lambda d: d["ratingDetails"]["items"][1].update(id=d["ratingDetails"]["items"][0]["id"]),
            lambda d: d["ratingDetails"]["items"][0]["team"].update(id=1),
            lambda d: d["ratingDetails"]["items"][0]["iteration"].update(id="wrong-week"),
            lambda d: d["ratingDetails"]["items"][0]["stats"].pop("speed"),
            lambda d: d["ratingDetails"]["items"][0]["stats"]["speed"].update(value=100),
            lambda d: d["ratingDetails"]["items"][0]["stats"]["speed"].update(value=True),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                data = copy.deepcopy(self.source)
                mutation(data)
                with self.assertRaises(ValueError):
                    ratings.validate(data)

    def test_seed_is_deterministic_and_transactional(self):
        seed = ratings.build_seed(self.source)
        self.assertEqual(seed, ratings.build_seed(self.source))
        self.assertEqual(seed.count("insert into public.players "), 60)
        self.assertEqual(seed.count("insert into public.player_rating_snapshots "), 60)
        self.assertIn("begin;", seed)
        self.assertTrue(seed.endswith("commit;\n"))
        self.assertIn("on conflict (player_id, game_edition, iteration_id)", seed)
        self.assertIn("excluded.retrieved_at >= player_rating_snapshots.retrieved_at", seed)

    def test_sql_escapes_apostrophes_and_preserves_null(self):
        self.assertEqual(ratings.sql("Ja'Marr"), "'Ja''Marr'")
        self.assertEqual(ratings.sql(None), "null")


if __name__ == "__main__":
    unittest.main()
