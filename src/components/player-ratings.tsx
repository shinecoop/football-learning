"use client";
import type { PlayerProfile, PlayerAttribute } from "@/domain/workspace-extras";
import {
  baselineAttributes,
  playerAttributeNames,
} from "@/domain/workspace-extras";
import type { RatingKey } from "@/domain/sandbox";
const groups: {
  title: string;
  tone: string;
  skills: { key: RatingKey | PlayerAttribute; label: string; core?: boolean }[];
}[] = [
  {
    title: "General",
    tone: "blue",
    skills: [
      { key: "speed", label: "Top speed", core: true },
      { key: "acceleration", label: "Acceleration", core: true },
      { key: "changeOfDirection", label: "Change of direction", core: true },
      { key: "strength", label: "Strength" },
      { key: "awareness", label: "Awareness" },
      { key: "stamina", label: "Stamina" },
    ],
  },
  {
    title: "Receiving",
    tone: "violet",
    skills: [
      { key: "catching", label: "Catching" },
      { key: "routeRunning", label: "Route running" },
      { key: "release", label: "Release" },
    ],
  },
  {
    title: "Passing",
    tone: "blue",
    skills: [
      { key: "throwPower", label: "Throw power" },
      { key: "throwAccuracy", label: "Throw accuracy" },
    ],
  },
  {
    title: "Ballcarrier",
    tone: "amber",
    skills: [
      { key: "carrying", label: "Ball security" },
      { key: "ballVision", label: "Ballcarrier vision" },
      { key: "breakTackle", label: "Break tackle" },
    ],
  },
  {
    title: "Blocking",
    tone: "amber",
    skills: [
      { key: "runBlock", label: "Run blocking" },
      { key: "passBlock", label: "Pass blocking" },
    ],
  },
  {
    title: "Defense",
    tone: "violet",
    skills: [
      { key: "reaction", label: "Reaction", core: true },
      { key: "tackling", label: "Tackling" },
      { key: "pursuit", label: "Pursuit" },
      { key: "manCoverage", label: "Man coverage", core: true },
      { key: "zoneDiscipline", label: "Zone discipline", core: true },
    ],
  },
];
export function PlayerRatings({
  player,
  onChange,
}: {
  player: PlayerProfile;
  onChange: (p: PlayerProfile) => void;
}) {
  return (
    <>
      <p className="muted-copy">
        One athlete, a complete skill profile. Ratings are editable setup data
        on a 0–100 scale; new football skills are saved for future models.
      </p>
      <div className="player-rating-groups">
        {groups.map((group) => (
          <fieldset
            className={`player-rating-group ${group.tone}`}
            key={group.title}
          >
            <legend>{group.title}</legend>
            {group.skills.map((skill) => {
              const value = skill.core
                ? player.ratings[skill.key as RatingKey]
                : (player.attributes ?? baselineAttributes)[
                    skill.key as PlayerAttribute
                  ];
              return (
                <label className="player-rating" key={skill.key}>
                  <span>
                    {skill.label}
                    <output>{value}</output>
                  </span>
                  <input
                    aria-label={`Player ${skill.label}`}
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    style={
                      { "--rating-fill": `${value}%` } as React.CSSProperties
                    }
                    onChange={(e) =>
                      onChange(
                        skill.core
                          ? {
                              ...player,
                              ratings: {
                                ...player.ratings,
                                [skill.key]: Number(e.target.value),
                              },
                            }
                          : {
                              ...player,
                              attributes: {
                                ...baselineAttributes,
                                ...player.attributes,
                                [skill.key]: Number(e.target.value),
                              },
                            },
                      )
                    }
                  />
                </label>
              );
            })}
          </fieldset>
        ))}
      </div>
      <button
        className="button secondary"
        onClick={() =>
          onChange({
            ...player,
            ratings: Object.fromEntries(
              Object.keys(player.ratings).map((key) => [key, 50]),
            ) as PlayerProfile["ratings"],
            attributes: { ...baselineAttributes },
            releaseDelay: 0,
          })
        }
      >
        Reset player ratings to 50
      </button>
      <span className="sr-only">
        {Object.keys(playerAttributeNames).length} additional skills available.
      </span>
    </>
  );
}
