"use client";
import { useState } from "react";
import {
  ArrowRight,
  Target,
  Layers,
  Check,
  RotateCcw,
  Info,
} from "lucide-react";
import { coverages } from "@/domain/coverage";
import { concepts } from "@/domain/concepts";
import { formations } from "@/domain/formations";
import { recordTraining, useStore, markLesson } from "@/lib/store";
import { FootballField } from "./field";
import { PageHeading, Tag } from "./ui";
const coverageIds = ["cover1", "cover2", "cover3", "cover4", "cover6"];
const scenarios = [
  { conceptId: "smash", coverageId: "cover2" },
  { conceptId: "sail", coverageId: "cover3" },
  { conceptId: "four-verticals", coverageId: "cover3" },
  { conceptId: "dagger", coverageId: "cover3" },
  { conceptId: "mesh", coverageId: "cover1" },
];
export function Training() {
  const [mode, setMode] = useState<"coverage" | "conflict">("coverage");
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const { progress } = useStore();
  const scenario = scenarios[round % scenarios.length];
  const concept = concepts.find((c) => c.id === scenario.conceptId)!;
  const coverage = coverages.find(
    (c) =>
      c.id ===
      (mode === "coverage"
        ? coverageIds[(round * 2 + 2) % 5]
        : scenario.coverageId),
  )!;
  const interaction = concept.coverageInteractions.find(
    (i) => i.coverageId === coverage.id,
  )!;
  const correctId = mode === "coverage" ? coverage.id : interaction.keyDefender;
  const isCorrect = answer === correctId;
  const submit = (id: string) => {
    if (answer !== undefined) return;
    setAnswer(id);
    recordTraining(id === correctId, mode);
    if (id === correctId)
      markLesson(mode === "coverage" ? coverage.id : concept.id, {
        recognition: true,
        ...(mode === "conflict" ? { interaction: true } : {}),
      });
  };
  const next = () => {
    setRound((n) => n + 1);
    setAnswer(undefined);
    setSelected(undefined);
  };
  return (
    <>
      <PageHeading
        eyebrow="PRACTICE WITH PURPOSE"
        title="See it. Name it. Explain it."
        description="Build recognition from responsibilities, not just the number of safeties."
        action={
          <Tag green>
            {progress.training.correct} correct / {progress.training.attempts}{" "}
            attempts
          </Tag>
        }
      />
      <div className="training-modes">
        <button
          className={mode === "coverage" ? "active" : ""}
          onClick={() => {
            setMode("coverage");
            setAnswer(undefined);
            setSelected(undefined);
          }}
        >
          <Layers size={20} />
          <div>
            <strong>Identify the coverage</strong>
            <span>Read the post-snap distribution</span>
          </div>
        </button>
        <button
          className={mode === "conflict" ? "active" : ""}
          onClick={() => {
            setMode("conflict");
            setAnswer(undefined);
            setSelected(undefined);
          }}
        >
          <Target size={20} />
          <div>
            <strong>Find the conflict defender</strong>
            <span>Connect routes to responsibilities</span>
          </div>
        </button>
      </div>
      <div className="training-layout">
        <section className="field-panel">
          <div className="field-panel-header">
            <div>
              <span className="eyebrow">
                SCENARIO {String(round + 1).padStart(2, "0")}
              </span>
              <h2>
                {mode === "coverage"
                  ? "Read the defensive structure"
                  : `${concept.name} vs. ${coverage.name}`}
              </h2>
            </div>
            <Tag>
              {mode === "coverage"
                ? "Post-snap landmarks"
                : "Select a defender"}
            </Tag>
          </div>
          <FootballField
            players={formations[0].players}
            routes={mode === "conflict" ? concept.routes : []}
            coverage={coverage}
            time={mode === "coverage" ? 0.55 : 0}
            showZones={mode === "coverage" || answer !== undefined}
            showRoutes={mode === "conflict"}
            labels
            hideCoverageNames={mode === "coverage" && answer === undefined}
            selected={selected}
            highlight={
              answer !== undefined && mode === "conflict"
                ? correctId
                : undefined
            }
            stress={
              answer !== undefined && mode === "conflict"
                ? interaction.stress
                : undefined
            }
            onSelect={(id) => {
              if (
                mode === "conflict" &&
                coverage.defenders.some((d) => d.id === id) &&
                answer === undefined
              ) {
                setSelected(id);
              }
            }}
          />
        </section>
        <aside className="panel training-question">
          <span className="eyebrow">
            {mode === "coverage" ? "RECOGNITION" : "UNDERSTANDING"}
          </span>
          <h2>
            {mode === "coverage"
              ? "Which coverage is this?"
              : "Who is being stressed?"}
          </h2>
          <p>
            {mode === "coverage"
              ? "Use the deep distribution and underneath responsibilities. The diagram shows post-snap teaching landmarks."
              : "Select a defender on the field, then submit your choice. Think about who must account for two threats."}
          </p>
          {mode === "coverage" ? (
            <div className="training-answers">
              {coverageIds.map((id) => (
                <button
                  disabled={answer !== undefined}
                  key={id}
                  className={
                    answer !== undefined
                      ? id === correctId
                        ? "correct"
                        : answer === id
                          ? "incorrect"
                          : ""
                      : ""
                  }
                  onClick={() => submit(id)}
                >
                  {coverages.find((c) => c.id === id)!.name}
                  {answer !== undefined && id === correctId && (
                    <Check size={16} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="defender-grid">
                {coverage.defenders
                  .filter((d) => d.position !== "DL")
                  .map((d) => (
                    <button
                      disabled={answer !== undefined}
                      key={d.id}
                      className={selected === d.id ? "active" : ""}
                      onClick={() => setSelected(d.id)}
                    >
                      {d.id}
                      <small>{d.position}</small>
                    </button>
                  ))}
              </div>
              <button
                className="button primary full-width"
                disabled={!selected || answer !== undefined}
                onClick={() => selected && submit(selected)}
              >
                Submit {selected ?? "a defender"}
                <ArrowRight size={16} />
              </button>
            </>
          )}
          {answer !== undefined && (
            <div
              className={`training-feedback ${isCorrect ? "success" : "error"}`}
              role="status"
            >
              <span className="eyebrow">
                {isCorrect ? "CORRECT · WELL READ" : "INCORRECT · LOOK AGAIN"}
              </span>
              <h3>
                {mode === "coverage"
                  ? coverage.name
                  : `Key defender: ${interaction.keyDefender}`}
              </h3>
              <p>
                {mode === "coverage"
                  ? coverage.summary
                  : interaction.explanation}
              </p>
              <button className="button primary full-width" onClick={next}>
                Next scenario
                <ArrowRight size={16} />
              </button>
              <button
                className="retry-button"
                onClick={() => {
                  setAnswer(undefined);
                  setSelected(undefined);
                }}
              >
                <RotateCcw size={13} />
                Retry this scenario
              </button>
            </div>
          )}
          <div className="teaching-caution">
            <Info size={15} />
            <p>
              Recognition exercises use clear schematic responsibilities. Real
              coverage requires confirming rotation, technique, and match rules.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
