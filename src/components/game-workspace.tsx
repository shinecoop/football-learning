"use client";
import { PlayerRatings } from "./player-ratings";
import { baselineAttributes } from "@/domain/workspace-extras";
import { useState } from "react";
import {
  useStore,
  saveGame,
  saveProfile,
  savePlayerProfile,
  deleteExtra,
  importPlayers,
} from "@/lib/store";
import { newProfile, RECEIVER_IDS, scenarioCoverage } from "@/domain/sandbox";
import type { SandboxScenario } from "@/domain/sandbox";
import type { PlayerProfile } from "@/domain/workspace-extras";
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function GameWorkspace({
  scenario,
  update,
  load,
}: {
  scenario: SandboxScenario;
  update: (s: SandboxScenario) => void;
  load: (s: SandboxScenario) => void;
}) {
  const store = useStore();
  const [gameId, setGameId] = useState<string>();
  const [name, setName] = useState("Game 01");
  const [opponent, setOpponent] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [player, setPlayer] = useState<PlayerProfile>(() => ({
    id: crypto.randomUUID(),
    name: "New player",
    side: "both",
    positions: "",
    attributes: { ...baselineAttributes },
    ratings: newProfile().ratings,
    releaseDelay: 0,
    notes: "",
  }));
  const standard = () => {
    const baseline = { ...newProfile(), uncertainty: 0 };
    update({
      ...scenario,
      lineup: {},
      profileId: "default",
      profileSnapshot: baseline,
      receivers: Object.fromEntries(
        RECEIVER_IDS.map((id) => [id, { speed: 50, releaseDelay: 0 }]),
      ),
      defenders: Object.fromEntries(
        Object.entries(scenario.defenders).map(([id, d]) => [
          id,
          { ...d, ratings: { ...baseline.ratings } },
        ]),
      ),
    });
    setMessage(
      "Standard applied: every moving player uses baseline 50. Alignments and routes kept.",
    );
  };
  const assign = (id: string, value: string) => {
    const p = store.playerProfiles.find((p) => p.id === value);
    if (!p) return;
    if (RECEIVER_IDS.includes(id))
      update({
        ...scenario,
        lineup: { ...scenario.lineup, [id]: structuredClone(p) },
        receivers: {
          ...scenario.receivers,
          [id]: { speed: p.ratings.speed, releaseDelay: p.releaseDelay },
        },
      });
    else if (scenario.players.some((actor) => actor.id === id)) {
      update({
        ...scenario,
        lineup: { ...scenario.lineup, [id]: structuredClone(p) },
      });
    } else {
      const existing = scenario.defenders[id];
      const alignment = scenarioCoverage(scenario).defenders.find(
        (d) => d.id === id,
      );
      const assignment = scenarioCoverage(scenario).assignments.find(
        (d) => d.defenderId === id,
      );
      if (!existing && (!alignment || !assignment)) return;
      update({
        ...scenario,
        lineup: { ...scenario.lineup, [id]: structuredClone(p) },
        defenders: {
          ...scenario.defenders,
          [id]: {
            ...(existing ?? {
              x: alignment!.x,
              y: alignment!.y,
              cushion: 0,
              assignment: assignment!,
            }),
            ratings: { ...p.ratings },
          },
        },
      });
    }
    setMessage(
      `${p.name}'s settings copied to ${id}; save the game to keep this lineup.`,
    );
  };
  return (
    <section className="game-workspace" aria-label="Game workspace">
      <div className="inline-actions">
        <button className="button primary" onClick={standard}>
          Standard
        </button>
        <button
          className="button secondary"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? "Hide game & player setup" : "Game & player setup"}
        </button>
        <span className="muted-copy">
          Baseline 50 · illustrative ratings, not measured league averages
        </span>
      </div>
      {message && <p role="status">{message}</p>}
      {open && (
        <div className="game-grid">
          <div>
            <h2>Your game plan</h2>
            <label>
              Game name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </label>
            <label>
              Opponent
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                maxLength={100}
              />
            </label>
            <button
              className="button primary"
              onClick={() => {
                try {
                  const savedId = gameId ?? crypto.randomUUID();
                  saveGame({
                    id: savedId,
                    name,
                    opponent,
                    scenario: {
                      ...scenario,
                      profileSnapshot:
                        scenario.profileSnapshot ??
                        store.profiles.find((p) => p.id === scenario.profileId),
                    },
                    updatedAt: new Date().toISOString(),
                  });
                  setGameId(savedId);
                  setMessage(
                    "Game saved with a snapshot of offense, defense, routes, and opponent ratings.",
                  );
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              {gameId ? "Update game" : "Save game"}
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setGameId(undefined);
                setName("New game");
                setOpponent("");
                setMessage(
                  "New game ready. The current setup will be copied when saved.",
                );
              }}
            >
              New game
            </button>
            {store.games.map((g) => (
              <div className="saved-row" key={g.id}>
                <strong>
                  {g.name}
                  <small> · {g.opponent}</small>
                </strong>
                <button
                  className="button secondary"
                  onClick={() => {
                    if (
                      g.scenario.profileSnapshot &&
                      !store.profiles.some((p) => p.id === g.scenario.profileId)
                    )
                      saveProfile(g.scenario.profileSnapshot);
                    load(structuredClone(g.scenario));
                    setGameId(g.id);
                    setName(g.name);
                    setOpponent(g.opponent);
                    setMessage(
                      "Game loaded. Player settings restored from the saved snapshot.",
                    );
                  }}
                >
                  Load game
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete game ${g.name}`}
                  onClick={() => deleteExtra("games", g.id)}
                >
                  ×
                </button>
              </div>
            ))}
            <h3 style={{ marginTop: 24 }}>Assign a lineup</h3>
            <p className="muted-copy">
              Assign the same two-way athlete on offense and defense. Games
              retain a snapshot of the full player profile. Additional skills
              are saved for future simulation models; the current preview uses
              its existing movement settings.
            </p>
            {[
              ...scenario.players.map((actor) => actor.id),
              ...scenarioCoverage(scenario).defenders.map((d) => d.id),
            ].map((id) => (
              <div className="roster-row" key={id}>
                <strong>{id}</strong>
                <select
                  aria-label={`Assign profile to ${id}`}
                  value=""
                  onChange={(e) => assign(id, e.target.value)}
                >
                  <option value="">
                    {scenario.lineup?.[id]
                      ? `${scenario.lineup[id].name} · applied`
                      : "Choose player profile…"}
                  </option>
                  {store.playerProfiles
                    .filter(
                      (p) =>
                        p.side === "both" ||
                        p.side ===
                          (scenario.players.some((actor) => actor.id === id)
                            ? "offense"
                            : "defense"),
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
          <div>
            <h2>Player library</h2>
            <label>
              Player name
              <input
                value={player.name}
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                maxLength={100}
              />
            </label>
            <label>
              Plays on
              <select
                aria-label="Plays on"
                value={player.side}
                onChange={(e) =>
                  setPlayer({
                    ...player,
                    side: e.target.value as PlayerProfile["side"],
                  })
                }
              >
                <option value="offense">Offense</option>
                <option value="defense">Defense</option>
                <option value="both">Offense & defense</option>
              </select>
            </label>
            <label>
              Positions
              <input
                placeholder="e.g. WR / CB, RB / LB"
                value={player.positions ?? ""}
                maxLength={100}
                onChange={(e) =>
                  setPlayer({ ...player, positions: e.target.value })
                }
              />
            </label>
            <PlayerRatings player={player} onChange={setPlayer} />
            {player.side !== "defense" && (
              <label>
                Release delay (seconds)
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={player.releaseDelay}
                  onChange={(e) =>
                    setPlayer({
                      ...player,
                      releaseDelay: Number(e.target.value),
                    })
                  }
                />
              </label>
            )}
            <label>
              Notes
              <input
                value={player.notes}
                onChange={(e) =>
                  setPlayer({ ...player, notes: e.target.value })
                }
              />
            </label>
            <div className="inline-actions">
              <button
                className="button primary"
                onClick={() => {
                  try {
                    savePlayerProfile(player);
                    setPlayer({
                      ...player,
                      id: crypto.randomUUID(),
                      name: "New player",
                    });
                    setMessage("Player saved to your library.");
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Save player
              </button>
              <button
                className="button secondary"
                onClick={() =>
                  download(store.playerProfiles, "fieldwork-players.json")
                }
              >
                Export players
              </button>
            </div>
            <label>
              Import player data
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    importPlayers(await f.text());
                    setMessage("Player library imported.");
                  } catch (err) {
                    setMessage((err as Error).message);
                  }
                  e.target.value = "";
                }}
              />
            </label>
            {store.playerProfiles.map((p) => (
              <div className="saved-row" key={p.id}>
                <strong>
                  {p.name} · {p.side === "both" ? "two-way" : p.side}
                  {p.positions ? ` · ${p.positions}` : ""}
                </strong>
                <button
                  className="button secondary"
                  onClick={() => setPlayer(structuredClone(p))}
                >
                  Edit
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete player ${p.name}`}
                  onClick={() => deleteExtra("playerProfiles", p.id)}
                >
                  ×
                </button>
              </div>
            ))}
            <p className="muted-copy">
              Full workspace backups include games and player libraries. Use
              Import / export above to move everything together.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
