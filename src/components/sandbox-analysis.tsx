"use client";
import Link from "next/link";
import { ArrowRight, Save } from "lucide-react";
import type {
  SandboxScenario,
  OpponentProfile,
  ReplayResult,
} from "@/domain/sandbox";
import {
  RECEIVER_IDS,
  scenarioCoverage,
  SANDBOX_MODEL_VERSION,
} from "@/domain/sandbox";
import { physicalParameters, describeWindow } from "@/lib/sandbox-engine";
import { RatingSliders } from "./profile-editor";
export function SandboxTiming({
  scenario,
  onChange,
  onRelease,
}: {
  scenario: SandboxScenario;
  onChange: (value: SandboxScenario) => void;
  onRelease: () => void;
}) {
  return (
    <>
      <span className="eyebrow">THE CLOCK CHANGES THE WINDOW</span>
      <h2>Control the timing.</h2>
      <div className="form-grid">
        <label>
          QB release (seconds)
          <input
            aria-label="Quarterback release time"
            type="number"
            min=".2"
            max="6"
            step=".1"
            value={scenario.releaseTime}
            onChange={(e) =>
              onChange({
                ...scenario,
                releaseTime: Math.max(0.2, Math.min(6, Number(e.target.value))),
              })
            }
          />
        </label>
        <label>
          Pressure deadline (seconds)
          <input
            aria-label="Hypothetical pressure deadline"
            type="number"
            min=".2"
            max="6"
            step=".1"
            value={scenario.pressureTime}
            onChange={(e) =>
              onChange({
                ...scenario,
                pressureTime: Math.max(
                  0.2,
                  Math.min(6, Number(e.target.value)),
                ),
              })
            }
          />
        </label>
      </div>
      <label className="control-label">
        Illustrated target
        <select
          aria-label="Illustrated throw target"
          value={scenario.targetId}
          onChange={(e) => onChange({ ...scenario, targetId: e.target.value })}
        >
          {RECEIVER_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <button className="button primary full-width" onClick={onRelease}>
        Show release snapshot
        <ArrowRight size={14} />
      </button>
      <h3 className="small-heading">Receiver timing</h3>
      <div className="receiver-timing-table">
        <div>
          <span>Player</span>
          <span>Speed rating</span>
          <span>Delay (s)</span>
        </div>
        {RECEIVER_IDS.map((id) => (
          <div key={id}>
            <strong>{id}</strong>
            <input
              aria-label={`${id} receiver speed`}
              type="number"
              min="0"
              max="100"
              step="1"
              value={scenario.receivers[id].speed}
              onChange={(e) =>
                onChange({
                  ...scenario,
                  receivers: {
                    ...scenario.receivers,
                    [id]: {
                      ...scenario.receivers[id],
                      speed: Math.max(0, Math.min(100, Number(e.target.value))),
                    },
                  },
                })
              }
            />
            <input
              aria-label={`${id} release delay`}
              type="number"
              min="0"
              max="2"
              step=".1"
              value={scenario.receivers[id].releaseDelay}
              onChange={(e) =>
                onChange({
                  ...scenario,
                  receivers: {
                    ...scenario.receivers,
                    [id]: {
                      ...scenario.receivers[id],
                      releaseDelay: Math.max(
                        0,
                        Math.min(2, Number(e.target.value)),
                      ),
                    },
                  },
                })
              }
            />
          </div>
        ))}
      </div>
      <div className="note-box">
        <p>
          Speed changes distance traveled over time; the release delay holds the
          receiver at the start. All receivers use a common illustrative
          acceleration. The pressure deadline is hypothetical: seven-on-seven
          has no live rush here.
        </p>
      </div>
    </>
  );
}
export function SandboxComparison({
  scenario,
  profile,
  results,
  profiles,
  onChange,
  onSaveProfile,
  onRelease,
}: {
  scenario: SandboxScenario;
  profile: OpponentProfile;
  results: ReplayResult[];
  profiles: OpponentProfile[];
  onChange: (value: SandboxScenario) => void;
  onSaveProfile: () => void;
  onRelease: () => void;
}) {
  const target = results[1].windows.find(
    (w) => w.receiverId === scenario.targetId,
  )!;
  const metrics = results.map((r) =>
    r.windows.find((w) => w.receiverId === scenario.targetId)!,
  );
  return (
    <>
      <span className="eyebrow">COMPARE THE ASSUMPTIONS</span>
      <h2>What changes the picture?</h2>
      <label className="control-label">
        Opponent profile
        <select
          aria-label="Sandbox opponent profile"
          value={scenario.profileId}
          onChange={(e) =>
            onChange({
              ...scenario,
              profileId: e.target.value,
              profileSnapshot: undefined,
            })
          }
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="profile-source">
        <strong>
          {profile.confidence === "unrated"
            ? "Unrated assumptions"
            : `${profile.confidence} evidence confidence`}
        </strong>
        <span>
          {scenario.profileSnapshot
            ? "Using scenario assumptions"
            : "Using the saved profile"}
        </span>
      </div>
      {scenario.profileSnapshot && (
        <button
          className="text-button"
          onClick={() => onChange({ ...scenario, profileSnapshot: undefined })}
        >
          Use current saved profile instead
        </button>
      )}
      <RatingSliders
        compact
        ratings={profile.ratings}
        onChange={(ratings) =>
          onChange({ ...scenario, profileSnapshot: { ...profile, ratings } })
        }
      />
      <label className="uncertainty-control">
        <span>
          Compare spread <strong>± {profile.uncertainty} points</strong>
        </span>
        <input
          aria-label="Sandbox assumption spread"
          type="range"
          min="0"
          max="40"
          step="1"
          value={profile.uncertainty}
          onChange={(e) =>
            onChange({
              ...scenario,
              profileSnapshot: {
                ...profile,
                uncertainty: Number(e.target.value),
              },
            })
          }
        />
      </label>
      <div className="comparison-table">
        <div>
          <span>Setting</span>
          <span>Nearest gap</span>
          <span>Lane gap</span>
        </div>
        {["Lower ratings", "Baseline", "Higher ratings"].map((label, i) => (
          <div key={label}>
            <strong>{label}</strong>
            <span>{metrics[i].separation.toFixed(1)} yd</span>
            <span>{metrics[i].laneClearance.toFixed(1)} yd</span>
          </div>
        ))}
      </div>
      <p className="comparison-summary">
        At {scenario.releaseTime.toFixed(1)}s, {scenario.targetId}’s
        nearest-defender spacing ranges from{" "}
        <strong>
          {Math.min(...metrics.map((m) => m.separation)).toFixed(1)} to{" "}
          {Math.max(...metrics.map((m) => m.separation)).toFixed(1)}{" "}
          illustrative yards
        </strong>{" "}
        across these three settings.
      </p>
      <p className="subtle">
        All six defender rating values shift together and stop at 0 or 100.
        Higher ratings need not improve every geometric result. These are three
        scenarios, not a confidence interval or a probability model.
      </p>
      <div className="note-box">
        <p>{describeWindow(target, results[1])}</p>
      </div>
      <div className="compare-actions">
        <button className="button secondary" onClick={onSaveProfile}>
          <Save size={14} />
          Save assumptions to profile
        </button>
        <button className="button primary" onClick={onRelease}>
          View release
          <ArrowRight size={14} />
        </button>
      </div>
      <Link href="/profiles" className="arrow-link">
        Add film observations and confidence
        <ArrowRight size={14} />
      </Link>
    </>
  );
}
export function SandboxRules({
  scenario,
  profile,
  result,
}: {
  scenario: SandboxScenario;
  profile: OpponentProfile;
  result: ReplayResult;
}) {
  const coverage = scenarioCoverage(scenario);
  const parameters = physicalParameters(profile.ratings);
  const manTargets = coverage.assignments
    .filter((a) => a.type === "man")
    .map((a) => a.targetId);
  return (
    <>
      <span className="eyebrow">TRANSPARENT BY DESIGN</span>
      <h2>Inspect the assumptions.</h2>
      <p className="subtle">
        The coverage selector loads a preset. Edited assignments take precedence
        over that name. This is a seven-coverage-defender teaching sandbox, not
        a universal seven-on-seven competition ruleset.
      </p>
      <div className="assignment-ledger">
        {coverage.assignments.map((a) => (
          <div key={a.defenderId}>
            <strong>{a.defenderId}</strong>
            <span>
              {a.type === "man"
                ? `Man on ${a.targetId}`
                : a.type === "spy"
                  ? "QB reference"
                  : `${coverage.zones.find((z) => z.defenderId === a.defenderId)?.name ?? "Zone"} · landmark (${a.destination.x.toFixed(0)}, ${a.destination.y.toFixed(0)})`}
            </span>
          </div>
        ))}
      </div>
      {new Set(manTargets).size < manTargets.length && (
        <p className="notice-inline">
          Multiple defenders carry the same receiver. This models duplicate
          pursuit, not complementary bracket technique.
        </p>
      )}
      <details className="model-details" open>
        <summary>Movement model · {SANDBOX_MODEL_VERSION}</summary>
        <p>
          Fixed 0.05-second steps. Receivers accelerate along straight route
          segments. Defenders have speed, acceleration, reaction delay, and a
          maximum turning rate. Man defenders pursue a delayed receiver
          position; zone defenders blend their landmark with the nearest route
          in or near their zone. No reactive AI is used.
        </p>
        <dl className="parameter-list">
          <div>
            <dt>Global speed cap</dt>
            <dd>{parameters.speed.toFixed(2)} yd/s</dd>
          </div>
          <div>
            <dt>Acceleration</dt>
            <dd>{parameters.acceleration.toFixed(2)} yd/s²</dd>
          </div>
          <div>
            <dt>Reaction delay</dt>
            <dd>{parameters.reactionDelay.toFixed(2)} s</dd>
          </div>
          <div>
            <dt>Turning limit</dt>
            <dd>{parameters.turnRate.toFixed(2)} rad/s</dd>
          </div>
          <div>
            <dt>Man pursuit offset</dt>
            <dd>{parameters.manOffset.toFixed(2)} yd</dd>
          </div>
          <div>
            <dt>Zone landmark weight</dt>
            <dd>{(parameters.landmarkWeight * 100).toFixed(0)}%</dd>
          </div>
        </dl>
        <p>
          Individual defender overrides replace these global values before the
          comparison spread is applied. Parameter mappings are uncalibrated
          design choices. The coordinate mapping uses a 53⅓-yard width and a
          50-yard viewport for illustrative distances.
        </p>
      </details>
      <h3 className="small-heading">What the window numbers mean</h3>
      <p className="subtle">
        Nearest gap is the closest defender’s distance to the receiver. Lane gap
        is the closest defender’s distance to the straight QB-to-receiver
        segment at the release frame. Neither accounts for ball flight,
        interception reach, catch technique, collision, pass-rush blocking, or
        legal eligibility.
      </p>
      {result.warnings.map((w) => (
        <p className="notice-inline" key={w}>
          {w}
        </p>
      ))}
      <p className="subtle">
        The built-in lessons are authored foundations awaiting coach review. New
        opponent-specific reads require validated examples; this sandbox does
        not invent completion probabilities.
      </p>
    </>
  );
}
