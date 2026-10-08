"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Undo2,
  Redo2,
  ArrowRight,
  Plus,
  Clock,
  PenTool,
  Shield,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import type { Point, Route } from "@/domain/types";
import type { SandboxScenario } from "@/domain/sandbox";
import {
  createScenario,
  scenarioCoverage,
  newProfile,
  scenarioFromDesigner,
  SANDBOX_FORMATIONS,
  SANDBOX_DURATION,
  RECEIVER_IDS,
} from "@/domain/sandbox";
import { concepts } from "@/domain/concepts";
import { useStore, saveScenario, saveProfile } from "@/lib/store";
import { offsetRoute } from "@/lib/simulation";
import { simulateScenario, frameAt } from "@/lib/sandbox-engine";
import { useAnimation } from "@/lib/use-animation";
import { useHistory } from "@/lib/use-history";
import { FootballField } from "./field";
import { PageHeading, FieldControls, Tag } from "./ui";
import { SandboxToolbar } from "./sandbox-toolbar";
import { SandboxLibrary } from "./sandbox-library";
import { SandboxRouteEditor } from "./sandbox-route-editor";
import { SandboxDefenseEditor } from "./sandbox-defense-editor";
import {
  SandboxTiming,
  SandboxComparison,
  SandboxRules,
} from "./sandbox-analysis";
type Tab = "draw" | "defense" | "timing" | "compare" | "rules";
export function Sandbox() {
  const store = useStore();
  const params = useSearchParams();
  const playId = params.get("play");
  const play = store.plays.find((p) => p.id === playId);
  if (!store.hydrated)
    return (
      <>
        <PageHeading
          eyebrow="7-ON-7 WORKSPACE"
          title="Draw. Test. Understand."
          description="Preparing your local routes and opponent assumptions."
        />
        <p className="panel subtle" role="status">
          Loading the local workspace…
        </p>
      </>
    );
  if (playId && (!play || !SANDBOX_FORMATIONS.includes(play.formationId)))
    return (
      <div className="empty-state">
        <h2>This saved play cannot be opened here.</h2>
        <p>
          Use a saved play with X, H, Y, Z, and RB in a supported spread
          formation.
        </p>
        <Link className="button primary" href="/sandbox">
          Start a new scenario
        </Link>
      </div>
    );
  return (
    <SandboxWorkspace
      key={playId ?? "new"}
      initial={play ? scenarioFromDesigner(play) : undefined}
    />
  );
}
function SandboxWorkspace({ initial }: { initial?: SandboxScenario }) {
  const { profiles } = useStore();
  const history = useHistory(() => initial ?? createScenario());
  const scenario = history.value;
  const [tab, setTab] = useState<Tab>("draw");
  const [selected, setSelected] = useState("Y");
  const [drawing, setDrawing] = useState(false);
  const [originalRoute, setOriginalRoute] = useState<Route>();
  const [originalConceptId, setOriginalConceptId] = useState("smash");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [labels, setLabels] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [zones, setZones] = useState(true);
  const [assignments, setAssignments] = useState(false);
  const [variation, setVariation] = useState(1);
  const animation = useAnimation(SANDBOX_DURATION * 1000);
  const savedProfile =
    profiles.find((p) => p.id === scenario.profileId) ??
    profiles[0] ??
    newProfile();
  const profile = scenario.profileSnapshot ?? savedProfile;
  const coverage = useMemo(() => scenarioCoverage(scenario), [scenario]);
  const results = useMemo(
    () =>
      [-profile.uncertainty, 0, profile.uncertainty].map((amount) =>
        simulateScenario(scenario, profile, amount),
      ),
    [scenario, profile],
  );
  const result = results[variation];
  const seconds = animation.time * SANDBOX_DURATION;
  const frame = frameAt(result, seconds);
  const selectedRoute = scenario.routes.find((r) => r.playerId === selected);
  const concept = concepts.find((c) => c.id === scenario.conceptId);
  const incomplete = scenario.routes.some((r) => r.waypoints.length < 2);
  const update = (
    next: SandboxScenario | ((s: SandboxScenario) => SandboxScenario),
  ) => {
    history.update(next);
    animation.restart();
    setError("");
    setMessage("Unsaved scenario changes.");
  };
  const cancelDrawing = () => {
    update((s) => ({
      ...s,
      conceptId: originalConceptId,
      routes: [
        ...s.routes.filter((r) => r.playerId !== selected),
        ...(originalRoute ? [originalRoute] : []),
      ],
    }));
    setDrawing(false);
  };
  const select = (id: string) => {
    if (drawing && id !== selected) cancelDrawing();
    setSelected(id);
  };
  const move = (id: string, p: Point) => {
    history.preview((s) => {
      if (s.defenders[id])
        return {
          ...s,
          defenders: {
            ...s.defenders,
            [id]: {
              ...s.defenders[id],
              x: p.x,
              y: Math.min(69, p.y + s.defenders[id].cushion * 2),
            },
          },
        };
      const players = s.players.map((player) =>
        player.id === id ? { ...player, ...p } : player,
      );
      return {
        ...s,
        players,
        routes: s.routes.map((r) =>
          r.playerId === id ? offsetRoute(r, players) : r,
        ),
      };
    });
    setMessage("Unsaved alignment changes.");
  };
  const moveWaypoint = (index: number, p: Point) => {
    history.preview((s) => ({
      ...s,
      conceptId: "custom",
      routes: s.routes.map((r) =>
        r.playerId === selected
          ? {
              ...r,
              waypoints: r.waypoints.map((w, i) => (i === index + 1 ? p : w)),
            }
          : r,
      ),
    }));
    setMessage("Unsaved route changes.");
  };
  const beginDrawing = () => {
    setOriginalConceptId(scenario.conceptId);
    setOriginalRoute(
      selectedRoute ? structuredClone(selectedRoute) : undefined,
    );
    setDrawing(true);
    const player = scenario.players.find((p) => p.id === selected)!;
    update((s) => ({
      ...s,
      conceptId: "custom",
      routes: [
        ...s.routes.filter((r) => r.playerId !== selected),
        {
          playerId: selected,
          routeType: "custom",
          waypoints: [{ x: player.x, y: player.y }],
        },
      ],
    }));
    requestAnimationFrame(() =>
      document
        .getElementById("sandbox-field")
        ?.scrollIntoView({ block: "start", behavior: "auto" }),
    );
  };
  const showRelease = () => {
    animation.restart();
    animation.setTime(scenario.releaseTime / SANDBOX_DURATION);
    setDrawing(false);
  };
  const save = () => {
    try {
      if (drawing || incomplete)
        throw new Error("Finish or cancel the route drawing before saving.");
      const value = {
        ...scenario,
        id: scenario.id === "draft" ? crypto.randomUUID() : scenario.id,
        name: scenario.name.trim(),
        profileSnapshot: structuredClone(profile),
        updatedAt: new Date().toISOString(),
      };
      saveScenario(value);
      history.replace(value);
      setError("");
      setMessage("Scenario saved, including the exact opponent assumptions.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scenario could not be saved.");
    }
  };
  const loadScenario = (value: SandboxScenario) => {
    update(structuredClone(value));
    setDrawing(false);
    setSelected("Y");
    setMessage(
      `Loaded “${value.name}”. Its saved opponent assumptions are retained.`,
    );
  };
  return (
    <>
      <PageHeading
        eyebrow="THE NEXT FOUNDATION · 7-ON-7"
        title="Draw. Test. Understand."
        description="Explore route timing and defensive responsibilities with assumptions you can inspect."
        action={
          <button className="button primary" onClick={save}>
            <Save size={15} />
            Save scenario
          </button>
        }
      />
      <div className="sandbox-intro">
        <div>
          <Tag green>7 offense · 7 coverage defenders</Tag>
          <Tag>Uncalibrated model</Tag>
        </div>
        <p>
          No live rush, ball flight, collisions, or completion probabilities.
          Start with an idea, then compare the assumptions.
        </p>
      </div>
      <SandboxToolbar
        scenario={scenario}
        drawing={drawing}
        update={update}
        setSelected={setSelected}
        setMessage={setMessage}
      />
      <div className="scenario-actions">
        <button
          className="button secondary"
          disabled={!history.canUndo}
          onClick={() => {
            history.undo();
            animation.restart();
            setMessage("Undid the last edit.");
          }}
        >
          <Undo2 size={14} />
          Undo
        </button>
        <button
          className="button secondary"
          disabled={!history.canRedo}
          onClick={() => {
            history.redo();
            animation.restart();
            setMessage("Redid the last edit.");
          }}
        >
          <Redo2 size={14} />
          Redo
        </button>
        <button
          className="button secondary"
          onClick={() => {
            update(createScenario());
            setDrawing(false);
            setSelected("Y");
          }}
        >
          <Plus size={14} />
          New scenario
        </button>
        <span role="status">{message}</span>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="sandbox-layout">
        <div className="sandbox-field-column">
          <section id="sandbox-field" className="field-panel">
            <div className="field-panel-header">
              <div>
                <span className="eyebrow">
                  {drawing ? "CLICK TO ADD ROUTE POINTS" : "TIMED REPLAY"}
                </span>
                <h2>
                  {coverage.name} <small>·</small>{" "}
                  {scenario.name || "Untitled scenario"}
                </h2>
              </div>
              <span className="replay-clock">
                <Clock size={13} />
                {seconds.toFixed(2)}s / 6s
              </span>
            </div>
            <FootballField
              title="Seven-on-seven scenario field"
              players={scenario.players}
              routes={scenario.routes}
              coverage={coverage}
              positions={frame.positions}
              time={animation.time}
              labels={labels}
              showRoutes={showRoutes}
              showZones={zones}
              showAssignments={assignments}
              selected={selected}
              editableDefense
              onSelect={select}
              onMove={move}
              onMoveStart={history.beginGesture}
              onMoveEnd={history.endGesture}
              onFieldPoint={
                drawing && RECEIVER_IDS.includes(selected)
                  ? (p) => {
                      if ((selectedRoute?.waypoints.length ?? 0) >= 40) {
                        setError("A route can have at most 40 points.");
                        return;
                      }
                      update((s) => ({
                        ...s,
                        routes: s.routes.map((r) =>
                          r.playerId === selected
                            ? { ...r, waypoints: [...r.waypoints, p] }
                            : r,
                        ),
                      }));
                    }
                  : undefined
              }
              editableWaypoints={
                tab === "draw" && animation.time === 0
                  ? (selectedRoute?.waypoints.slice(1) ?? [])
                  : []
              }
              onWaypointMove={moveWaypoint}
              throwTarget={seconds > 0 ? scenario.targetId : undefined}
            />
            <FieldControls
              animation={animation}
              flipped={false}
              onFlip={() =>
                update((s) => ({
                  ...s,
                  players: s.players.map((p) => ({ ...p, x: 100 - p.x })),
                  routes: s.routes.map((r) => ({
                    ...r,
                    waypoints: r.waypoints.map((p) => ({ ...p, x: 100 - p.x })),
                  })),
                }))
              }
              labels={labels}
              onLabels={() => setLabels(!labels)}
              routes={showRoutes}
              onRoutes={() => setShowRoutes(!showRoutes)}
              zones={zones}
              onZones={() => setZones(!zones)}
              assignments={assignments}
              onAssignments={() => setAssignments(!assignments)}
            />
            <div className="replay-variants" aria-label="Replay assumptions">
              {["Lower ratings", "Baseline", "Higher ratings"].map(
                (label, i) => (
                  <button
                    key={label}
                    aria-pressed={variation === i}
                    className={variation === i ? "active" : ""}
                    onClick={() => setVariation(i)}
                  >
                    {label}
                  </button>
                ),
              )}
              <button onClick={showRelease}>
                Release at {scenario.releaseTime.toFixed(1)}s
                <ArrowRight size={13} />
              </button>
            </div>
            <p className="field-keyboard-note">
              Drag offense or defense before the snap. Arrow keys and coordinate
              inputs also work. Flip mirrors the offense; defensive
              responsibilities remain fixed. Restart before editing alignments.
            </p>
          </section>
          <section className="panel release-panel">
            <div className="section-header compact">
              <h3>Release-frame spacing</h3>
              <Tag>
                {scenario.releaseTime.toFixed(1)}s ·{" "}
                {["lower", "baseline", "higher"][variation]} ratings
              </Tag>
            </div>
            <div className="release-metrics">
              {result.windows.map((w) => (
                <button
                  key={w.receiverId}
                  className={scenario.targetId === w.receiverId ? "active" : ""}
                  onClick={() =>
                    update({ ...scenario, targetId: w.receiverId })
                  }
                >
                  <span>{w.receiverId}</span>
                  <strong>
                    {w.separation.toFixed(1)}
                    <small> yd</small>
                  </strong>
                  <small>nearest: {w.nearestDefenderId}</small>
                </button>
              ))}
            </div>
            <p
              className={
                result.pressureExpired ? "deadline-warning" : "deadline-ok"
              }
            >
              {result.pressureExpired
                ? "Release is at or after the hypothetical pressure deadline."
                : "Release is before the hypothetical pressure deadline."}{" "}
              Lane clearance and nearest spacing are geometry observations.
            </p>
          </section>
          <SandboxLibrary
            scenario={scenario}
            loadScenario={loadScenario}
            update={update}
            setMessage={setMessage}
          />
        </div>
        <aside className="panel sandbox-inspector">
          <div
            className="sandbox-tabs"
            role="tablist"
            aria-label="Sandbox tools"
          >
            {[
              { id: "draw", label: "Draw", icon: PenTool },
              { id: "defense", label: "Defense", icon: Shield },
              { id: "timing", label: "Timing", icon: Clock },
              { id: "compare", label: "Compare", icon: SlidersHorizontal },
              { id: "rules", label: "Rules", icon: Info },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  role="tab"
                  aria-selected={tab === t.id}
                  key={t.id}
                  className={tab === t.id ? "active" : ""}
                  onClick={() => {
                    setTab(t.id as Tab);
                    if (t.id === "defense")
                      select(
                        coverage.defenders.some((d) => d.id === selected)
                          ? selected
                          : "A",
                      );
                    if (
                      t.id === "draw" &&
                      !scenario.players.some((p) => p.id === selected)
                    )
                      select("Y");
                  }}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="sandbox-tab-body" role="tabpanel">
            {tab === "draw" && (
              <SandboxRouteEditor
                scenario={scenario}
                selected={selected}
                onSelect={select}
                onChange={update}
                drawing={drawing}
                onBeginDrawing={beginDrawing}
                onCancelDrawing={cancelDrawing}
                onFinishDrawing={() => {
                  setDrawing(false);
                  setMessage("Route finished. Replay or save the scenario.");
                }}
                disabled={animation.time !== 0}
              />
            )}
            {tab === "defense" && (
              <SandboxDefenseEditor
                scenario={scenario}
                selected={selected}
                onSelect={select}
                onChange={update}
                profile={profile}
                disabled={animation.time !== 0}
              />
            )}
            {tab === "timing" && (
              <SandboxTiming
                scenario={scenario}
                onChange={update}
                onRelease={showRelease}
              />
            )}
            {tab === "compare" && (
              <SandboxComparison
                scenario={scenario}
                profile={profile}
                results={results}
                profiles={profiles}
                onChange={update}
                onSaveProfile={() => {
                  try {
                    const next = {
                      ...profile,
                      updatedAt: new Date().toISOString(),
                    };
                    saveProfile(next);
                    setMessage("Opponent assumptions saved to the profile.");
                    setError("");
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Could not save assumptions.",
                    );
                  }
                }}
                onRelease={showRelease}
              />
            )}
            {tab === "rules" && (
              <SandboxRules
                scenario={scenario}
                profile={profile}
                result={result}
              />
            )}
          </div>
        </aside>
      </div>
      <section className="panel scenario-notes">
        <label className="notes-label">
          Scenario notes
          <textarea
            aria-label="Scenario coaching notes"
            rows={3}
            maxLength={4000}
            placeholder="What are you testing? Which film observation would support or contradict this response?"
            value={scenario.notes}
            onChange={(e) => update({ ...scenario, notes: e.target.value })}
          />
        </label>
        {concept && (
          <div className="sandbox-concept-context">
            <span className="eyebrow">CONNECT BACK TO THE CONCEPT</span>
            <p>{concept.summary}</p>
            <Link href={`/lesson/${concept.id}`} className="arrow-link">
              Study {concept.name}
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
