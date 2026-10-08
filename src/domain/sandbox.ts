import type {
  Coverage,
  CoverageZone,
  PlayerAlignment,
  Route,
  Point,
  SavedPlay,
} from "./types";
import { coverages } from "./coverage";
import { formations } from "./formations";
import { concepts } from "./concepts";
export const SANDBOX_MODEL_VERSION = "assignment-movement-v1";
export const SANDBOX_DURATION = 6;
export const SANDBOX_DT = 0.05;
export const SANDBOX_FORMATIONS = [
  "2x2",
  "trips",
  "bunch",
  "empty",
  "shotgun",
  "singleback",
  "condensed",
  "pistol",
];
export const RECEIVER_IDS = ["X", "H", "Y", "Z", "RB"];
export const SANDBOX_COVERAGES = [
  "cover0",
  "cover1",
  "cover2",
  "cover3",
] as const;
export type SandboxCoverageId = (typeof SANDBOX_COVERAGES)[number];
export type Confidence = "unrated" | "low" | "medium" | "high";
export type RatingKey =
  | "speed"
  | "acceleration"
  | "changeOfDirection"
  | "reaction"
  | "manCoverage"
  | "zoneDiscipline";
export type Ratings = Record<RatingKey, number>;
export interface FilmObservation {
  id: string;
  label: string;
  timestamp: string;
  notes: string;
  sourceUrl: string;
}
export interface OpponentProfile {
  id: string;
  name: string;
  ratings: Ratings;
  uncertainty: number;
  confidence: Confidence;
  notes: string;
  observations: FilmObservation[];
  updatedAt: string;
}
export interface ReceiverSettings {
  speed: number;
  releaseDelay: number;
}
export interface DefenderSettings {
  zone?: CoverageZone;
  x: number;
  y: number;
  cushion: number;
  assignment: Coverage["assignments"][number];
  ratings?: Ratings;
}
export interface SandboxScenario {
  modelVersion: string;
  profileSnapshot?: OpponentProfile;
  version: 1;
  id: string;
  name: string;
  formationId: string;
  conceptId: string;
  coverageId: SandboxCoverageId;
  players: PlayerAlignment[];
  routes: Route[];
  receivers: Record<string, ReceiverSettings>;
  defenders: Record<string, DefenderSettings>;
  profileId: string;
  releaseTime: number;
  pressureTime: number;
  targetId: string;
  notes: string;
  updatedAt: string;
}
export interface ReplayFrame {
  seconds: number;
  positions: Record<string, Point>;
}
export interface WindowMetric {
  receiverId: string;
  nearestDefenderId: string;
  separation: number;
  laneClearance: number;
}
export interface ReplayResult {
  modelVersion: string;
  frames: ReplayFrame[];
  release: ReplayFrame;
  windows: WindowMetric[];
  pressureExpired: boolean;
  warnings: string[];
}
export const ratingDefinitions: {
  key: RatingKey;
  label: string;
  observable: string;
  low: string;
  high: string;
}[] = [
  {
    key: "speed",
    label: "Top speed",
    observable:
      "Compare sustained closing distance on similar straight-line routes.",
    low: "Loses ground once the receiver reaches stride.",
    high: "Can recover ground over a sustained chase.",
  },
  {
    key: "acceleration",
    label: "Acceleration",
    observable: "Watch the first several steps after the break or release.",
    low: "Takes longer to reach chase speed.",
    high: "Closes quickly in the first few steps.",
  },
  {
    key: "changeOfDirection",
    label: "Change of direction",
    observable:
      "Compare recovery after direction changes, not straight-line speed.",
    low: "Needs a larger turning arc.",
    high: "Redirects with less path lost.",
  },
  {
    key: "reaction",
    label: "Reaction speed",
    observable:
      "Estimate delay between a visible route break and defender movement.",
    low: "Responds after a longer visible delay.",
    high: "Begins redirecting soon after the break.",
  },
  {
    key: "manCoverage",
    label: "Man technique",
    observable:
      "Note release leverage and how closely the defender relates to the assigned receiver.",
    low: "Carries a larger pursuit offset in this model.",
    high: "Carries a smaller pursuit offset in this model.",
  },
  {
    key: "zoneDiscipline",
    label: "Zone discipline",
    observable:
      "Watch positioning relative to the declared landmark and routes entering that responsibility.",
    low: "Less landmark weight; follows a threat farther.",
    high: "More landmark weight; stays related to the zone.",
  },
];
export const typicalRatings: Ratings = {
  speed: 50,
  acceleration: 50,
  changeOfDirection: 50,
  reaction: 50,
  manCoverage: 50,
  zoneDiscipline: 50,
};
export function newProfile(
  preset: "low" | "typical" | "high" = "typical",
  id = "default",
): OpponentProfile {
  const value = preset === "low" ? 30 : preset === "high" ? 70 : 50;
  return {
    id,
    name:
      preset === "typical"
        ? "Uncalibrated baseline"
        : `${preset === "low" ? "Lower" : "Higher"} movement assumptions`,
    ratings: Object.fromEntries(
      ratingDefinitions.map((r) => [r.key, value]),
    ) as Ratings,
    uncertainty: 15,
    confidence: "unrated",
    notes:
      "Illustrative movement assumptions. No film or tracking calibration has been applied.",
    observations: [],
    updatedAt: new Date(0).toISOString(),
  };
}
export function sandboxPlayers(formationId = "2x2"): PlayerAlignment[] {
  return structuredClone(
    (
      formations.find((f) => f.id === formationId) ?? formations[0]
    ).players.filter((p) => p.position !== "OL" || p.id === "C"),
  );
}
export function sandboxCoverage(id: SandboxCoverageId): Coverage {
  const original = structuredClone(coverages.find((c) => c.id === id)!);
  original.defenders = original.defenders.filter((d) => d.position !== "DL");
  original.assignments = original.assignments.filter((a) =>
    original.defenders.some((d) => d.id === a.defenderId),
  );
  if (id === "cover0") {
    for (const defenderId of ["M", "SL"]) {
      const assignment = original.assignments.find(
        (a) => a.defenderId === defenderId,
      )!;
      assignment.type = "zone";
      assignment.targetId = undefined;
      assignment.destination = { x: defenderId === "M" ? 52 : 33, y: 57 };
      assignment.responsibility =
        "Underneath helper with no dedicated deep safety. This seven-on-seven example has no live rush.";
      original.zones.push({
        id: `sandbox-${defenderId}`,
        defenderId,
        name: "Underneath help",
        x: defenderId === "M" ? 42 : 23,
        y: 47,
        width: 20,
        height: 18,
      });
    }
  }
  original.summary = `${original.summary} Seven coverage defenders are shown; this sandbox omits live pass rush.`;
  return original;
}
export function createScenario(
  conceptId = "smash",
  coverageId: SandboxCoverageId = "cover2",
  formationId = "2x2",
): SandboxScenario {
  if (!SANDBOX_FORMATIONS.includes(formationId)) formationId = "2x2";
  const players = sandboxPlayers(formationId);
  const concept = concepts.find((c) => c.id === conceptId) ?? concepts[3];
  const coverage = sandboxCoverage(coverageId);
  const routes = structuredClone(concept.routes).map((route) => {
    const p = players.find((p) => p.id === route.playerId)!;
    const start = route.waypoints[0];
    return {
      ...route,
      waypoints: route.waypoints.map((w) => ({
        x: Math.max(3, Math.min(97, w.x + p.x - start.x)),
        y: Math.max(3, Math.min(96, w.y + p.y - start.y)),
      })),
    };
  });
  return {
    modelVersion: SANDBOX_MODEL_VERSION,
    version: 1,
    id: "draft",
    name: `${concept.name} exploration`,
    formationId,
    conceptId: concept.id,
    coverageId,
    players,
    routes,
    receivers: Object.fromEntries(
      RECEIVER_IDS.filter((id) => players.some((p) => p.id === id)).map(
        (id) => [id, { speed: 50, releaseDelay: 0 }],
      ),
    ),
    defenders: Object.fromEntries(
      coverage.defenders.map((d) => [
        d.id,
        {
          x: d.x,
          y: d.y,
          cushion: 0,
          assignment: structuredClone(
            coverage.assignments.find((a) => a.defenderId === d.id)!,
          ),
        },
      ]),
    ),
    profileId: "default",
    releaseTime: 2.4,
    pressureTime: 3.5,
    targetId: "Y",
    notes: "",
    updatedAt: new Date(0).toISOString(),
  };
}
export function withCoverage(
  scenario: SandboxScenario,
  id: SandboxCoverageId,
): SandboxScenario {
  const coverage = sandboxCoverage(id);
  return {
    ...scenario,
    coverageId: id,
    defenders: Object.fromEntries(
      coverage.defenders.map((d) => [
        d.id,
        {
          x: d.x,
          y: d.y,
          cushion: 0,
          assignment: structuredClone(
            coverage.assignments.find((a) => a.defenderId === d.id)!,
          ),
        },
      ]),
    ),
  };
}
export function scenarioCoverage(scenario: SandboxScenario): Coverage {
  const coverage = sandboxCoverage(scenario.coverageId);
  return {
    ...coverage,
    defenders: coverage.defenders.map((d) => ({
      ...d,
      x: scenario.defenders[d.id].x,
      y: Math.max(
        3,
        Math.min(
          69,
          scenario.defenders[d.id].y - scenario.defenders[d.id].cushion * 2,
        ),
      ),
    })),
    assignments: coverage.defenders.map(
      (d) => scenario.defenders[d.id].assignment,
    ),
    zones: coverage.defenders
      .filter((d) => scenario.defenders[d.id].assignment.type === "zone")
      .map(
        (d) =>
          scenario.defenders[d.id].zone ??
          coverage.zones.find((z) => z.defenderId === d.id) ??
          fallbackZone(d.id, scenario.defenders[d.id].assignment.destination),
      ),
  };
}

export function fallbackZone(defenderId: string, center: Point): CoverageZone {
  return {
    id: `custom-${defenderId}`,
    defenderId,
    name: "Custom zone",
    x: Math.max(3, Math.min(73, center.x - 12)),
    y: Math.max(3, Math.min(74, center.y - 11)),
    width: 24,
    height: 22,
  };
}

export function scenarioFromDesigner(play: SavedPlay): SandboxScenario {
  const scenario = createScenario("smash", "cover3", play.formationId);
  return {
    ...scenario,
    name: play.name,
    conceptId: "custom",
    players: structuredClone(
      play.players.filter((p) => p.position !== "OL" || p.id === "C"),
    ),
    routes: structuredClone(
      play.routes.filter((r) => RECEIVER_IDS.includes(r.playerId)),
    ),
    notes:
      "Imported from the eleven-player designer. Linemen other than the center are omitted; coverage and timing are new sandbox assumptions.",
  };
}
