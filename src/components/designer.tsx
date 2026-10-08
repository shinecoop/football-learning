"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SANDBOX_FORMATIONS } from "@/domain/sandbox";
import {
  Save,
  Trash2,
  FolderOpen,
  PenTool,
  Check,
  Download,
} from "lucide-react";
import { formations } from "@/domain/formations";
import type { PlayerAlignment, Route, SavedPlay } from "@/domain/types";
import { routeLibrary, makeRoute, offsetRoute } from "@/lib/simulation";
import { useStore, savePlay, deletePlay } from "@/lib/store";
import { useAnimation } from "@/lib/use-animation";
import { FootballField } from "./field";
import { PageHeading, FieldControls, Tag } from "./ui";
export function Designer() {
  const router = useRouter();
  const { plays } = useStore();
  const [formationId, setFormationId] = useState("2x2");
  const [players, setPlayers] = useState<PlayerAlignment[]>(() =>
    structuredClone(formations[0].players),
  );
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selected, setSelected] = useState("X");
  const [name, setName] = useState("Untitled play");
  const [currentId, setCurrentId] = useState<string>();
  const [status, setStatus] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [labels, setLabels] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const animation = useAnimation();
  const player = players.find((p) => p.id === selected)!;
  const eligible = players.filter((p) => !["QB", "OL"].includes(p.position));
  const changeFormation = (id: string) => {
    setFormationId(id);
    setPlayers(structuredClone(formations.find((f) => f.id === id)!.players));
    setRoutes([]);
    setSelected("X");
    setCurrentId(undefined);
    setStatus("Formation changed. Routes cleared.");
    animation.restart();
  };
  const assign = (type: string) => {
    setRoutes((r) => [
      ...r.filter((r) => r.playerId !== selected),
      makeRoute(player, type),
    ]);
    setStatus("");
    animation.restart();
  };
  const save = () => {
    const play: SavedPlay = {
      id: currentId ?? crypto.randomUUID(),
      name: name.trim() || "Untitled play",
      formationId,
      players,
      routes: routes.map((r) => offsetRoute(r, players)),
      updatedAt: new Date().toISOString(),
    };
    savePlay(play);
    setCurrentId(play.id);
    setStatus("Saved on this device.");
    return play.id;
  };
  const load = (p: SavedPlay) => {
    setName(p.name);
    setFormationId(p.formationId);
    setPlayers(structuredClone(p.players));
    setRoutes(structuredClone(p.routes));
    setSelected("X");
    setCurrentId(p.id);
    setFlipped(false);
    setStatus(`Loaded “${p.name}”.`);
    animation.restart();
  };
  const exportPlay = () => {
    const data = {
      name,
      formationId,
      players,
      routes: routes.map((r) => offsetRoute(r, players)),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.trim().replace(/[^a-z0-9]/gi, "-") || "play"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Play exported as JSON.");
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR PLAYBOOK"
        title="Make the idea your own."
        description="Choose a formation, adjust the spacing, and give each receiver a job."
        action={
          <button className="button primary" onClick={save}>
            <Save size={16} />
            Save play
          </button>
        }
      />
      <div className="designer-toolbar">
        <label>
          PLAY NAME
          <input
            aria-label="Play name"
            maxLength={80}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setStatus("");
            }}
          />
        </label>
        <label>
          FORMATION
          <select
            value={formationId}
            onChange={(e) => changeFormation(e.target.value)}
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary" onClick={exportPlay}>
          <Download size={15} />
          Export
        </button>
        {SANDBOX_FORMATIONS.includes(formationId) && (
          <button
            className="button secondary"
            onClick={() => {
              const id = save();
              router.push(`/sandbox?play=${encodeURIComponent(id)}`);
            }}
          >
            Save & test in 7-on-7
          </button>
        )}
        <span className="save-status" role="status">
          {status && <Check size={14} />} {status}
        </span>
      </div>
      <div className="designer-layout">
        <section className="field-panel">
          <div className="field-panel-header">
            <h2>{name || "Untitled play"}</h2>
            <Tag green>
              {formations.find((f) => f.id === formationId)?.personnel}{" "}
              personnel
            </Tag>
          </div>
          <FootballField
            players={players}
            routes={routes}
            time={animation.time}
            flipped={flipped}
            labels={labels}
            showRoutes={showRoutes}
            selected={selected}
            onSelect={setSelected}
            onMove={(id, p) => {
              setPlayers((current) =>
                current.map((player) =>
                  player.id === id ? { ...player, ...p } : player,
                ),
              );
              setStatus("");
            }}
          />
          <FieldControls
            animation={animation}
            flipped={flipped}
            onFlip={() => {
              setPlayers((current) =>
                current.map((p) => ({ ...p, x: 100 - p.x })),
              );
              setRoutes((current) =>
                current.map((r) => ({
                  ...r,
                  waypoints: offsetRoute(r, players).waypoints.map((p) => ({
                    ...p,
                    x: 100 - p.x,
                  })),
                })),
              );
              setStatus("Play flipped.");
              animation.restart();
            }}
            labels={labels}
            onLabels={() => setLabels(!labels)}
            routes={showRoutes}
            onRoutes={() => setShowRoutes(!showRoutes)}
          />
          <p className="field-keyboard-note">
            Drag before the snap, use arrow keys on a focused player, or edit
            X/Y coordinates below.
          </p>
        </section>
        <aside className="designer-sidebar">
          <section className="panel route-panel">
            <span className="eyebrow">ASSIGN A ROUTE</span>
            <h2>Every route has a purpose.</h2>
            <label className="player-select">
              PLAYER
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.position}
                  </option>
                ))}
              </select>
            </label>
            <div className="coordinate-controls">
              <label>
                X position
                <input
                  aria-label="Player X position"
                  type="number"
                  step="0.1"
                  min="5"
                  max="95"
                  value={player.x}
                  disabled={animation.time !== 0}
                  onChange={(e) =>
                    setPlayers((current) =>
                      current.map((p) =>
                        p.id === selected
                          ? {
                              ...p,
                              x: Math.max(
                                5,
                                Math.min(95, Number(e.target.value)),
                              ),
                            }
                          : p,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Y position
                <input
                  aria-label="Player Y position"
                  type="number"
                  step="0.1"
                  min="71"
                  max="95"
                  value={player.y}
                  disabled={animation.time !== 0}
                  onChange={(e) =>
                    setPlayers((current) =>
                      current.map((p) =>
                        p.id === selected
                          ? {
                              ...p,
                              y: Math.max(
                                71,
                                Math.min(95, Number(e.target.value)),
                              ),
                            }
                          : p,
                      ),
                    )
                  }
                />
              </label>
            </div>
            {eligible.some((p) => p.id === selected) ? (
              <>
                <div className="route-library">
                  {routeLibrary.map((type) => (
                    <button
                      key={type}
                      className={
                        routes.find((r) => r.playerId === selected)
                          ?.routeType === type
                          ? "active"
                          : ""
                      }
                      onClick={() => assign(type)}
                    >
                      <PenTool size={12} />
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  className="clear-route"
                  disabled={!routes.some((r) => r.playerId === selected)}
                  onClick={() => {
                    setRoutes((r) => r.filter((r) => r.playerId !== selected));
                    setStatus("Route cleared.");
                  }}
                >
                  <Trash2 size={14} />
                  Clear {selected}’s route
                </button>
              </>
            ) : (
              <p className="subtle">
                Move this player’s alignment. Route assignments are available
                for eligible skill players.
              </p>
            )}
            <div className="note-box">
              <p>
                Routes use normalized field coordinates. This first version
                illustrates geometry; it does not validate legal formations or
                route timing.
              </p>
            </div>
          </section>
          <section className="panel saved-plays">
            <div className="section-header compact">
              <h3>Saved plays</h3>
              <FolderOpen size={17} />
            </div>
            {plays.length === 0 ? (
              <p className="subtle">
                Your saved plays will appear here. Stored locally on this
                device.
              </p>
            ) : (
              plays.map((p) => (
                <div className="saved-play-row" key={p.id}>
                  <button onClick={() => load(p)}>
                    <strong>{p.name}</strong>
                    <small>
                      {formations.find((f) => f.id === p.formationId)?.name} ·{" "}
                      {p.routes.length} routes
                    </small>
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => {
                      deletePlay(p.id);
                      if (currentId === p.id) setCurrentId(undefined);
                      setStatus("Saved play deleted.");
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
