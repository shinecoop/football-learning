import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
const text = (value, label, max = 500) => {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error(`Invalid ${label}.`);
  return value.trim();
};
export function validateRoster(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    input.version !== 1
  )
    throw new Error("Expected ratings export version 1.");
  const id = text(input.snapshotId, "snapshot ID", 100);
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(id))
    throw new Error("Use a lowercase snapshot ID.");
  if (
    !Number.isInteger(input.edition) ||
    input.edition < 20 ||
    input.edition > 99
  )
    throw new Error("Invalid Madden edition.");
  const sourceUrl = new URL(text(input.sourceUrl, "source URL", 2000));
  if (sourceUrl.protocol !== "https:")
    throw new Error("Source must use HTTPS.");
  const capturedAt = text(input.capturedAt, "capture time", 50);
  if (
    !/^\d{4}-\d{2}-\d{2}T/.test(capturedAt) ||
    !Number.isFinite(Date.parse(capturedAt))
  )
    throw new Error("Use an ISO capture timestamp.");
  if (
    !Array.isArray(input.players) ||
    input.players.length < 1 ||
    input.players.length > 5000
  )
    throw new Error("Expected 1–5000 players.");
  const seen = new Set();
  const players = input.players
    .map((p) => {
      if (!p || typeof p !== "object" || Array.isArray(p))
        throw new Error("Invalid player.");
      const sourceId = text(p.sourceId, "source player ID", 100);
      if (seen.has(sourceId)) throw new Error("Duplicate source player ID.");
      seen.add(sourceId);
      if (
        !p.ratings ||
        typeof p.ratings !== "object" ||
        Array.isArray(p.ratings) ||
        Object.keys(p.ratings).length < 1 ||
        Object.keys(p.ratings).length > 100
      )
        throw new Error("Expected individual player ratings.");
      const ratings = {};
      for (const [key, value] of Object.entries(p.ratings).sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      )) {
        if (
          !/^[A-Z][A-Z0-9_]{0,31}$/.test(key) ||
          !Number.isInteger(value) ||
          value < 0 ||
          value > 99
        )
          throw new Error(
            `Invalid rating ${key}; Madden source values must be integers 0–99.`,
          );
        ratings[key] = value;
      }
      return {
        source_id: sourceId,
        name: text(p.name, "player name", 150),
        team: text(p.team, "team", 100),
        position: text(p.position, "position", 30),
        ratings,
      };
    })
    .sort((a, b) =>
      a.source_id < b.source_id ? -1 : a.source_id > b.source_id ? 1 : 0,
    );
  const snapshot = {
    id,
    edition: input.edition,
    label: text(input.label, "snapshot label", 150),
    source_url: sourceUrl.href,
    captured_at: capturedAt,
    license_basis: text(
      input.licenseBasis,
      "authorization / license basis",
      2000,
    ),
  };
  const content_hash = createHash("sha256")
    .update(JSON.stringify({ snapshot, players }))
    .digest("hex");
  return { snapshot: { ...snapshot, content_hash }, players };
}
export async function run(args, env = process.env, fetcher = fetch) {
  const file = args[0];
  if (!file || args.some((a, i) => i > 0 && a !== "--apply"))
    throw new Error(
      "Usage: node scripts/ratings/import.mjs FILE.json [--apply]",
    );
  const raw = await readFile(file, "utf8");
  if (Buffer.byteLength(raw) > 15_000_000)
    throw new Error("Export exceeds 15 MB.");
  const payload = validateRoster(JSON.parse(raw));
  if (!args.includes("--apply"))
    return {
      mode: "dry-run",
      snapshot: payload.snapshot.id,
      edition: payload.snapshot.edition,
      players: payload.players.length,
      hash: payload.snapshot.content_hash,
    };
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY)
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_SECRET_KEY in the terminal environment. Never use NEXT_PUBLIC_ for this secret.",
    );
  const url = new URL(env.SUPABASE_URL);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".supabase.co") ||
    url.pathname !== "/" ||
    url.username ||
    url.password
  )
    throw new Error("Use your hosted Supabase project URL.");
  const response = await fetcher(
    new URL("/rest/v1/rpc/import_rating_snapshot", url),
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload }),
      signal: AbortSignal.timeout(60000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Supabase import failed (HTTP ${response.status}). Check the migration, project key, and immutable snapshot ID. No response body or credentials logged.`,
    );
  return {
    mode: "applied",
    snapshot: payload.snapshot.id,
    players: await response.json(),
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run(process.argv.slice(2))
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
