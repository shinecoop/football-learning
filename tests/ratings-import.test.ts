import { it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { validateRoster, run } from "../scripts/ratings/import.mjs";
const sample = JSON.parse(
  readFileSync("scripts/ratings/example.synthetic.json", "utf8"),
);
it("validates individual ratings and preserves source provenance", () => {
  const value = validateRoster(sample);
  expect(value.snapshot.edition).toBe(27);
  expect(value.players).toHaveLength(2);
  expect(value.snapshot.content_hash).toMatch(/^[a-f0-9]{64}$/);
  expect(
    validateRoster({ ...sample, players: [...sample.players].reverse() }),
  ).toEqual(value);
});
it("rejects duplicate identities, invalid ratings, and absent authorization basis", () => {
  expect(() => validateRoster({ ...sample, licenseBasis: "" })).toThrow();
  expect(() =>
    validateRoster({
      ...sample,
      players: [sample.players[0], sample.players[0]],
    }),
  ).toThrow();
  for (const rating of [-1, 100, 2.5, NaN])
    expect(() =>
      validateRoster({
        ...sample,
        players: [{ ...sample.players[0], ratings: { SPD: rating } }],
      }),
    ).toThrow();
});
it("dry runs without credentials or any network request", async () => {
  const fetcher = vi.fn();
  const result = await run(
    ["scripts/ratings/example.synthetic.json"],
    { NODE_ENV: "test" },
    fetcher,
  );
  expect(result.mode).toBe("dry-run");
  expect(fetcher).not.toHaveBeenCalled();
});
it("only applies a validated roster to the Supabase RPC", async () => {
  const fetcher = vi.fn(async () => new Response("2", { status: 200 }));
  await expect(
    run(
      ["scripts/ratings/example.synthetic.json", "--apply"],
      { NODE_ENV: "test" },
      fetcher,
    ),
  ).rejects.toThrow("Set SUPABASE");
  expect(fetcher).not.toHaveBeenCalled();
  const result = await run(
    ["scripts/ratings/example.synthetic.json", "--apply"],
    {
      NODE_ENV: "test",
      SUPABASE_URL: "https://test-project.supabase.co",
      SUPABASE_SECRET_KEY: "test-only",
    },
    fetcher,
  );
  expect(result.players).toBe(2);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith(
    expect.any(URL),
    expect.objectContaining({ method: "POST" }),
  );
});
