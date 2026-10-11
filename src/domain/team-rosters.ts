import broncosRoster from "./broncos-roster.json";
import type { SandboxScenario } from "./sandbox";
import type { CoverageAssignment } from "./types";
import { baselineAttributes, type PlayerProfile } from "./workspace-extras";

export const TEAM_OPTIONS = [
  { id: "broncos-26-27", label: "2026–27 Denver Broncos" },
] as const;

export function offensivePlayerLabels(scenario: SandboxScenario): Record<string, { name: string; caption: string }> {
  const labels: Record<string, { name: string; caption: string }> = {};
  for (const actor of scenario.players) {
    const profile = scenario.lineup?.[actor.id];
    const rosterPlayer = broncosRoster.players.find((p) => `ea-${p.eaId}` === profile?.id);
    if (!profile || !rosterPlayer || rosterPlayer.side !== "offense") continue;
    const [first, ...rest] = profile.name.split(" ");
    const shortName = rest.length ? `${first[0]}. ${rest.join(" ")}` : first;
    labels[actor.id] = {
      name: `#${rosterPlayer.jerseyNumber} ${profile.name}`,
      caption: `#${rosterPlayer.jerseyNumber} ${shortName}`,
    };
  }
  return labels;
}

const mean = (...values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

function playerProfile(player: (typeof broncosRoster.players)[number]): PlayerProfile {
  if (player.side !== "offense" && player.side !== "defense") {
    throw new Error(`Unsupported lineup side: ${player.side}`);
  }
  const r = player.ratings;
  return {
    id: `ea-${player.eaId}`,
    name: player.name,
    side: player.side,
    positions: player.position,
    ratings: {
      speed: r.speed,
      acceleration: r.acceleration,
      changeOfDirection: r.changeOfDirection,
      reaction: r.awareness,
      manCoverage: r.manCoverage,
      zoneDiscipline: r.zoneCoverage,
    },
    attributes: {
      strength: r.strength,
      awareness: r.awareness,
      stamina: r.stamina,
      throwPower: r.throwPower,
      throwAccuracy: mean(r.throwAccuracyShort, r.throwAccuracyMid, r.throwAccuracyDeep),
      carrying: r.carrying,
      ballVision: r.bCVision,
      breakTackle: r.breakTackle,
      runBlock: r.runBlock,
      passBlock: r.passBlock,
      catching: r.catching,
      routeRunning: mean(r.shortRouteRunning, r.mediumRouteRunning, r.deepRouteRunning),
      release: r.release,
      tackling: r.tackle,
      pursuit: r.pursuit,
    },
    releaseDelay: 0,
    notes: `EA ID ${player.eaId}; Denver Broncos; ${broncosRoster.gameEdition}; ${broncosRoster.iterationId}; overall ${player.overall}. Source: ${broncosRoster.sourcePath} (${broncosRoster.sourceUrl}), captured ${broncosRoster.retrievedAt}. Madden video-game ratings are illustrative, not measured real-world skill. Reaction uses awareness; route running and throw accuracy use short/mid/deep arithmetic means. Release timing is uncalibrated.`,
  };
}

// These are sandbox actor IDs, not EA positions: A is nickel; SL/SR are safeties.
const lineupPositions: Record<string, readonly string[]> = {
  QB: ["QB"],
  C: ["C"],
  X: ["WR"],
  Z: ["WR"],
  H: ["WR"],
  Y: ["TE"],
  RB: ["HB"],
  CBL: ["CB"],
  CBR: ["CB"],
  A: ["CB"],
  SL: ["FS"],
  SR: ["SS"],
  M: ["MIKE", "WILL"],
  W: ["MIKE", "WILL"],
};

/** Apply a local roster snapshot without changing geometry, assignments, or timing. */
export function importTeam(scenario: SandboxScenario, teamId: string): SandboxScenario {
  if (teamId !== TEAM_OPTIONS[0].id) throw new Error(`Unknown team: ${teamId}`);

  const ranked = [...broncosRoster.players].sort(
    (a, b) => b.overall - a.overall || a.eaId - b.eaId,
  );
  const used = new Set<number>();
  const lineup: Record<string, PlayerProfile> = {};
  for (const [actorId, positions] of Object.entries(lineupPositions)) {
    const side = Object.hasOwn(scenario.defenders, actorId) ? "defense" : "offense";
    const player = ranked.find(
      (p) => p.side === side && positions.includes(p.position) && !used.has(p.eaId),
    );
    if (!player) throw new Error(`No position-fit roster player for ${actorId}`);
    used.add(player.eaId);
    lineup[actorId] = playerProfile(player);
  }

  const result = structuredClone(scenario);
  result.lineup = lineup;
  for (const [actorId, settings] of Object.entries(result.receivers)) {
    if (lineup[actorId]) settings.speed = lineup[actorId].ratings.speed;
  }
  for (const [actorId, settings] of Object.entries(result.defenders)) {
    if (lineup[actorId]) settings.ratings = { ...lineup[actorId].ratings };
  }
  return result;
}

export interface PlayerSkillDimension {
  label: string;
  value: number;
}

/** Five illustrative rating dimensions, not a real-world skill assessment. */
export function playerSkillSummary(
  profile: PlayerProfile,
  assignmentType?: CoverageAssignment["type"],
): PlayerSkillDimension[] {
  const attributes = { ...baselineAttributes, ...profile.attributes };
  const positions = (profile.positions ?? "").toUpperCase().split(/[\s,;/|]+/);
  let technique = mean(profile.ratings.manCoverage, profile.ratings.zoneDiscipline);
  if (profile.side === "defense") {
    if (assignmentType === "man") technique = profile.ratings.manCoverage;
    if (assignmentType === "zone") technique = profile.ratings.zoneDiscipline;
  } else if (positions.includes("QB")) {
    technique = attributes.throwAccuracy;
  } else if (positions.includes("C")) {
    technique = attributes.passBlock;
  } else if (positions.some((p) => ["WR", "TE", "HB", "RB"].includes(p))) {
    technique = attributes.routeRunning;
  }
  return [
    { label: "Speed", value: profile.ratings.speed },
    { label: "Acceleration", value: profile.ratings.acceleration },
    { label: "Change of direction", value: profile.ratings.changeOfDirection },
    { label: "Awareness", value: profile.attributes?.awareness ?? profile.ratings.reaction },
    { label: "Technique", value: technique },
  ];
}
