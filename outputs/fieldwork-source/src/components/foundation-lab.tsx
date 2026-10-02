"use client";
import { useState } from "react";
import type { Lesson, Route } from "@/domain/types";
import { formations, personnelFormation, personnel } from "@/domain/formations";
import { coverages } from "@/domain/coverage";
import {
  runs,
  fronts,
  blocksAgainstFront,
  halfSlide,
  protections,
  motions,
} from "@/domain/runs";
import { useAnimation } from "@/lib/use-animation";
import { FootballField } from "./field";
import { FieldControls, Tag } from "./ui";
import { markLesson } from "@/lib/store";
export function FoundationLab({ lesson }: { lesson: Lesson }) {
  const [coverageId, setCoverageId] = useState(
    lesson.kind === "coverage" ? (lesson.entityId ?? "cover3") : "cover1",
  );
  const [frontId, setFrontId] = useState("over");
  const [pressure, setPressure] = useState(false);
  const [mike, setMike] = useState("M");
  const [motionMan, setMotionMan] = useState(true);
  const [selected, setSelected] = useState<string>();
  const [flipped, setFlipped] = useState(false);
  const [labels, setLabels] = useState(true);
  const [routes, setRoutes] = useState(true);
  const [zones, setZones] = useState(true);
  const animation = useAnimation();
  const formation =
    lesson.kind === "formation"
      ? (formations.find((f) => f.id === lesson.entityId) ?? formations[0])
      : lesson.kind === "personnel"
        ? personnelFormation(lesson.entityId ?? "11")
        : lesson.kind === "run" || lesson.kind === "protection"
          ? formations.find((f) => f.id === "shotgun")!
          : formations[0];
  const coverage =
    coverages.find(
      (c) =>
        c.id ===
        (lesson.kind === "motion"
          ? motionMan
            ? "cover1"
            : "cover3"
          : coverageId),
    ) ?? coverages[1];
  const front = fronts.find((f) => f.id === frontId)!;
  const run = runs.find((r) => r.id === lesson.entityId) ?? runs[0];
  const motion = motions.find((m) => m.id === lesson.entityId) ?? motions[1];
  const protection =
    protections.find((p) => p.id === lesson.entityId) ?? halfSlide;
  const blocks =
    lesson.kind === "run"
      ? blocksAgainstFront(run, front)
      : lesson.kind === "protection"
        ? pressure
          ? protection.pressureBlocks
          : protection.blocks
        : [];
  const selectedAssignment = blocks.find((b) => b.playerId === selected);
  const selectedCoverage = ["coverage", "motion"].includes(lesson.kind)
    ? coverage.assignments.find((a) => a.defenderId === selected)
    : undefined;
  const staticDiagram = ["formation", "personnel"].includes(lesson.kind);
  const route: Route = {
    playerId: motion.playerId,
    routeType: "motion",
    waypoints: motion.waypoints,
  };
  const pack = personnel.find((p) => p.id === lesson.entityId) ?? personnel[1];
  return (
    <div className="foundation-lab">
      <div className="foundation-toolbar">
        {lesson.kind === "run" && (
          <label>
            DEFENSIVE FRONT
            <select
              value={frontId}
              onChange={(e) => {
                setFrontId(e.target.value);
                animation.restart();
                markLesson(lesson.id, { interaction: true });
              }}
            >
              {fronts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {lesson.kind === "coverage" && (
          <label>
            COVERAGE
            <select
              value={coverageId}
              onChange={(e) => {
                setCoverageId(e.target.value);
                animation.restart();
                markLesson(lesson.id, { interaction: true });
              }}
            >
              {coverages.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {lesson.kind === "protection" && protection.id === "half-slide" && (
          <>
            <label>
              PRESSURE LOOK
              <select
                value={pressure ? "pressure" : "base"}
                onChange={(e) => {
                  setPressure(e.target.value === "pressure");
                  animation.restart();
                  markLesson(lesson.id, { interaction: true });
                }}
              >
                <option value="base">Four-down rush</option>
                <option value="pressure">Mike + apex pressure</option>
              </select>
            </label>
            <label>
              IDENTIFY THE MIKE
              <select value={mike} onChange={(e) => setMike(e.target.value)}>
                <option value="M">M · correct for this declaration</option>
                <option value="W">W · alternate identification</option>
              </select>
            </label>
          </>
        )}
        {lesson.kind === "motion" && (
          <label>
            DEFENSIVE RESPONSE
            <select
              value={motionMan ? "travel" : "bump"}
              onChange={(e) => {
                setMotionMan(e.target.value === "travel");
                animation.restart();
                markLesson(lesson.id, { interaction: true });
              }}
            >
              <option value="travel">Defender travels · man indicator</option>
              <option value="bump">Defense bumps · zone indicator</option>
            </select>
          </label>
        )}
        {lesson.kind === "personnel" && (
          <>
            <Tag green>{pack.rb} RB</Tag>
            <Tag>{pack.te} TE</Tag>
            <Tag>{pack.wr} WR</Tag>
          </>
        )}
        {lesson.kind === "formation" && (
          <Tag green>
            {formation.personnel} personnel · {formation.name}
          </Tag>
        )}
      </div>
      <div className="foundation-layout">
        <div className="field-panel">
          <FootballField
            players={formation.players}
            routes={lesson.kind === "run" ? [run.backPath] : []}
            coverage={
              lesson.kind === "coverage" || lesson.kind === "motion"
                ? coverage
                : undefined
            }
            defenders={
              lesson.kind === "run" || lesson.kind === "protection"
                ? front.defenders
                : undefined
            }
            blocks={blocks}
            rushers={
              lesson.kind === "protection"
                ? pressure
                  ? protection.pressureRushers
                  : protection.rushers
                : []
            }
            motion={lesson.kind === "motion" ? route : undefined}
            motionMan={motionMan}
            time={animation.time}
            flipped={flipped}
            labels={labels}
            showRoutes={routes}
            showZones={zones}
            selected={selected}
            highlight={
              lesson.kind === "protection" ? (pressure ? "A" : mike) : undefined
            }
            onSelect={(id) => {
              setSelected(id);
              markLesson(lesson.id, { understanding: true });
            }}
          />
          {staticDiagram ? (
            <div className="static-field-controls">
              <button
                className="button secondary"
                onClick={() => setFlipped(!flipped)}
              >
                Flip formation
              </button>
              <button
                className="button secondary"
                aria-pressed={labels}
                onClick={() => setLabels(!labels)}
              >
                Labels {labels ? "on" : "off"}
              </button>
            </div>
          ) : (
            <FieldControls
              animation={animation}
              flipped={flipped}
              onFlip={() => setFlipped(!flipped)}
              labels={labels}
              onLabels={() => setLabels(!labels)}
              routes={routes}
              onRoutes={
                lesson.kind !== "coverage"
                  ? () => setRoutes(!routes)
                  : undefined
              }
              zones={zones}
              onZones={
                ["coverage", "motion"].includes(lesson.kind)
                  ? () => setZones(!zones)
                  : undefined
              }
            />
          )}
        </div>
        <aside className="panel foundation-explanation">
          <span className="eyebrow">READ THE DIAGRAM</span>
          <h2>
            {lesson.kind === "run"
              ? run.name
              : lesson.kind === "protection"
                ? protection.name
                : lesson.kind === "motion"
                  ? "Movement is evidence."
                  : lesson.kind === "coverage"
                    ? coverage.name
                    : formation.name}
          </h2>
          <p>
            {lesson.kind === "run"
              ? run.key
              : lesson.kind === "protection"
                ? protection.summary
                : lesson.kind === "motion"
                  ? motion.teaching
                  : lesson.kind === "coverage"
                    ? coverage.summary
                    : formation.description}
          </p>
          {lesson.kind === "protection" && protection.id === "half-slide" && (
            <div className="note-box">
              <p>
                {mike === "W"
                  ? "This example declares M to organize the man-side scan. Choosing W does not change the taught assignments; real redeclarations require coordinated rules."
                  : pressure
                    ? "M is accounted for by the back. A also rushes outside: one back cannot take both. A is the free rusher; the QB needs a coordinated hot answer or an adjusted protection."
                    : "M organizes the inside-out scan. He is a potential rusher even when he drops."}
              </p>
            </div>
          )}
          {lesson.kind === "run" && (
            <>
              <h3 className="small-heading">Current front</h3>
              <p>{front.description}</p>
              <p className="subtle">
                Blocking landmarks adapt to the selected front. Full combination
                and exchange rules remain system-dependent.
              </p>
            </>
          )}
          {lesson.kind === "personnel" && (
            <>
              <h3 className="small-heading">Who, not where</h3>
              <p>{pack.description}</p>
              <div className="personnel-roster">
                {formation.players
                  .filter((p) => p.position !== "OL" && p.position !== "QB")
                  .map((p) => (
                    <span key={p.id}>
                      {p.label}
                      <strong>{p.position}</strong>
                    </span>
                  ))}
              </div>
              <p className="subtle">
                The labels identify players; the position chips show package
                composition.
              </p>
            </>
          )}
          {selected ? (
            <div className="assignment-card">
              <span className="eyebrow">SELECTED: {selected}</span>
              <p>
                {selectedAssignment?.description ??
                  selectedCoverage?.responsibility ??
                  (selected === "RB" && lesson.kind === "run"
                    ? run.key
                    : `${formation.players.find((p) => p.id === selected)?.position ?? "Defender"} alignment. Formation describes location, not the full assignment.`)}
              </p>
            </div>
          ) : (
            <p className="subtle">Click a player to inspect responsibility.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
