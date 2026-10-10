"use client";
import { Plus, Trash2 } from "lucide-react";
import type { OpponentProfile, Ratings } from "@/domain/sandbox";
import { ratingDefinitions, newProfile } from "@/domain/sandbox";
export function RatingSliders({
  ratings,
  onChange,
  compact = false,
}: {
  ratings: Ratings;
  onChange: (ratings: Ratings) => void;
  compact?: boolean;
}) {
  return (
    <div className={`rating-sliders ${compact ? "compact" : ""}`}>
      {ratingDefinitions.map((r) => (
        <label key={r.key}>
          <span className="rating-label">
            <strong>{r.label}</strong>
            <output>{Math.round(ratings[r.key])}</output>
          </span>
          <input
            aria-label={r.label}
            type="range"
            min="0"
            max="100"
            step="1"
            value={ratings[r.key]}
            onChange={(e) =>
              onChange({ ...ratings, [r.key]: Number(e.target.value) })
            }
          />
          {!compact && <small>{r.observable}</small>}
        </label>
      ))}
    </div>
  );
}
export function ProfileEditor({
  value,
  onChange,
}: {
  value: OpponentProfile;
  onChange: (profile: OpponentProfile) => void;
}) {
  const update = (patch: Partial<OpponentProfile>) =>
    onChange({ ...value, ...patch });
  return (
    <div className="profile-editor">
      <div className="form-grid">
        <label>
          Profile name
          <input
            aria-label="Opponent profile name"
            maxLength={120}
            value={value.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        <label>
          Evidence confidence
          <select
            aria-label="Evidence confidence"
            value={value.confidence}
            onChange={(e) =>
              update({
                confidence: e.target.value as OpponentProfile["confidence"],
              })
            }
          >
            <option value="unrated">Unrated · assumptions only</option>
            <option value="low">Low · limited observations</option>
            <option value="medium">Medium · repeated observations</option>
            <option value="high">High · consistent evidence</option>
          </select>
        </label>
      </div>
      <div className="preset-row">
        <span>Start from</span>
        {(["low", "typical", "high"] as const).map((p) => (
          <button
            key={p}
            className="button secondary"
            onClick={() =>
              update({ ratings: newProfile(p).ratings, confidence: "unrated" })
            }
          >
            {p === "low" ? "Lower" : p === "high" ? "Higher" : "Baseline"}
          </button>
        ))}
      </div>
      <RatingSliders
        ratings={value.ratings}
        onChange={(ratings) => update({ ratings })}
      />
      <label className="uncertainty-control">
        <span>
          Assumption spread <strong>± {value.uncertainty} rating points</strong>
        </span>
        <input
          aria-label="Assumption spread"
          type="range"
          min="0"
          max="40"
          step="1"
          value={value.uncertainty}
          onChange={(e) => update({ uncertainty: Number(e.target.value) })}
        />
        <small>
          Compares three deterministic settings. This is not a confidence
          interval or a probability distribution.
        </small>
      </label>
      <label className="notes-label">
        Coaching notes
        <textarea
          aria-label="Profile coaching notes"
          maxLength={4000}
          rows={4}
          placeholder="Observed habits, conditions, and where the evidence is uncertain…"
          value={value.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </label>
      <div className="section-header compact">
        <h3>Film observations</h3>
        <button
          className="button secondary"
          disabled={value.observations.length >= 100}
          onClick={() =>
            update({
              observations: [
                ...value.observations,
                {
                  id: crypto.randomUUID(),
                  label: "New observation",
                  timestamp: "",
                  sourceUrl: "",
                  notes: "",
                },
              ],
            })
          }
        >
          <Plus size={14} />
          Add observation
        </button>
      </div>
      {!value.observations.length && (
        <p className="subtle">
          No film observations yet. A higher confidence label does not calibrate
          the model by itself.
        </p>
      )}
      {value.observations.map((o) => {
        const change = (patch: Partial<typeof o>) =>
          update({
            observations: value.observations.map((item) =>
              item.id === o.id ? { ...item, ...patch } : item,
            ),
          });
        return (
          <div className="observation-card" key={o.id}>
            <div className="form-grid">
              <label>
                Observation label
                <input
                  aria-label={`Observation label ${o.id}`}
                  value={o.label}
                  maxLength={120}
                  onChange={(e) => change({ label: e.target.value })}
                />
              </label>
              <label>
                Clip / timestamp
                <input
                  aria-label={`Observation timestamp ${o.id}`}
                  value={o.timestamp}
                  maxLength={80}
                  placeholder="Q2 · 04:15 · play 12"
                  onChange={(e) => change({ timestamp: e.target.value })}
                />
              </label>
            </div>
            <label>
              Reference URL (optional)
              <input
                aria-label={`Observation URL ${o.id}`}
                type="url"
                value={o.sourceUrl}
                maxLength={1000}
                placeholder="https://…"
                onChange={(e) => change({ sourceUrl: e.target.value })}
              />
            </label>
            <label>
              What did you observe?
              <textarea
                aria-label={`Observation notes ${o.id}`}
                value={o.notes}
                maxLength={2000}
                rows={3}
                onChange={(e) => change({ notes: e.target.value })}
              />
            </label>
            <button
              className="clear-route"
              onClick={() =>
                update({
                  observations: value.observations.filter(
                    (item) => item.id !== o.id,
                  ),
                })
              }
            >
              <Trash2 size={13} />
              Remove observation
            </button>
          </div>
        );
      })}
      <details className="model-details">
        <summary>What do the ratings mean?</summary>
        {ratingDefinitions.map((r) => (
          <div key={r.key}>
            <h4>{r.label}</h4>
            <p>
              <strong>Lower:</strong> {r.low}
              <br />
              <strong>Higher:</strong> {r.high}
            </p>
          </div>
        ))}
        <p>
          Each slider changes a named movement parameter. The numeric mappings
          are transparent but uncalibrated; they are not player scouting grades
          or measured ability.
        </p>
      </details>
    </div>
  );
}
