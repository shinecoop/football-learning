"use client";
import type {
  SandboxScenario,
  DefenderSettings,
  OpponentProfile,
} from "@/domain/sandbox";
import { RECEIVER_IDS, scenarioCoverage, fallbackZone } from "@/domain/sandbox";
import { RatingSliders } from "./profile-editor";
export function SandboxDefenseEditor({
  scenario,
  selected,
  onSelect,
  onChange,
  profile,
  disabled,
}: {
  scenario: SandboxScenario;
  selected: string;
  onSelect: (id: string) => void;
  onChange: (scenario: SandboxScenario) => void;
  profile: OpponentProfile;
  disabled: boolean;
}) {
  const coverage = scenarioCoverage(scenario);
  const defender =
    coverage.defenders.find((d) => d.id === selected) ??
    coverage.defenders.find((d) => d.id === "A")!;
  const settings = scenario.defenders[defender.id];
  const change = (patch: Partial<DefenderSettings>) =>
    onChange({
      ...scenario,
      defenders: {
        ...scenario.defenders,
        [defender.id]: { ...settings, ...patch },
      },
    });
  const zone =
    coverage.zones.find((z) => z.defenderId === defender.id) ??
    fallbackZone(defender.id, settings.assignment.destination);
  return (
    <>
      <span className="eyebrow">EXPLICIT RESPONSIBILITY</span>
      <h2>Give the defender a job.</h2>
      <label className="control-label">
        Defender
        <select
          aria-label="Sandbox defender"
          value={defender.id}
          onChange={(e) => onSelect(e.target.value)}
        >
          {coverage.defenders.map((d) => (
            <option key={d.id} value={d.id}>
              {d.id} · {d.position}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid compact-form">
        <label>
          X alignment
          <input
            aria-label="Defender X alignment"
            type="number"
            min="3"
            max="97"
            step=".1"
            disabled={disabled}
            value={settings.x}
            onChange={(e) =>
              change({ x: Math.max(3, Math.min(97, Number(e.target.value))) })
            }
          />
        </label>
        <label>
          Y alignment
          <input
            aria-label="Defender Y alignment"
            type="number"
            min="3"
            max="69"
            step=".1"
            disabled={disabled}
            value={settings.y}
            onChange={(e) =>
              change({ y: Math.max(3, Math.min(69, Number(e.target.value))) })
            }
          />
        </label>
        <label>
          Cushion (illustrative yards)
          <input
            aria-label="Defender cushion"
            type="number"
            min="0"
            max="10"
            step=".5"
            disabled={disabled}
            value={settings.cushion}
            onChange={(e) =>
              change({
                cushion: Math.max(0, Math.min(10, Number(e.target.value))),
              })
            }
          />
        </label>
        <label>
          Assignment
          <select
            aria-label="Defender assignment"
            disabled={disabled}
            value={settings.assignment.type}
            onChange={(e) => {
              const type = e.target.value as "man" | "zone" | "spy";
              change({
                assignment: {
                  ...settings.assignment,
                  type,
                  targetId:
                    type === "man"
                      ? (settings.assignment.targetId ?? "Y")
                      : undefined,
                  responsibility:
                    type === "man"
                      ? "Carry the chosen receiver with delayed pursuit."
                      : type === "zone"
                        ? "Relate to threats entering the displayed zone, with landmark weight from zone discipline."
                        : "Monitor QB alignment. QB scrambling is not simulated.",
                },
                ...(type === "zone" ? { zone } : {}),
              });
            }}
          >
            <option value="man">Man · assigned receiver</option>
            <option value="zone">Zone · landmark and threats</option>
            <option value="spy">Spy · QB reference</option>
          </select>
        </label>
      </div>
      <p className="subtle">
        Effective alignment: ({defender.x.toFixed(1)}, {defender.y.toFixed(1)}).
        Cushion moves the defender deeper and stops at the viewport boundary.
      </p>
      {settings.assignment.type === "man" && (
        <label className="control-label">
          Man responsibility
          <select
            aria-label="Man responsibility"
            disabled={disabled}
            value={settings.assignment.targetId ?? "Y"}
            onChange={(e) =>
              change({
                assignment: {
                  ...settings.assignment,
                  targetId: e.target.value,
                },
              })
            }
          >
            {RECEIVER_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      )}
      {settings.assignment.type === "zone" && (
        <>
          <h3 className="small-heading">Zone geometry</h3>
          <div className="form-grid compact-form">
            {(["x", "y", "width", "height"] as const).map((key) => (
              <label key={key}>
                {
                  {
                    x: "Left edge",
                    y: "Top edge",
                    width: "Width",
                    height: "Depth",
                  }[key]
                }
                <input
                  aria-label={`Zone ${key}`}
                  type="number"
                  step="1"
                  disabled={disabled}
                  min={key === "x" || key === "y" ? 0 : 1}
                  max={
                    key === "x"
                      ? 100 - zone.width
                      : key === "y"
                        ? 100 - zone.height
                        : key === "width"
                          ? 100 - zone.x
                          : 100 - zone.y
                  }
                  value={zone[key]}
                  onChange={(e) => {
                    const limit =
                      key === "x"
                        ? 100 - zone.width
                        : key === "y"
                          ? 100 - zone.height
                          : key === "width"
                            ? 100 - zone.x
                            : 100 - zone.y;
                    const value = Math.max(
                      key === "x" || key === "y" ? 0 : 1,
                      Math.min(limit, Number(e.target.value)),
                    );
                    const next = { ...zone, [key]: value };
                    change({
                      zone: next,
                      assignment: {
                        ...settings.assignment,
                        destination: {
                          x: next.x + next.width / 2,
                          y: next.y + next.height / 2,
                        },
                      },
                    });
                  }}
                />
              </label>
            ))}
          </div>
          <p className="subtle">
            The landmark follows the center of the box. Defenders relate to the
            nearest eligible threat in or near their zone; this is not
            pattern-match coverage.
          </p>
        </>
      )}
      <label className="checkbox-label">
        <input
          aria-label="Use individual defender ratings"
          type="checkbox"
          disabled={disabled}
          checked={Boolean(settings.ratings)}
          onChange={(e) =>
            change({
              ratings: e.target.checked ? { ...profile.ratings } : undefined,
            })
          }
        />
        Use individual defender ratings
      </label>
      {settings.ratings && (
        <RatingSliders
          compact
          ratings={settings.ratings}
          onChange={(ratings) => change({ ratings })}
        />
      )}
      <div className="note-box">
        <p>
          Alignment, cushion, and responsibility are separate from ability
          ratings. Two defenders may carry the same receiver, but complementary
          bracket technique is not modeled.
        </p>
      </div>
    </>
  );
}
