"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lightbulb,
  Target,
  Eye,
  Shield,
  Info,
  ChevronRight,
} from "lucide-react";
import { concepts } from "@/domain/concepts";
import { coverages } from "@/domain/coverage";
import { formations } from "@/domain/formations";
import type { Point } from "@/domain/types";
import { markLesson } from "@/lib/store";
import { useAnimation } from "@/lib/use-animation";
import { FootballField } from "./field";
import { FieldControls, PageHeading, Tag } from "./ui";
export function PassingLab({
  initialConcept = "smash",
  embedded = false,
  lessonId,
}: {
  initialConcept?: string;
  embedded?: boolean;
  lessonId?: string;
}) {
  const [conceptId, setConceptId] = useState(initialConcept);
  const [coverageId, setCoverageId] = useState(
    initialConcept === "mesh"
      ? "cover1"
      : initialConcept === "smash"
        ? "cover2"
        : "cover3",
  );
  const [view, setView] = useState<"why" | "qb" | "defense">("why");
  const [selected, setSelected] = useState<string>();
  const [players, setPlayers] = useState(() =>
    structuredClone(formations[0].players),
  );
  const [flipped, setFlipped] = useState(false);
  const [labels, setLabels] = useState(true);
  const [routes, setRoutes] = useState(true);
  const [zones, setZones] = useState(true);
  const [assignments, setAssignments] = useState(false);
  const animation = useAnimation();
  const concept = concepts.find((c) => c.id === conceptId)!;
  const coverage = coverages.find((c) => c.id === coverageId)!;
  const interaction = concept.coverageInteractions.find(
    (i) => i.coverageId === coverageId,
  )!;
  const player = players.find((p) => p.id === selected);
  const defender = coverage.defenders.find((p) => p.id === selected);
  const assignment = coverage.assignments.find(
    (a) => a.defenderId === selected,
  );
  const move = (id: string, p: Point) =>
    setPlayers((current) =>
      current.map((player) =>
        player.id === id ? { ...player, ...p } : player,
      ),
    );
  const updateCoverage = (id: string) => {
    setCoverageId(id);
    setSelected(undefined);
    animation.restart();
    if (lessonId) markLesson(lessonId, { interaction: true });
  };
  return (
    <div className={embedded ? "embedded-lab" : "passing-lab"}>
      {!embedded && (
        <PageHeading
          eyebrow="THE INTERACTIVE LAB"
          title="Find the conflict."
          description="Explore how a concept changes against different defensive responsibilities."
          action={
            <Link href={`/lesson/${concept.id}`} className="button secondary">
              Study this concept
              <ArrowRight size={16} />
            </Link>
          }
        />
      )}
      <div className="lab-selectors">
        <label>
          OFFENSIVE CONCEPT
          <select
            disabled={embedded}
            value={conceptId}
            onChange={(e) => {
              setConceptId(e.target.value);
              setSelected(undefined);
              setPlayers(structuredClone(formations[0].players));
              animation.restart();
            }}
          >
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <span className="versus">vs</span>
        <label>
          DEFENSIVE COVERAGE
          <select
            value={coverageId}
            onChange={(e) => updateCoverage(e.target.value)}
          >
            {coverages.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="lab-context">
          <Tag green>11 personnel</Tag>
          <span>2 × 2 spread</span>
        </div>
      </div>
      <div className="lab-layout">
        <section className="field-panel">
          <div className="field-panel-header">
            <div>
              <span className="eyebrow">{concept.family.toUpperCase()}</span>
              <h2>
                {concept.name} <small>vs.</small> {coverage.name}
              </h2>
            </div>
            <span className="field-drag-hint">
              Drag before snap · click to inspect
            </span>
          </div>
          <FootballField
            players={players}
            routes={concept.routes}
            coverage={coverage}
            time={animation.time}
            flipped={flipped}
            labels={labels}
            showRoutes={routes}
            showZones={zones}
            showAssignments={assignments}
            selected={selected}
            highlight={interaction.keyDefender}
            stress={interaction.stress}
            onSelect={(id) => {
              setSelected(id);
              if (lessonId) markLesson(lessonId, { understanding: true });
            }}
            onMove={move}
          />
          <FieldControls
            animation={animation}
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
            labels={labels}
            onLabels={() => setLabels(!labels)}
            routes={routes}
            onRoutes={() => setRoutes(!routes)}
            zones={zones}
            onZones={() => setZones(!zones)}
            assignments={assignments}
            onAssignments={() => setAssignments(!assignments)}
          />
          <p className="field-keyboard-note">
            Keyboard: focus a player and use arrow keys to adjust pre-snap
            alignment. Changes illustrate spacing, not a legal-formation
            validator.
          </p>
        </section>
        <aside className="teaching-panel">
          <div
            className="teaching-tabs"
            role="tablist"
            aria-label="Teaching perspective"
          >
            {[
              { id: "why", label: "Why it works", icon: Lightbulb },
              { id: "qb", label: "QB view", icon: Eye },
              { id: "defense", label: "Defense", icon: Shield },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={view === t.id}
                  className={view === t.id ? "active" : ""}
                  onClick={() => {
                    setView(t.id as typeof view);
                    if (t.id === "qb" && lessonId)
                      markLesson(lessonId, { qbReads: true });
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="teaching-body" role="tabpanel">
            {view === "why" && (
              <>
                <span className="eyebrow">
                  {interaction.conflict === false
                    ? "READ THE UNDERNEATH SPACING"
                    : "THE DEFENDER IN CONFLICT"}
                </span>
                <h2>{interaction.title}</h2>
                <p>{interaction.explanation}</p>
                <button
                  className="key-defender"
                  onClick={() => setSelected(interaction.keyDefender)}
                >
                  <Target size={17} />
                  <span>
                    Key defender
                    <strong>
                      {interaction.keyDefender} ·{" "}
                      {
                        coverage.defenders.find(
                          (d) => d.id === interaction.keyDefender,
                        )?.position
                      }
                    </strong>
                  </span>
                  <ChevronRight size={16} />
                </button>
                <div className="if-then">
                  <span className="decision-number">A</span>
                  <p>{interaction.high}</p>
                </div>
                <div className="if-then">
                  <span className="decision-number">B</span>
                  <p>{interaction.low}</p>
                </div>
                <div className="teaching-caution">
                  <Info size={15} />
                  <p>{interaction.limitation}</p>
                </div>
              </>
            )}
            {view === "qb" && (
              <>
                <span className="eyebrow">FROM THE POCKET</span>
                <h2>Confirm, then decide.</h2>
                <div className="detail-line">
                  <span>Pre-snap shell</span>
                  <strong>{coverage.shell}</strong>
                </div>
                <div className="detail-line">
                  <span>Rotation</span>
                  <strong>
                    {coverage.rotation ??
                      "Possible disguise; confirm post-snap"}
                  </strong>
                </div>
                <div className="detail-line">
                  <span>Key defender</span>
                  <strong>{interaction.keyDefender}</strong>
                </div>
                <h3 className="small-heading">One common progression</h3>
                <ol className="progression-list">
                  {concept.qbProgression.map((step, i) => (
                    <li key={step}>
                      <span>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="note-box">
                  <Eye size={17} />
                  <p>{interaction.qbNote}</p>
                </div>
                <p className="subtle">
                  Exact reads and footwork vary by offense. Pressure may require
                  a different hot or sight adjustment.
                </p>
              </>
            )}
            {view === "defense" && (
              <>
                <span className="eyebrow">FROM THE SECONDARY</span>
                <h2>Own your responsibility.</h2>
                <p>{coverage.summary}</p>
                <div className="defender-grid">
                  {coverage.defenders
                    .filter((d) => d.position !== "DL")
                    .map((d) => (
                      <button
                        key={d.id}
                        className={selected === d.id ? "active" : ""}
                        onClick={() => setSelected(d.id)}
                      >
                        {d.id}
                        <small>{d.position}</small>
                      </button>
                    ))}
                </div>
                <h3 className="small-heading">Offensive stress</h3>
                <p>{interaction.explanation}</p>
                <div className="teaching-caution">
                  <Info size={15} />
                  <p>
                    Communicate switches and route distribution. This model uses
                    deterministic assignments; exact match and leverage rules
                    vary.
                  </p>
                </div>
              </>
            )}
            {selected && (
              <div className="assignment-card">
                <span className="eyebrow">SELECTED: {selected}</span>
                <h3>
                  {defender
                    ? `${defender.position} assignment`
                    : (player?.position ?? "Assignment")}
                </h3>
                <p>
                  {assignment?.responsibility ??
                    concept.assignments[selected] ??
                    "Maintain the protection structure. Linemen are schematic in this passing view."}
                </p>
                {assignment && <p className="subtle">{assignment.leverage}</p>}
                {defender && (
                  <small>
                    {assignment?.type === "man"
                      ? `Man responsibility: ${assignment.targetId}`
                      : assignment?.type === "zone"
                        ? `Zone: ${coverage.zones.find((z) => z.defenderId === selected)?.name}`
                        : "Pass rush"}
                  </small>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
      {!embedded && (
        <div className="lab-bottom-note">
          <Info size={16} />
          <span>
            Educational assignments, not reactive AI. Route spacing and safety
            help are more important than a coverage label.
          </span>
          <Link href={`/lesson/${concept.id}`}>
            Read the full lesson
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
